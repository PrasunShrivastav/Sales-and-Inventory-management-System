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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrency, formatCurrency } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const paymentModeColors = {
  Cash: "bg-green-100 text-green-800",
  Card: "bg-blue-100 text-blue-800",
  UPI: "bg-purple-100 text-purple-800",
};

export default function AnalyticsPage() {
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: sales } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const currency = useCurrency();

  // Calculate sales metrics
  const totalSales =
    sales?.reduce((sum, sale) => sum + Number(sale.total), 0) ?? 0;
  const averageOrderValue = sales?.length ? totalSales / sales.length : 0;
  const totalOrders = sales?.length ?? 0;

  // Calculate inventory metrics
  const totalProducts = products?.length ?? 0;
  const lowStockProducts =
    products?.filter((p) => p.quantity <= p.lowStockAlert).length ?? 0;
  const totalInventoryValue =
    products?.reduce(
      (sum, product) => sum + Number(product.price) * product.quantity,
      0
    ) ?? 0;

  // Format sales data by date
  const salesByDate = sales?.reduce((acc: any, sale) => {
    const date = sale.createdAt
      ? new Date(sale.createdAt).toLocaleDateString()
      : new Date().toLocaleDateString();
    acc[date] = (acc[date] || 0) + Number(sale.total);
    return acc;
  }, {});

  const salesChartData = Object.entries(salesByDate || {}).map(
    ([date, total]) => ({
      date,
      total,
    })
  );

  // Calculate top selling products
  const topProducts = products
    ?.map((product) => ({
      name: product.name,
      value: product.quantity,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Calculate payment mode distribution
  const paymentModeDistribution = sales?.reduce((acc: any, sale) => {
    const mode = sale.paymentMode || "Cash";
    acc[mode] = (acc[mode] || 0) + 1;
    return acc;
  }, {});

  const paymentModeData = Object.entries(paymentModeDistribution || {}).map(
    ([mode, count]) => ({
      name: mode,
      value: count,
    })
  );

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r">
        <SidebarNav />
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalSales, currency)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Order Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(averageOrderValue, currency)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Low Stock Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Inventory Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalInventoryValue, currency)}
              </div>
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
                    <Tooltip
                      formatter={(value: number) =>
                        formatCurrency(value, currency)
                      }
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Mode Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentModeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      fill="#8884d8"
                      label
                    >
                      {paymentModeData.map((_, index) => (
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

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales
                  ?.slice(-10)
                  .reverse()
                  .map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell>
                        {sale.createdAt
                          ? new Date(sale.createdAt).toLocaleString()
                          : new Date().toLocaleString()}
                      </TableCell>
                      <TableCell>{sale.customerName || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            paymentModeColors[sale.paymentMode || "Cash"]
                          }
                        >
                          {sale.paymentMode || "Cash"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(Number(sale.total), currency)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
