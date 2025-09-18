import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertItemSchema,
  insertCustomerSchema,
  insertVendorSchema,
  insertStockMovementSchema,
  insertBillSchema,
  insertBillItemSchema,
  insertPurchaseSchema,
  insertPurchaseItemSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/recent-transactions', isAuthenticated, async (req, res) => {
    try {
      const transactions = await storage.getRecentTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      res.status(500).json({ message: "Failed to fetch recent transactions" });
    }
  });

  app.get('/api/dashboard/top-selling-items', isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getTopSellingItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching top selling items:", error);
      res.status(500).json({ message: "Failed to fetch top selling items" });
    }
  });

  // Items routes
  app.get('/api/items', isAuthenticated, async (req, res) => {
    try {
      const { search } = req.query;
      let items;
      if (search && typeof search === 'string') {
        items = await storage.searchItems(search);
      } else {
        items = await storage.getItems();
      }
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get('/api/items/:id', isAuthenticated, async (req, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.post('/api/items', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertItemSchema.parse(req.body);
      const item = await storage.createItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating item:", error);
      if (error && typeof error === 'object' && 'issues' in error) {
        console.error("Validation issues:", error.issues);
        res.status(400).json({ 
          message: "Invalid item data",
          validationErrors: error.issues 
        });
      } else {
        res.status(400).json({ message: "Invalid item data" });
      }
    }
  });

  app.patch('/api/items/:id', isAuthenticated, async (req, res) => {
    try {
      const item = await storage.updateItem(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      console.error("Error updating item:", error);
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  app.delete('/api/items/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Customers routes
  app.get('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(400).json({ message: "Invalid customer data" });
    }
  });

  app.patch('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Vendors routes
  app.get('/api/vendors', isAuthenticated, async (req, res) => {
    try {
      const vendors = await storage.getVendors();
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  app.get('/api/vendors/:id', isAuthenticated, async (req, res) => {
    try {
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error fetching vendor:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });

  app.post('/api/vendors', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(validatedData);
      res.status(201).json(vendor);
    } catch (error) {
      console.error("Error creating vendor:", error);
      res.status(400).json({ message: "Invalid vendor data" });
    }
  });

  app.patch('/api/vendors/:id', isAuthenticated, async (req, res) => {
    try {
      const vendor = await storage.updateVendor(req.params.id, req.body);
      res.json(vendor);
    } catch (error) {
      console.error("Error updating vendor:", error);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  app.delete('/api/vendors/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteVendor(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      res.status(500).json({ message: "Failed to delete vendor" });
    }
  });

  // Inventory routes
  app.get('/api/inventory', isAuthenticated, async (req, res) => {
    try {
      const inventory = await storage.getInventory();
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get('/api/inventory/low-stock', isAuthenticated, async (req, res) => {
    try {
      const lowStockItems = await storage.getLowStockItems();
      res.json(lowStockItems);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  app.patch('/api/inventory/:itemId', isAuthenticated, async (req, res) => {
    try {
      const { quantity } = req.body;
      if (typeof quantity !== 'number') {
        return res.status(400).json({ message: "Quantity must be a number" });
      }
      const inventory = await storage.updateInventory(req.params.itemId, quantity);
      res.json(inventory);
    } catch (error) {
      console.error("Error updating inventory:", error);
      res.status(500).json({ message: "Failed to update inventory" });
    }
  });

  // Stock movements routes
  app.get('/api/stock-movements', isAuthenticated, async (req, res) => {
    try {
      const movements = await storage.getStockMovements();
      res.json(movements);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      res.status(500).json({ message: "Failed to fetch stock movements" });
    }
  });

  app.post('/api/stock-movements', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertStockMovementSchema.parse(req.body);
      const movement = await storage.createStockMovement(validatedData);
      res.status(201).json(movement);
    } catch (error) {
      console.error("Error creating stock movement:", error);
      res.status(400).json({ message: "Invalid stock movement data" });
    }
  });

  // Bills routes
  app.get('/api/bills', isAuthenticated, async (req, res) => {
    try {
      const bills = await storage.getBills();
      res.json(bills);
    } catch (error) {
      console.error("Error fetching bills:", error);
      res.status(500).json({ message: "Failed to fetch bills" });
    }
  });

  app.get('/api/bills/:id', isAuthenticated, async (req, res) => {
    try {
      const bill = await storage.getBill(req.params.id);
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      res.json(bill);
    } catch (error) {
      console.error("Error fetching bill:", error);
      res.status(500).json({ message: "Failed to fetch bill" });
    }
  });

  app.post('/api/bills', isAuthenticated, async (req: any, res) => {
    try {
      const { bill: billData, billItems: billItemsData } = req.body;
      
      // Get next bill number
      const billNumber = await storage.getNextBillNumber();
      
      const validatedBill = insertBillSchema.parse({
        ...billData,
        billNumber,
        createdBy: req.user.claims.sub,
      });

      const validatedBillItems = billItemsData.map((item: any) =>
        insertBillItemSchema.parse(item)
      );

      const bill = await storage.createBill(validatedBill, validatedBillItems);
      res.status(201).json(bill);
    } catch (error) {
      console.error("Error creating bill:", error);
      res.status(400).json({ message: "Invalid bill data" });
    }
  });

  app.patch('/api/bills/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const bill = await storage.updateBillStatus(req.params.id, status);
      res.json(bill);
    } catch (error) {
      console.error("Error updating bill status:", error);
      res.status(500).json({ message: "Failed to update bill status" });
    }
  });

  app.get('/api/bills/next-number', isAuthenticated, async (req, res) => {
    try {
      const nextNumber = await storage.getNextBillNumber();
      res.json({ billNumber: nextNumber });
    } catch (error) {
      console.error("Error getting next bill number:", error);
      res.status(500).json({ message: "Failed to get next bill number" });
    }
  });

  // Purchases routes
  app.get('/api/purchases', isAuthenticated, async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.get('/api/purchases/:id', isAuthenticated, async (req, res) => {
    try {
      const purchase = await storage.getPurchase(req.params.id);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      res.json(purchase);
    } catch (error) {
      console.error("Error fetching purchase:", error);
      res.status(500).json({ message: "Failed to fetch purchase" });
    }
  });

  app.post('/api/purchases', isAuthenticated, async (req: any, res) => {
    try {
      const { purchase: purchaseData, purchaseItems: purchaseItemsData } = req.body;
      
      // Get next purchase number
      const purchaseNumber = await storage.getNextPurchaseNumber();
      
      const validatedPurchase = insertPurchaseSchema.parse({
        ...purchaseData,
        purchaseNumber,
        createdBy: req.user.claims.sub,
      });

      const validatedPurchaseItems = purchaseItemsData.map((item: any) =>
        insertPurchaseItemSchema.parse(item)
      );

      const purchase = await storage.createPurchase(validatedPurchase, validatedPurchaseItems);
      res.status(201).json(purchase);
    } catch (error) {
      console.error("Error creating purchase:", error);
      res.status(400).json({ message: "Invalid purchase data" });
    }
  });

  app.get('/api/purchases/next-number', isAuthenticated, async (req, res) => {
    try {
      const nextNumber = await storage.getNextPurchaseNumber();
      res.json({ purchaseNumber: nextNumber });
    } catch (error) {
      console.error("Error getting next purchase number:", error);
      res.status(500).json({ message: "Failed to get next purchase number" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
