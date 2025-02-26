import { User, InsertUser, Product, InsertProduct, Sale, InsertSale, SaleItem, InsertSaleItem } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // Sales
  getSales(): Promise<Sale[]>;
  getSale(id: number): Promise<Sale | undefined>;
  createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale>;
  
  // Session Store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private sales: Map<number, Sale>;
  private saleItems: Map<number, SaleItem>;
  private currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.sales = new Map();
    this.saleItems = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // Auth Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Product Methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.currentId++;
    const newProduct: Product = {
      id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: product.quantity ?? 0,
      lowStockAlert: product.lowStockAlert ?? 10,
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    const product = this.products.get(id);
    if (!product) throw new Error("Product not found");
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    this.products.delete(id);
  }

  // Sales Methods
  async getSales(): Promise<Sale[]> {
    return Array.from(this.sales.values());
  }

  async getSale(id: number): Promise<Sale | undefined> {
    return this.sales.get(id);
  }

  async createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale> {
    const id = this.currentId++;
    const newSale: Sale = {
      id,
      total: sale.total,
      createdAt: new Date(),
      customerName: sale.customerName ?? null,
    };
    this.sales.set(id, newSale);

    // Create sale items and update inventory
    for (const item of items) {
      const saleItemId = this.currentId++;
      const saleItem: SaleItem = {
        id: saleItemId,
        saleId: id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      };
      this.saleItems.set(saleItemId, saleItem);

      // Update product quantity
      const product = this.products.get(item.productId);
      if (product) {
        const updatedProduct: Product = {
          ...product,
          quantity: product.quantity - item.quantity
        };
        this.products.set(product.id, updatedProduct);
      }
    }

    return newSale;
  }
}

export const storage = new MemStorage();