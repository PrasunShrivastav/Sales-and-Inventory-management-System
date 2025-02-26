import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI must be set");
}

// Configure mongoose
mongoose.set('strictQuery', false);
mongoose.set('strict', true);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'sales', 'manager'], required: true }
});

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 0 },
  lowStockAlert: { type: Number, required: true, default: 10 }
});

// Sale Schema
const saleSchema = new mongoose.Schema({
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  customerName: String
});

// Sale Item Schema
const saleItemSchema = new mongoose.Schema({
  saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }
});

// Create and export models
export const User = mongoose.model('User', userSchema);
export const Product = mongoose.model('Product', productSchema);
export const Sale = mongoose.model('Sale', saleSchema);
export const SaleItem = mongoose.model('SaleItem', saleItemSchema);