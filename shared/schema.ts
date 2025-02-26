import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users & Auth
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "sales", "manager"] }).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  price: decimal("price").notNull(),
  quantity: integer("quantity").notNull().default(0),
  lowStockAlert: integer("low_stock_alert").notNull().default(10),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  sku: true,
  price: true,
  quantity: true,
  lowStockAlert: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Sales/Orders
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  total: decimal("total").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  customerName: text("customer_name"),
});

export const insertSaleSchema = createInsertSchema(sales).pick({
  total: true,
  customerName: true,
});

export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof sales.$inferSelect;

// Sale Items
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price").notNull(),
});

export const insertSaleItemSchema = createInsertSchema(saleItems).pick({
  saleId: true,
  productId: true,
  quantity: true,
  price: true,
});

export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type SaleItem = typeof saleItems.$inferSelect;
