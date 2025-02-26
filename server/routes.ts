import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertProductSchema, insertSaleSchema, insertSaleItemSchema } from "@shared/schema";

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
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post("/api/products", requireAdmin, async (req, res) => {
    const product = insertProductSchema.parse(req.body);
    const created = await storage.createProduct(product);
    res.status(201).json(created);
  });

  app.patch("/api/products/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const updated = await storage.updateProduct(id, updates);
    res.json(updated);
  });

  app.delete("/api/products/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteProduct(id);
    res.sendStatus(200);
  });

  // Sales API
  app.get("/api/sales", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const sales = await storage.getSales();
    res.json(sales);
  });

  app.post("/api/sales", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { sale, items } = req.body;
    const validatedSale = insertSaleSchema.parse(sale);
    const validatedItems = items.map((item: any) => 
      insertSaleItemSchema.parse(item)
    );

    const created = await storage.createSale(validatedSale, validatedItems);
    res.status(201).json(created);
  });

  const httpServer = createServer(app);
  return httpServer;
}
