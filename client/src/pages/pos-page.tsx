import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  type Product,
  type InsertSale,
  type InsertSaleItem,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import SidebarNav from "@/components/layout/sidebar-nav";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { useCurrency, formatCurrency } from "@/lib/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CartItem = {
  product: Product;
  quantity: number;
};

export default function POSPage() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Card" | "UPI">(
    "Cash"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const currency = useCurrency();

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<
    Product[]
  >({
    queryKey: ["/api/products"],
  });

  // Cleanup cart when component unmounts
  useEffect(() => {
    return () => {
      setCart([]);
    };
  }, []);

  const createSaleMutation = useMutation({
    mutationFn: async (data: { sale: InsertSale; items: InsertSaleItem[] }) => {
      try {
        // Ensure all fields are properly formatted
        const formattedData = {
          sale: {
            total: Number(parseFloat(data.sale.total.toString()).toFixed(2)),
            customerName: data.sale.customerName
              ? String(data.sale.customerName).trim()
              : undefined,
            paymentMode: data.sale.paymentMode,
          },
          items: data.items.map((item) => ({
            productId: String(item.productId),
            quantity: Number(item.quantity),
            price: Number(parseFloat(item.price.toString()).toFixed(2)),
          })),
        };

        console.log(
          "Sale data being sent:",
          JSON.stringify(formattedData, null, 2)
        );

        const res = await apiRequest("POST", "/api/sales", formattedData);

        if (!res.ok) {
          // Try to parse as JSON first, fall back to status text
          try {
            const errorData = await res.json();
            console.error("Sale API error response:", errorData);
            throw new Error(errorData.message || `Error: ${res.status}`);
          } catch (parseError) {
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
          }
        }

        return res.json();
      } catch (error) {
        console.error("Sale mutation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.refetchQueries({ queryKey: ["/api/sales"] });
      setCart([]);
      setCustomerName("");
      setPaymentMode("Cash");
      toast({
        title: "Success",
        description: "Sale completed successfully",
      });
    },
    onError: (error) => {
      console.error("Sale error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to complete sale",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductCardClick = (product: Product) => {
    // Log the complete product data to understand its structure
    console.log("Product clicked, complete data:", JSON.stringify(product));

    // Check if the product data is in a different format than expected
    // It might be that _id is called id or the price has a different format
    const productId = product._id || product.id || product._id?.toString();
    const productPrice = product.price
      ? parseFloat(product.price.toString())
      : 0;

    if (!productId) {
      toast({
        title: "Error",
        description: "Product is missing an ID",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(productPrice) || productPrice <= 0) {
      toast({
        title: "Error",
        description: "Product has an invalid price",
        variant: "destructive",
      });
      return;
    }

    // Create a normalized product that matches expected structure
    const normalizedProduct = {
      ...product,
      _id: productId,
      price: productPrice,
      name: product.name || "Unknown Product",
      quantity: typeof product.quantity === "number" ? product.quantity : 10,
      sku: product.sku || "N/A",
    };

    // Add normalized product to cart
    addToCart(normalizedProduct);
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existingItem = prev.find(
        (item) => item.product._id === product._id
      );

      if (existingItem) {
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { product, quantity: 1 }];
    });

    toast({
      title: "Added to cart",
      description: `${product.name} added to cart`,
    });
  };

  const incrementQuantity = (productId: string) => {
    if (!productId) return;

    setCart((prev) => {
      return prev.map((item) => {
        if (item.product._id === productId) {
          // Check stock limit
          if (item.quantity >= item.product.quantity) {
            toast({
              title: "Maximum quantity reached",
              description: "Cannot add more items than available in stock.",
              variant: "destructive",
            });
            return item;
          }
          // Increment quantity
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      });
    });
  };

  const decrementQuantity = (productId: string) => {
    if (!productId) return;

    setCart((prev) => {
      const updatedCart = prev.map((item) => {
        if (item.product._id === productId) {
          const newQuantity = item.quantity - 1;
          // If quantity would become 0, we'll filter it out later
          if (newQuantity === 0) return null;
          return { ...item, quantity: newQuantity };
        }
        return item;
      });

      // Remove any null items (quantity = 0)
      return updatedCart.filter((item): item is CartItem => item !== null);
    });
  };

  const removeFromCart = (productId: string) => {
    if (!productId) return;

    setCart((prev) => prev.filter((item) => item.product._id !== productId));

    toast({
      title: "Removed from cart",
      description: "Item removed from cart",
    });
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Basic validation
      if (!paymentMode) {
        throw new Error("Please select a payment mode");
      }

      // Validate items and prepare sale data
      const validSaleItems = [];

      for (const item of cart) {
        if (!item.product._id) {
          toast({
            title: "Invalid product",
            description: `Product "${item.product.name}" has an invalid ID and cannot be processed.`,
            variant: "destructive",
          });
          continue;
        }

        validSaleItems.push({
          productId: String(item.product._id),
          quantity: Number(item.quantity),
          price: Number(parseFloat(item.product.price.toString()).toFixed(2)),
        });
      }

      if (validSaleItems.length === 0) {
        throw new Error(
          "There are no valid products in your cart. Please check and try again."
        );
      }

      const saleData = {
        sale: {
          total: Number(parseFloat(total.toString()).toFixed(2)),
          customerName: customerName.trim() || undefined,
          paymentMode,
        },
        items: validSaleItems,
      };

      console.log("Submitting sale:", JSON.stringify(saleData, null, 2));
      await createSaleMutation.mutateAsync(saleData);
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to complete sale",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r">
        <SidebarNav />
      </aside>

      <main className="flex-1 flex">
        <div className="flex-1 p-8 overflow-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Point of Sale</h1>
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {isLoadingProducts ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product, index) => (
                    <Card
                      key={product._id || index}
                      className={`cursor-pointer transition-transform hover:scale-105 border-2 ${
                        product.quantity === 0
                          ? "border-red-200 opacity-60"
                          : product.quantity <= product.lowStockAlert
                          ? "border-yellow-200"
                          : "border-transparent"
                      }`}
                      onClick={() => handleProductCardClick(product)}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-square mb-4 bg-muted rounded-lg overflow-hidden relative">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src =
                                  "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <ShoppingCart className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                          {product.quantity <= product.lowStockAlert &&
                            product.quantity > 0 && (
                              <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                Low Stock
                              </div>
                            )}
                          {product.quantity === 0 && (
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white bg-opacity-70">
                              <span className="text-red-500 font-bold text-lg">
                                Out of Stock
                              </span>
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold mb-1">{product.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          SKU: {product.sku}
                        </p>
                        <div className="flex justify-between items-center">
                          <p className="font-bold">
                            {formatCurrency(Number(product.price), currency)}
                          </p>
                          <p
                            className={`text-sm ${
                              product.quantity <= product.lowStockAlert
                                ? "text-destructive font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            {product.quantity} in stock
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <p>No products found</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="w-96 border-l bg-muted/10 p-6 flex flex-col">
          <h2 className="text-3xl font-bold mb-4">Shopping Cart</h2>

          <div className="flex-1 overflow-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground bg-muted/30 rounded-lg">
                <ShoppingCart className="w-16 h-16 mb-2 text-muted-foreground/60" />
                <p>Your cart is empty</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Click on products to add them to your cart
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <Card
                    key={item.product._id}
                    className="p-4 border border-muted hover:border-primary/30 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(Number(item.product.price), currency)}{" "}
                          each
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.product._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => decrementQuantity(item.product._id)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => incrementQuantity(item.product._id)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <span className="ml-auto font-medium">
                        {formatCurrency(
                          Number(item.product.price) * item.quantity,
                          currency
                        )}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="border-t mt-4 pt-4 space-y-4">
            <Input
              placeholder="Customer Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <Select
              value={paymentMode}
              onValueChange={(value) =>
                setPaymentMode(value as "Cash" | "Card" | "UPI")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                "Complete Sale"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
