import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("sales"), // admin or sales
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Items table
export const items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull().unique(),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).notNull().default("18.00"),
  unit: varchar("unit").notNull().default("pcs"),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  gstin: varchar("gstin"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  pinCode: varchar("pin_code"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vendors table
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  gstin: varchar("gstin"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  pinCode: varchar("pin_code"),
  category: varchar("category"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory table
export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => items.id),
  quantity: integer("quantity").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Stock movements table
export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => items.id),
  type: varchar("type").notNull(), // 'purchase', 'sale', 'adjustment'
  quantity: integer("quantity").notNull(),
  reason: varchar("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bills table
export const bills = pgTable("bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billNumber: varchar("bill_number").notNull().unique(),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"), // pending, paid, cancelled
  billDate: timestamp("bill_date").defaultNow(),
  dueDate: timestamp("due_date"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bill items table
export const billItems = pgTable("bill_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billId: varchar("bill_id").notNull().references(() => bills.id),
  itemId: varchar("item_id").notNull().references(() => items.id),
  quantity: integer("quantity").notNull(),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
});

// Purchases table
export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseNumber: varchar("purchase_number").notNull().unique(),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  purchaseDate: timestamp("purchase_date").defaultNow(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Purchase items table
export const purchaseItems = pgTable("purchase_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseId: varchar("purchase_id").notNull().references(() => purchases.id),
  itemId: varchar("item_id").notNull().references(() => items.id),
  quantity: integer("quantity").notNull(),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
});

// Relations
export const itemsRelations = relations(items, ({ many }) => ({
  inventory: many(inventory),
  stockMovements: many(stockMovements),
  billItems: many(billItems),
  purchaseItems: many(purchaseItems),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  item: one(items, {
    fields: [inventory.itemId],
    references: [items.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  bills: many(bills),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  purchases: many(purchases),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  customer: one(customers, {
    fields: [bills.customerId],
    references: [customers.id],
  }),
  createdByUser: one(users, {
    fields: [bills.createdBy],
    references: [users.id],
  }),
  billItems: many(billItems),
}));

export const billItemsRelations = relations(billItems, ({ one }) => ({
  bill: one(bills, {
    fields: [billItems.billId],
    references: [bills.id],
  }),
  item: one(items, {
    fields: [billItems.itemId],
    references: [items.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [purchases.vendorId],
    references: [vendors.id],
  }),
  createdByUser: one(users, {
    fields: [purchases.createdBy],
    references: [users.id],
  }),
  purchaseItems: many(purchaseItems),
}));

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchaseId],
    references: [purchases.id],
  }),
  item: one(items, {
    fields: [purchaseItems.itemId],
    references: [items.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertItemSchema = createInsertSchema(items, {
  price: z.coerce.number().min(0, "Price must be positive"),
  gstRate: z.coerce.number().min(0, "GST rate must be positive"),
  lowStockThreshold: z.coerce.number().int().min(0, "Low stock threshold must be a positive integer"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  lastUpdated: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
});

export const insertBillSchema = createInsertSchema(bills, {
  subtotal: z.coerce.number().min(0, "Subtotal must be positive"),
  gstAmount: z.coerce.number().min(0, "GST amount must be positive"),
  total: z.coerce.number().min(0, "Total must be positive"),
  billDate: z.preprocess(
    v => v === "" || v == null ? undefined : v,
    z.coerce.date().optional()
  ),
  dueDate: z.preprocess(
    v => v === "" ? null : v,
    z.union([z.coerce.date(), z.null()]).optional()
  ),
}).omit({
  id: true,
  createdAt: true,
});

export const insertBillItemSchema = createInsertSchema(billItems, {
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  rate: z.coerce.number().min(0, "Rate must be positive"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
}).omit({
  id: true,
  billId: true,  // billId is added by the server, not sent by client
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  createdAt: true,
});

export const insertPurchaseItemSchema = createInsertSchema(purchaseItems).omit({
  id: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;
export type BillItem = typeof billItems.$inferSelect;
export type InsertBillItem = z.infer<typeof insertBillItemSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type InsertPurchaseItem = z.infer<typeof insertPurchaseItemSchema>;

// Extended types for API responses
export type ItemWithInventory = Item & {
  inventory?: Inventory;
  currentStock: number;
  isLowStock: boolean;
};

export type BillWithDetails = Bill & {
  customer: Customer;
  billItems: (BillItem & { item: Item })[];
};

export type PurchaseWithDetails = Purchase & {
  vendor: Vendor;
  purchaseItems: (PurchaseItem & { item: Item })[];
};
