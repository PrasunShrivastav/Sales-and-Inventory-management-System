import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, DollarSign, Package, TrendingUp } from "lucide-react";
import SidebarNav from "@/components/layout/sidebar-nav";
import { type Product, type Sale } from "@shared/schema";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function DashboardCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="p-2 bg-primary/10 rounded-full">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h2 className="text-2xl font-bold">{value}</h2>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { user } = useAuth();

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: sales } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  // Calculate metrics
  const totalProducts = products?.length ?? 0;
  const lowStockProductsItems =
    products?.filter((p) => p.quantity <= p.lowStockAlert) ?? [];
  const lowStockProducts = lowStockProductsItems.length;
  const totalSales =
    sales?.reduce((sum, sale) => sum + Number(sale.total), 0) ?? 0;
  const averageOrderValue = sales?.length ? totalSales / sales.length : 0;

  // Format sales data for chart
  const salesData =
    sales?.slice(-7).map((sale) => ({
      date: new Date(sale.createdAt).toLocaleDateString(),
      amount: Number(sale.total),
    })) ?? [];

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r">
        <SidebarNav />
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8">
            Welcome back, {user?.username}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardCard
              title="Total Products"
              value={totalProducts.toString()}
              icon={Package}
            />
            <DashboardCard
              title="Total Sales"
              value={`$${totalSales.toFixed(2)}`}
              icon={DollarSign}
            />
            <DashboardCard
              title="Average Order Value"
              value={`$${averageOrderValue.toFixed(2)}`}
              icon={TrendingUp}
            />
            <DashboardCard
              title="Inventory Value"
              value={`$${(
                products?.reduce(
                  (sum, p) => sum + Number(p.price) * p.quantity,
                  0
                ) ?? 0
              ).toFixed(2)}`}
              icon={Package}
            />
          </div>

          {lowStockProducts > 0 && (
            <Alert variant="destructive" className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {lowStockProducts} products are running low on stock!
              </AlertDescription>
            </Alert>
          )}

          {/* Low Stock Products Section */}
          {lowStockProducts > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Low Stock Products</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Quantity Left</TableHead>
                      <TableHead>Low Stock Threshold</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockProductsItems.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>{product.lowStockAlert}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.quantity === 0
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {product.quantity === 0
                              ? "Out of Stock"
                              : "Low Stock"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
