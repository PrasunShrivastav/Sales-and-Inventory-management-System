import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import {
  insertProductSchema,
  insertSaleSchema,
  insertSaleItemSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Middleware to check admin role
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.sendStatus(403);
    next();
  };

  // Products API
  app.get("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", requireAdmin, async (req, res) => {
    try {
      const product = insertProductSchema.parse(req.body);
      const created = await storage.createProduct(product);
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to create product",
      });
    }
  });

  app.patch("/api/products/:id", requireAdmin, async (req, res) => {
    try {
      console.log("Product update request:", req.params.id, req.body);

      // Validate numeric fields
      const { price, quantity, lowStockAlert } = req.body;

      if (price && isNaN(Number(price))) {
        return res
          .status(400)
          .json({ message: "Price must be a valid number" });
      }

      if (quantity && isNaN(Number(quantity))) {
        return res
          .status(400)
          .json({ message: "Quantity must be a valid number" });
      }

      if (lowStockAlert && isNaN(Number(lowStockAlert))) {
        return res
          .status(400)
          .json({ message: "Low stock alert must be a valid number" });
      }

      // Sanitize imageUrl to avoid problematic characters
      if (req.body.imageUrl) {
        // Handle potential URL issues
        try {
          const url = new URL(req.body.imageUrl);
          req.body.imageUrl = url.toString();
        } catch (e) {
          req.body.imageUrl = ""; // Set to empty if invalid
        }
      }

      const updated = await storage.updateProduct(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Product update error:", error);
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to update product",
      });
    }
  });

  app.delete("/api/products/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(400).json({ message: "Failed to delete product" });
    }
  });

  // Sales API
  app.get("/api/sales", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { sale, items } = req.body;

      if (!sale || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Invalid sale data format" });
      }

      console.log("Received sale data:", JSON.stringify(req.body, null, 2));

      try {
        // Validate the sale object
        const validatedSale = insertSaleSchema.parse(sale);

        // Validate each item's product ID
        for (const item of items) {
          if (!item.productId || typeof item.productId !== "string") {
            return res.status(400).json({
              message: "Invalid product ID in sale items",
              details: `Product ID must be a valid string`,
            });
          }

          // Check if product exists
          const product = await storage.getProduct(item.productId);
          if (!product) {
            return res.status(400).json({
              message: "Product not found",
              details: `Product with ID ${item.productId} does not exist`,
            });
          }

          // Validate quantity
          if (
            !item.quantity ||
            typeof item.quantity !== "number" ||
            item.quantity <= 0
          ) {
            return res.status(400).json({
              message: "Invalid quantity",
              details: `Quantity must be a positive number`,
            });
          }

          // Check if quantity is available
          if (item.quantity > product.quantity) {
            return res.status(400).json({
              message: "Insufficient stock",
              details: `Not enough stock for ${product.name}. Available: ${product.quantity}`,
            });
          }
        }

        // First create the sale record
        const createdSale = await storage.createSale(validatedSale);

        // Map items to include the saleId for each sale item
        const saleItems = items.map((item: any) => ({
          ...item,
          saleId: createdSale._id,
        }));

        // Create the sale items
        await storage.createSaleItems(createdSale._id, saleItems);

        // Now, update the inventory for each sale item
        for (const item of items) {
          // This uses the $inc operator to subtract the sold quantity
          await storage.updateProduct(item.productId, {
            $inc: { quantity: -item.quantity },
          });
        }

        res.status(201).json(createdSale);
      } catch (validationError) {
        console.error("Sale validation error:", validationError);
        return res.status(400).json({
          message: "Invalid sale data",
          error:
            validationError instanceof Error
              ? validationError.message
              : String(validationError),
        });
      }
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(400).json({
        message: "Failed to create sale",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // User Management API (Admin only)
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id/role", requireAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      if (!["admin", "sales", "manager"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const updated = await storage.updateUserRole(req.params.id, role);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Failed to update user role" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
