import { InsertUser, InsertProduct, InsertSale, InsertSaleItem } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { User, Product, Sale, SaleItem } from "./db";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Sales
  getSales(): Promise<Sale[]>;
  getSale(id: string): Promise<Sale | undefined>;
  createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale>;

  // Session Store
  sessionStore: session.Store;
}

export class MongoStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // Auth Methods
  async getUser(id: string): Promise<User | undefined> {
    return User.findById(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return User.findOne({ username });
  }

  async createUser(user: InsertUser): Promise<User> {
    return User.create(user);
  }

  async getUsers(): Promise<User[]> {
    return User.find();
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    return User.findByIdAndUpdate(id, { role }, { new: true });
  }


  // Product Methods
  async getProducts(): Promise<Product[]> {
    return Product.find();
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return Product.findById(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    return Product.create(product);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return Product.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteProduct(id: string): Promise<void> {
    await Product.findByIdAndDelete(id);
  }

  // Sales Methods
  async getSales(): Promise<Sale[]> {
    return Sale.find().sort({ createdAt: -1 });
  }

  async getSale(id: string): Promise<Sale | undefined> {
    return Sale.findById(id);
  }

  async createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale> {
    const newSale = await Sale.create(sale);

    // Create sale items and update inventory
    for (const item of items) {
      const saleItem = { ...item, saleId: newSale._id };
      await SaleItem.create(saleItem);

      // Update product quantity
      const product = await Product.findById(item.productId);
      if (product) {
        await Product.findByIdAndUpdate(product._id, {
          quantity: product.quantity - item.quantity
        });
      }
    }

    return newSale;
  }
}

export const storage = new MongoStorage();