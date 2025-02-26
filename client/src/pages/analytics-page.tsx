import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Product, type Sale } from "@shared/schema";
import SidebarNav from "@/components/layout/sidebar-nav";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function AnalyticsPage() {
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: sales } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  // Calculate sales metrics
  const totalSales = sales?.reduce((sum, sale) => sum + Number(sale.total), 0) ?? 0;
  const averageOrderValue = sales?.length ? totalSales / sales.length : 0;
  const totalOrders = sales?.length ?? 0;

  // Calculate inventory metrics
  const totalProducts = products?.length ?? 0;
  const lowStockProducts = products?.filter(p => p.quantity <= p.lowStockAlert).length ?? 0;
  const totalInventoryValue = products?.reduce(
    (sum, product) => sum + Number(product.price) * product.quantity,
    0
  ) ?? 0;

  // Format sales data by date
  const salesByDate = sales?.reduce((acc: any, sale) => {
    const date = new Date(sale.createdAt).toLocaleDateString();
    acc[date] = (acc[date] || 0) + Number(sale.total);
    return acc;
  }, {});

  const salesChartData = Object.entries(salesByDate || {}).map(([date, total]) => ({
    date,
    total,
  }));

  // Calculate top selling products
  const topProducts = products
    ?.map(product => ({
      name: product.name,
      value: product.quantity,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <div className="flex-1">

      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockProducts}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {products?.filter(p => p.quantity <= p.lowStockAlert).map(p => (
                  <div key={p.id}>{p.name} ({p.quantity} left)</div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalInventoryValue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topProducts}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      fill="#8884d8"
                      label
                    >
                      {topProducts?.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
