import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  DollarSign,
  Package,
  TrendingUp,
  Image as ImageIcon,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import SidebarNav from "@/components/layout/sidebar-nav";
import { type Product, type Sale } from "@shared/schema";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";
import { useCurrency, formatCurrency } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function DashboardCard({
  title,
  value,
  icon: Icon,
  trend,
  delay = 0,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  delay?: number;
}) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
              {trend && (
                <p
                  className={`flex items-center text-sm ${
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trend.isPositive ? (
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                  )}
                  {Math.abs(trend.value)}% from last month
                </p>
              )}
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Icon className="h-8 w-8 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const currency = useCurrency();

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: sales, isLoading: salesLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  // Combine loading states since we need both data
  const isLoading = productsLoading || salesLoading;

  // Calculate metrics
  const totalProducts = products?.length ?? 0;
  const lowStockProductsItems =
    products?.filter((p) => p.quantity <= p.lowStockAlert) ?? [];
  const lowStockProducts = lowStockProductsItems.length;
  const totalSales =
    sales?.reduce((sum, sale) => sum + Number(sale.total), 0) ?? 0;
  const averageOrderValue = sales?.length ? totalSales / sales.length : 0;
  const inventoryValue =
    products?.reduce((sum, p) => sum + Number(p.price) * p.quantity, 0) ?? 0;

  // Format sales data for chart
  const salesData =
    sales?.slice(-7).map((sale) => ({
      date: new Date(sale.createdAt || "").toLocaleDateString(),
      amount: Number(sale.total),
    })) ?? [];

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
            className="mb-8"
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Welcome back, {user?.username}
            </h1>
            <p className="text-muted-foreground mt-2">
              Here's what's happening with your store today.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {isLoading ? (
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-10 w-[100px] mb-4" />
                      <Skeleton className="h-6 w-[160px]" />
                    </CardContent>
                  </Card>
                ))
            ) : (
              <>
                <DashboardCard
                  title="Total Products"
                  value={totalProducts.toString()}
                  icon={Package}
                  trend={{ value: 12, isPositive: true }}
                  delay={0.1}
                />
                <DashboardCard
                  title="Total Sales"
                  value={formatCurrency(totalSales, currency)}
                  icon={DollarSign}
                  trend={{ value: 8, isPositive: true }}
                  delay={0.2}
                />
                <DashboardCard
                  title="Average Order Value"
                  value={formatCurrency(averageOrderValue, currency)}
                  icon={TrendingUp}
                  trend={{ value: 5, isPositive: false }}
                  delay={0.3}
                />
                <DashboardCard
                  title="Inventory Value"
                  value={formatCurrency(inventoryValue, currency)}
                  icon={Package}
                  trend={{ value: 15, isPositive: true }}
                  delay={0.4}
                />
              </>
            )}
          </motion.div>

          {lowStockProducts > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {lowStockProducts} products are running low on stock!
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Sales Trend
                  <span className="text-sm font-normal text-muted-foreground">
                    Last 7 Days
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-gray-200 dark:stroke-gray-700"
                      />
                      <XAxis
                        dataKey="date"
                        className="text-xs"
                        tick={{ fill: "currentColor" }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fill: "currentColor" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                        }}
                        formatter={(value: number) =>
                          formatCurrency(value, currency)
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                        activeDot={{
                          r: 6,
                          fill: "hsl(var(--primary))",
                          stroke: "hsl(var(--background))",
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Low Stock Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lowStockProductsItems.map((product) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-4 rounded-lg bg-muted/50"
                    >
                      <div className="h-12 w-12 rounded bg-muted overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity} units left
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.quantity === 0
                            ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200"
                        }`}
                      >
                        {product.quantity === 0 ? "Out of Stock" : "Low Stock"}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
