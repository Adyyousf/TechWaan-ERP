import {
  users,
  items,
  customers,
  vendors,
  inventory,
  stockMovements,
  bills,
  billItems,
  purchases,
  purchaseItems,
  type User,
  type UpsertUser,
  type Item,
  type InsertItem,
  type ItemWithInventory,
  type Customer,
  type InsertCustomer,
  type Vendor,
  type InsertVendor,
  type Inventory,
  type InsertInventory,
  type StockMovement,
  type InsertStockMovement,
  type Bill,
  type InsertBill,
  type BillItem,
  type InsertBillItem,
  type BillWithDetails,
  type Purchase,
  type InsertPurchase,
  type PurchaseItem,
  type InsertPurchaseItem,
  type PurchaseWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, like, sql, and, lt } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Item operations
  getItems(): Promise<ItemWithInventory[]>;
  getItem(id: string): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: string, item: Partial<InsertItem>): Promise<Item>;
  deleteItem(id: string): Promise<void>;
  searchItems(query: string): Promise<ItemWithInventory[]>;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  // Vendor operations
  getVendors(): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor>;
  deleteVendor(id: string): Promise<void>;

  // Inventory operations
  getInventory(): Promise<(Inventory & { item: Item })[]>;
  getInventoryByItem(itemId: string): Promise<Inventory | undefined>;
  updateInventory(itemId: string, quantity: number): Promise<Inventory>;
  getLowStockItems(): Promise<ItemWithInventory[]>;

  // Stock movement operations
  getStockMovements(): Promise<(StockMovement & { item: Item })[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;

  // Bill operations
  getBills(): Promise<BillWithDetails[]>;
  getBill(id: string): Promise<BillWithDetails | undefined>;
  createBill(bill: InsertBill, billItems: InsertBillItem[]): Promise<BillWithDetails>;
  updateBillStatus(id: string, status: string): Promise<Bill>;
  getNextBillNumber(): Promise<string>;

  // Purchase operations
  getPurchases(): Promise<PurchaseWithDetails[]>;
  getPurchase(id: string): Promise<PurchaseWithDetails | undefined>;
  createPurchase(purchase: InsertPurchase, purchaseItems: InsertPurchaseItem[]): Promise<PurchaseWithDetails>;
  getNextPurchaseNumber(): Promise<string>;

  // Analytics operations
  getDashboardStats(): Promise<{
    totalItems: number;
    totalCustomers: number;
    monthlySales: string;
    lowStockItems: number;
    todaysSales: string;
    billsGenerated: number;
    totalGST: string;
    pendingBills: number;
  }>;

  getRecentTransactions(): Promise<{
    type: 'sale' | 'purchase';
    amount: string;
    description: string;
    createdAt: Date;
  }[]>;

  getTopSellingItems(): Promise<{
    item: Item;
    totalSold: number;
    totalRevenue: string;
  }[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Item operations
  async getItems(): Promise<ItemWithInventory[]> {
    const result = await db
      .select({
        item: items,
        inventory: inventory,
      })
      .from(items)
      .leftJoin(inventory, eq(items.id, inventory.itemId))
      .orderBy(asc(items.name));

    return result.map(({ item, inventory: inv }) => ({
      ...item,
      inventory: inv || undefined,
      currentStock: inv?.quantity || 0,
      isLowStock: (inv?.quantity || 0) <= item.lowStockThreshold,
    }));
  }

  async getItem(id: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async createItem(item: InsertItem): Promise<Item> {
    const [newItem] = await db.insert(items).values(item).returning();
    
    // Create initial inventory entry
    await db.insert(inventory).values({
      itemId: newItem.id,
      quantity: 0,
    });

    return newItem;
  }

  async updateItem(id: string, item: Partial<InsertItem>): Promise<Item> {
    const [updatedItem] = await db
      .update(items)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(items.id, id))
      .returning();
    return updatedItem;
  }

  async deleteItem(id: string): Promise<void> {
    await db.delete(items).where(eq(items.id, id));
  }

  async searchItems(query: string): Promise<ItemWithInventory[]> {
    const result = await db
      .select({
        item: items,
        inventory: inventory,
      })
      .from(items)
      .leftJoin(inventory, eq(items.id, inventory.itemId))
      .where(
        like(items.name, `%${query}%`)
      )
      .orderBy(asc(items.name));

    return result.map(({ item, inventory: inv }) => ({
      ...item,
      inventory: inv || undefined,
      currentStock: inv?.quantity || 0,
      isLowStock: (inv?.quantity || 0) <= item.lowStockThreshold,
    }));
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(asc(customers.name));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Vendor operations
  async getVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors).orderBy(asc(vendors.name));
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db.insert(vendors).values(vendor).returning();
    return newVendor;
  }

  async updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor> {
    const [updatedVendor] = await db
      .update(vendors)
      .set({ ...vendor, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return updatedVendor;
  }

  async deleteVendor(id: string): Promise<void> {
    await db.delete(vendors).where(eq(vendors.id, id));
  }

  // Inventory operations
  async getInventory(): Promise<(Inventory & { item: Item })[]> {
    const result = await db
      .select({
        inventory: inventory,
        item: items,
      })
      .from(inventory)
      .innerJoin(items, eq(inventory.itemId, items.id))
      .orderBy(asc(items.name));

    return result.map(({ inventory: inv, item }) => ({
      ...inv,
      item,
    }));
  }

  async getInventoryByItem(itemId: string): Promise<Inventory | undefined> {
    const [inv] = await db.select().from(inventory).where(eq(inventory.itemId, itemId));
    return inv;
  }

  async updateInventory(itemId: string, quantity: number): Promise<Inventory> {
    const [updatedInventory] = await db
      .update(inventory)
      .set({ quantity, lastUpdated: new Date() })
      .where(eq(inventory.itemId, itemId))
      .returning();
    return updatedInventory;
  }

  async getLowStockItems(): Promise<ItemWithInventory[]> {
    const result = await db
      .select({
        item: items,
        inventory: inventory,
      })
      .from(items)
      .innerJoin(inventory, eq(items.id, inventory.itemId))
      .where(sql`${inventory.quantity} <= ${items.lowStockThreshold}`)
      .orderBy(asc(inventory.quantity));

    return result.map(({ item, inventory: inv }) => ({
      ...item,
      inventory: inv,
      currentStock: inv.quantity,
      isLowStock: true,
    }));
  }

  // Stock movement operations
  async getStockMovements(): Promise<(StockMovement & { item: Item })[]> {
    const result = await db
      .select({
        stockMovement: stockMovements,
        item: items,
      })
      .from(stockMovements)
      .innerJoin(items, eq(stockMovements.itemId, items.id))
      .orderBy(desc(stockMovements.createdAt))
      .limit(50);

    return result.map(({ stockMovement, item }) => ({
      ...stockMovement,
      item,
    }));
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const [newMovement] = await db.insert(stockMovements).values(movement).returning();
    
    // Update inventory quantity
    const currentInventory = await this.getInventoryByItem(movement.itemId);
    if (currentInventory) {
      let newQuantity = currentInventory.quantity;
      if (movement.type === 'purchase') {
        newQuantity += movement.quantity;
      } else if (movement.type === 'sale') {
        newQuantity -= movement.quantity;
      } else if (movement.type === 'adjustment') {
        newQuantity = movement.quantity;
      }
      await this.updateInventory(movement.itemId, Math.max(0, newQuantity));
    }

    return newMovement;
  }

  // Bill operations
  async getBills(): Promise<BillWithDetails[]> {
    const result = await db
      .select({
        bill: bills,
        customer: customers,
      })
      .from(bills)
      .innerJoin(customers, eq(bills.customerId, customers.id))
      .orderBy(desc(bills.createdAt));

    const billsWithItems = await Promise.all(
      result.map(async ({ bill, customer }) => {
        const billItemsResult = await db
          .select({
            billItem: billItems,
            item: items,
          })
          .from(billItems)
          .innerJoin(items, eq(billItems.itemId, items.id))
          .where(eq(billItems.billId, bill.id));

        return {
          ...bill,
          customer,
          billItems: billItemsResult.map(({ billItem, item }) => ({
            ...billItem,
            item,
          })),
        };
      })
    );

    return billsWithItems;
  }

  async getBill(id: string): Promise<BillWithDetails | undefined> {
    const [billResult] = await db
      .select({
        bill: bills,
        customer: customers,
      })
      .from(bills)
      .innerJoin(customers, eq(bills.customerId, customers.id))
      .where(eq(bills.id, id));

    if (!billResult) return undefined;

    const billItemsResult = await db
      .select({
        billItem: billItems,
        item: items,
      })
      .from(billItems)
      .innerJoin(items, eq(billItems.itemId, items.id))
      .where(eq(billItems.billId, id));

    return {
      ...billResult.bill,
      customer: billResult.customer,
      billItems: billItemsResult.map(({ billItem, item }) => ({
        ...billItem,
        item,
      })),
    };
  }

  async createBill(bill: InsertBill, billItemsData: InsertBillItem[]): Promise<BillWithDetails> {
    const [newBill] = await db.insert(bills).values(bill).returning();

    // Insert bill items
    const billItemsWithBillId = billItemsData.map(item => ({
      ...item,
      billId: newBill.id,
    }));
    await db.insert(billItems).values(billItemsWithBillId);

    // Create stock movements for each item
    for (const billItem of billItemsData) {
      await this.createStockMovement({
        itemId: billItem.itemId,
        type: 'sale',
        quantity: billItem.quantity,
        reason: `Sale - Bill ${newBill.billNumber}`,
      });
    }

    return this.getBill(newBill.id) as Promise<BillWithDetails>;
  }

  async updateBillStatus(id: string, status: string): Promise<Bill> {
    const [updatedBill] = await db
      .update(bills)
      .set({ status })
      .where(eq(bills.id, id))
      .returning();
    return updatedBill;
  }

  async getNextBillNumber(): Promise<string> {
    const [lastBill] = await db
      .select({ billNumber: bills.billNumber })
      .from(bills)
      .orderBy(desc(bills.createdAt))
      .limit(1);

    if (!lastBill) {
      return "INV-2024-001";
    }

    const lastNumber = parseInt(lastBill.billNumber.split('-')[2]);
    return `INV-2024-${String(lastNumber + 1).padStart(3, '0')}`;
  }

  // Purchase operations
  async getPurchases(): Promise<PurchaseWithDetails[]> {
    const result = await db
      .select({
        purchase: purchases,
        vendor: vendors,
      })
      .from(purchases)
      .innerJoin(vendors, eq(purchases.vendorId, vendors.id))
      .orderBy(desc(purchases.createdAt));

    const purchasesWithItems = await Promise.all(
      result.map(async ({ purchase, vendor }) => {
        const purchaseItemsResult = await db
          .select({
            purchaseItem: purchaseItems,
            item: items,
          })
          .from(purchaseItems)
          .innerJoin(items, eq(purchaseItems.itemId, items.id))
          .where(eq(purchaseItems.purchaseId, purchase.id));

        return {
          ...purchase,
          vendor,
          purchaseItems: purchaseItemsResult.map(({ purchaseItem, item }) => ({
            ...purchaseItem,
            item,
          })),
        };
      })
    );

    return purchasesWithItems;
  }

  async getPurchase(id: string): Promise<PurchaseWithDetails | undefined> {
    const [purchaseResult] = await db
      .select({
        purchase: purchases,
        vendor: vendors,
      })
      .from(purchases)
      .innerJoin(vendors, eq(purchases.vendorId, vendors.id))
      .where(eq(purchases.id, id));

    if (!purchaseResult) return undefined;

    const purchaseItemsResult = await db
      .select({
        purchaseItem: purchaseItems,
        item: items,
      })
      .from(purchaseItems)
      .innerJoin(items, eq(purchaseItems.itemId, items.id))
      .where(eq(purchaseItems.purchaseId, id));

    return {
      ...purchaseResult.purchase,
      vendor: purchaseResult.vendor,
      purchaseItems: purchaseItemsResult.map(({ purchaseItem, item }) => ({
        ...purchaseItem,
        item,
      })),
    };
  }

  async createPurchase(purchase: InsertPurchase, purchaseItemsData: InsertPurchaseItem[]): Promise<PurchaseWithDetails> {
    const [newPurchase] = await db.insert(purchases).values(purchase).returning();

    // Insert purchase items
    const purchaseItemsWithPurchaseId = purchaseItemsData.map(item => ({
      ...item,
      purchaseId: newPurchase.id,
    }));
    await db.insert(purchaseItems).values(purchaseItemsWithPurchaseId);

    // Create stock movements for each item
    for (const purchaseItem of purchaseItemsData) {
      await this.createStockMovement({
        itemId: purchaseItem.itemId,
        type: 'purchase',
        quantity: purchaseItem.quantity,
        reason: `Purchase - ${newPurchase.purchaseNumber}`,
      });
    }

    return this.getPurchase(newPurchase.id) as Promise<PurchaseWithDetails>;
  }

  async getNextPurchaseNumber(): Promise<string> {
    const [lastPurchase] = await db
      .select({ purchaseNumber: purchases.purchaseNumber })
      .from(purchases)
      .orderBy(desc(purchases.createdAt))
      .limit(1);

    if (!lastPurchase) {
      return "PUR-2024-001";
    }

    const lastNumber = parseInt(lastPurchase.purchaseNumber.split('-')[2]);
    return `PUR-2024-${String(lastNumber + 1).padStart(3, '0')}`;
  }

  // Analytics operations
  async getDashboardStats() {
    const [itemCount] = await db.select({ count: sql`count(*)`.mapWith(Number) }).from(items);
    const [customerCount] = await db.select({ count: sql`count(*)`.mapWith(Number) }).from(customers);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [monthlySalesResult] = await db
      .select({ total: sql`coalesce(sum(${bills.total}), 0)` })
      .from(bills)
      .where(and(
        sql`${bills.status} IN ('paid', 'pending')`,
        sql`${bills.billDate} >= ${thirtyDaysAgo}`
      ));

    const [todaysSalesResult] = await db
      .select({ total: sql`coalesce(sum(${bills.total}), 0)` })
      .from(bills)
      .where(and(
        sql`${bills.status} IN ('paid', 'pending')`,
        sql`${bills.billDate} >= ${today}`
      ));

    const [todaysBillsResult] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(bills)
      .where(sql`${bills.billDate} >= ${today}`);

    const [todaysGSTResult] = await db
      .select({ total: sql`coalesce(sum(${bills.gstAmount}), 0)` })
      .from(bills)
      .where(sql`${bills.billDate} >= ${today}`);

    const [pendingBillsResult] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(bills)
      .where(eq(bills.status, 'pending'));

    const lowStockItems = await this.getLowStockItems();

    return {
      totalItems: itemCount.count,
      totalCustomers: customerCount.count,
      monthlySales: (monthlySalesResult.total as string || '0'),
      lowStockItems: lowStockItems.length,
      todaysSales: (todaysSalesResult.total as string || '0'),
      billsGenerated: todaysBillsResult.count,
      totalGST: (todaysGSTResult.total as string || '0'),
      pendingBills: pendingBillsResult.count,
    };
  }

  async getRecentTransactions() {
    const salesTransactions = await db
      .select({
        id: bills.id,
        total: bills.total,
        description: sql`'Sale to ' || ${customers.name}`,
        createdAt: bills.createdAt,
        type: sql`'sale'`,
      })
      .from(bills)
      .innerJoin(customers, eq(bills.customerId, customers.id))
      .orderBy(desc(bills.createdAt))
      .limit(10);

    const purchaseTransactions = await db
      .select({
        id: purchases.id,
        total: purchases.total,
        description: sql`'Purchase from ' || ${vendors.name}`,
        createdAt: purchases.createdAt,
        type: sql`'purchase'`,
      })
      .from(purchases)
      .innerJoin(vendors, eq(purchases.vendorId, vendors.id))
      .orderBy(desc(purchases.createdAt))
      .limit(10);

    const allTransactions = [
      ...salesTransactions.map(t => ({
        type: t.type as 'sale' | 'purchase',
        amount: t.total.toString(),
        description: t.description as string,
        createdAt: t.createdAt!,
      })),
      ...purchaseTransactions.map(t => ({
        type: t.type as 'sale' | 'purchase',
        amount: t.total.toString(),
        description: t.description as string,
        createdAt: t.createdAt!,
      }))
    ];

    return allTransactions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }

  async getTopSellingItems() {
    const result = await db
      .select({
        item: items,
        totalSold: sql`sum(${billItems.quantity})`.mapWith(Number),
        totalRevenue: sql`sum(${billItems.amount})`,
      })
      .from(billItems)
      .innerJoin(items, eq(billItems.itemId, items.id))
      .groupBy(items.id, items.name, items.code, items.description, items.category, items.price, items.gstRate, items.unit, items.lowStockThreshold, items.createdAt, items.updatedAt)
      .orderBy(desc(sql`sum(${billItems.quantity})`))
      .limit(10);

    return result.map(({ item, totalSold, totalRevenue }) => ({
      item,
      totalSold,
      totalRevenue: (totalRevenue as string || '0'),
    }));
  }
}

export const storage = new DatabaseStorage();
