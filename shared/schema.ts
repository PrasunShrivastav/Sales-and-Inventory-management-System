import { z } from "zod";

// Users & Auth
export const userSchema = z.object({
  _id: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "sales", "manager"]),
});

export const insertUserSchema = userSchema.omit({ _id: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;

// Products
export const productSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  price: z.number().min(0, "Price must be positive"),
  quantity: z.number().min(0, "Quantity must be non-negative"),
  lowStockAlert: z.number().min(1, "Low stock alert must be positive"),
});

export const insertProductSchema = productSchema.omit({ _id: true });

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = z.infer<typeof productSchema>;

// Sales
export const saleSchema = z.object({
  _id: z.string().optional(),
  total: z.number().min(0, "Total must be positive"),
  createdAt: z.date().optional(),
  customerName: z.string().optional(),
});

export const insertSaleSchema = saleSchema.omit({ _id: true, createdAt: true });

export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = z.infer<typeof saleSchema>;

// Sale Items
export const saleItemSchema = z.object({
  _id: z.string().optional(),
  saleId: z.string(),
  productId: z.string(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be positive"),
});

export const insertSaleItemSchema = saleItemSchema.omit({ _id: true });

export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type SaleItem = z.infer<typeof saleItemSchema>;