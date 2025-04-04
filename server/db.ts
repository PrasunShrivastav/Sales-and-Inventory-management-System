import mongoose from "mongoose";

export const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://0.0.0.0:27017/tasktrackpro";

// Configure mongoose
mongoose.set("strictQuery", false);
mongoose.set("strict", true);

// User Schema
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "sales", "manager"], required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
      },
    },
  }
);

// Product Schema
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 0 },
    lowStockAlert: { type: Number, required: true, default: 10 },
    imageUrl: {
      type: String,
      validate: {
        validator: function (v) {
          // Either empty or starts with http/https
          return !v || v.startsWith("http");
        },
        message: (props) => `${props.value} is not a valid URL!`,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// Sale Schema
const saleSchema = new mongoose.Schema(
  {
    total: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    customerName: String,
    paymentMode: {
      type: String,
      enum: ["Cash", "Card", "UPI"],
      default: "Cash",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// Sale Item Schema
const saleItemSchema = new mongoose.Schema(
  {
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// Create and export models
export const User = mongoose.model("User", userSchema);
export const Product = mongoose.model("Product", productSchema);
export const Sale = mongoose.model("Sale", saleSchema);
export const SaleItem = mongoose.model("SaleItem", saleItemSchema);
