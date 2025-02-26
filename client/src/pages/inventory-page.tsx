import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { type Product, insertProductSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import SidebarNav from "@/components/layout/sidebar-nav";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function InventoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product created successfully" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/products/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product updated successfully" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product deleted successfully" });
    },
  });

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ProductForm = ({ product = null }: { product?: Product | null }) => {
    const form = useForm({
      resolver: zodResolver(insertProductSchema),
      defaultValues: product ?? {
        name: "",
        sku: "",
        price: "",
        quantity: 0,
        lowStockAlert: 10,
      },
    });

    const onSubmit = (data: any) => {
      if (product) {
        updateProductMutation.mutate({ id: product.id, data });
      } else {
        createProductMutation.mutate(data);
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
                  <Input {...field} type="number" step="0.01" />
                </FormControl>
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
                  <Input {...field} type="number" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lowStockAlert"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Low Stock Alert Threshold</FormLabel>
                <FormControl>
                  <Input {...field} type="number" />
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={createProductMutation.isPending || updateProductMutation.isPending}
          >
            {product ? "Update Product" : "Create Product"}
          </Button>
        </form>
      </Form>
    );
  };

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r">
        <SidebarNav />
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />

          {user?.role === "admin" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
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
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Low Stock Alert</TableHead>
              {user?.role === "admin" && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts?.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                <TableCell className={product.quantity <= product.lowStockAlert ? "text-destructive" : ""}>
                  {product.quantity}
                </TableCell>
                <TableCell>{product.lowStockAlert}</TableCell>
                {user?.role === "admin" && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
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
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this product?")) {
                            deleteProductMutation.mutate(product.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
    </div>
  );
}
