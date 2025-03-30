import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { type Product, insertProductSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import SidebarNav from "@/components/layout/sidebar-nav";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { useCurrency, formatCurrency } from "@/lib/currency";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";

export default function InventoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const currency = useCurrency();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/products", {
        ...data,
        price: Number(data.price),
        quantity: Number(data.quantity),
        lowStockAlert: Number(data.lowStockAlert),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      try {
        // Better handling for imageUrl
        if (data.imageUrl) {
          try {
            // Simple sanitization - remove extra spaces and encode special characters
            data.imageUrl = data.imageUrl.trim();
            const url = new URL(data.imageUrl);
            data.imageUrl = url.toString();
          } catch (e) {
            console.warn("Error parsing image URL:", e);
            // If URL is invalid, set to empty rather than causing an error
            data.imageUrl = "";
          }
        }

        // Format numeric fields carefully
        const formattedData = {
          ...data,
          name: String(data.name || "").trim(),
          sku: String(data.sku || "").trim(),
          price: Number(data.price || 0),
          quantity: Number(data.quantity || 0),
          lowStockAlert: Number(data.lowStockAlert || 0),
          imageUrl: data.imageUrl || "",
        };

        console.log(
          "Updating product:",
          id,
          JSON.stringify(formattedData, null, 2)
        );

        const res = await apiRequest(
          "PATCH",
          `/api/products/${id}`,
          formattedData
        );

        // Handle non-JSON responses
        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            throw new Error(
              errorData.message || `Failed to update product (${res.status})`
            );
          } else {
            // Handle non-JSON error responses (like HTML error pages)
            const errorText = await res.text();
            console.error("Non-JSON error response:", errorText);
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
          }
        }

        return res.json();
      } catch (error) {
        console.error("Product update error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product updated successfully" });
    },
    onError: (error: Error) => {
      console.error("Update product error:", error);
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        console.log("Sending delete request for product ID:", id);

        if (!id) {
          throw new Error("Product ID is required");
        }

        const res = await apiRequest("DELETE", `/api/products/${id}`);
        console.log("Delete response status:", res.status);

        if (!res.ok) {
          throw new Error(`Failed to delete product (${res.status})`);
        }

        // Try to get response text
        const text = await res.text();
        console.log("Delete response text:", text);

        // If response is empty or "OK", consider it successful
        if (!text || text === "OK") {
          return { success: true };
        }

        // Try to parse as JSON if there's content
        try {
          return JSON.parse(text);
        } catch (e) {
          // If not JSON but we got here, consider it successful
          return { success: true };
        }
      } catch (error) {
        console.error("Delete product error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: Error) => {
      console.error("Delete mutation error:", error);
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ProductForm = ({ product = null }: { product?: Product | null }) => {
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string>(
      product?.imageUrl || ""
    );
    const [imageError, setImageError] = useState<boolean>(false);

    const form = useForm({
      resolver: zodResolver(insertProductSchema),
      defaultValues: product ?? {
        name: "",
        sku: "",
        price: 0,
        quantity: 0,
        lowStockAlert: 10,
        imageUrl: "",
      },
    });

    // Handle image URL changes
    const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value.trim();

      if (!url) {
        form.setValue("imageUrl", "");
        setImagePreviewUrl("");
        setImageError(false);
        return;
      }

      // For Unsplash URLs specifically, simplify them
      let processedUrl = url;
      if (url.includes("unsplash.com")) {
        // Extract just the base URL without parameters
        try {
          const urlObj = new URL(url);
          // Keep just the pathname part for Unsplash
          processedUrl = `https://images.unsplash.com${urlObj.pathname}`;
        } catch (e) {
          console.error("Error processing URL:", e);
        }
      }

      form.setValue("imageUrl", processedUrl);
      setImagePreviewUrl(processedUrl);
      setImageError(false);
    };

    // Add this helper method to the component
    const validateUrl = (url: string) => {
      if (!url) return true;
      try {
        new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    };

    const onSubmit = async (data: any) => {
      try {
        // Special handling for imageUrl
        let processedImageUrl = data.imageUrl || "";

        if (processedImageUrl.includes("unsplash.com")) {
          try {
            const urlObj = new URL(processedImageUrl);
            processedImageUrl = `https://images.unsplash.com${urlObj.pathname}`;
          } catch (e) {
            // If URL parsing fails, leave as is
            console.error("Error simplifying Unsplash URL:", e);
          }
        }

        const cleanData = {
          ...data,
          name: String(data.name || "").trim(),
          sku: String(data.sku || "").trim(),
          imageUrl: processedImageUrl,
          price: Number(data.price || 0),
          quantity: Number(data.quantity || 0),
          lowStockAlert: Number(data.lowStockAlert || 5),
        };

        console.log("Saving product with data:", cleanData);

        if (product) {
          await updateProductMutation.mutateAsync({
            id: product._id || "",
            data: cleanData,
          });
        } else {
          await createProductMutation.mutateAsync(cleanData);
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast({
          title: "Error saving product",
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        });
      }
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="https://example.com/image.jpg"
                    onChange={handleImageUrlChange}
                  />
                </FormControl>
                <FormMessage />
                {imagePreviewUrl && (
                  <div className="mt-2 border rounded p-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      Preview:
                    </p>
                    <div className="h-24 w-24 bg-muted rounded overflow-hidden">
                      <img
                        src={imagePreviewUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          setImageError(true);
                          const img = e.target as HTMLImageElement;
                          img.src =
                            "https://placehold.co/400x400/e2e8f0/64748b?text=Image+Error";
                        }}
                      />
                    </div>
                    {imageError && (
                      <p className="text-xs text-destructive mt-1">
                        Image couldn't be loaded. Please check the URL.
                      </p>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground space-y-1">
                      <p>✓ URLs should start with http:// or https://</p>
                      <p>✓ Make sure the image is publicly accessible</p>
                      <p>✓ Most common formats: jpg, png, webp</p>
                    </div>
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lowStockAlert"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Low Stock Alert</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            {product ? "Update Product" : "Create Product"}
          </Button>
        </form>
      </Form>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <aside className="w-64 border-r border-gray-200 dark:border-gray-800">
        <SidebarNav />
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-8"
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Inventory Management
            </h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all duration-300 shadow-lg hover:shadow-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <ProductForm />
              </DialogContent>
            </Dialog>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="relative">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/20"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-[300px]" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredProducts?.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-700">
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                          <ImageIcon className="w-12 h-12 text-muted-foreground opacity-50" />
                        </div>
                      )}
                      {product.quantity <= product.lowStockAlert && (
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                            Low Stock
                          </span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                            {product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            SKU: {product.sku}
                          </p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="hover:bg-primary/10"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Product</DialogTitle>
                              </DialogHeader>
                              <ProductForm product={product} />
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="icon"
                            className="hover:bg-destructive/10 hover:text-destructive"
                            onClick={async () => {
                              try {
                                // Get the ID from either _id or id field
                                const productId = product._id || product.id;

                                // Log the full product object for debugging
                                console.log("Attempting to delete product:", {
                                  product,
                                  _id: product._id,
                                  id: product.id,
                                  productId,
                                });

                                if (!productId) {
                                  console.error(
                                    "No valid ID found on product:",
                                    product
                                  );
                                  toast({
                                    title: "Failed to delete product",
                                    description: "Product ID is missing",
                                    variant: "destructive",
                                  });
                                  return;
                                }

                                if (
                                  window.confirm(
                                    `Are you sure you want to delete "${product.name}"?`
                                  )
                                ) {
                                  // Show loading toast
                                  toast({
                                    title: "Deleting product...",
                                    description: "Please wait...",
                                  });

                                  // Log the ID we're using
                                  console.log(
                                    "Deleting product with ID:",
                                    productId
                                  );

                                  // Attempt deletion
                                  await deleteProductMutation.mutateAsync(
                                    productId
                                  );

                                  // Show success toast
                                  toast({
                                    title: "Success",
                                    description: "Product deleted successfully",
                                  });

                                  // Refresh the products list
                                  queryClient.invalidateQueries({
                                    queryKey: ["/api/products"],
                                  });
                                }
                              } catch (error) {
                                console.error("Delete handler error:", error);
                                toast({
                                  title: "Failed to delete product",
                                  description:
                                    error instanceof Error
                                      ? error.message
                                      : "Unknown error occurred",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 pt-2 border-t dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Price:</span>
                          <span className="font-medium text-lg">
                            {formatCurrency(Number(product.price), currency)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">
                            Quantity:
                          </span>
                          <span
                            className={`font-medium ${
                              product.quantity <= product.lowStockAlert
                                ? "text-destructive"
                                : ""
                            }`}
                          >
                            {product.quantity} units
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">
                            Alert Threshold:
                          </span>
                          <span className="font-medium">
                            {product.lowStockAlert} units
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {filteredProducts?.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or add a new product
              </p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
