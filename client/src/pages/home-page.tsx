
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, ResponsiveContainer } from "recharts";
import { DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";
import type { Product, Sale } from "@shared/schema";

function DashboardCard({ title, value, icon: Icon, trend }: { title: string; value: string; icon: React.ElementType; trend?: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
            {trend && (
              <p className="text-xs text-muted-foreground">{trend}</p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
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
  const lowStockProducts = products?.filter(p => p.quantity <= p.lowStockAlert).length ?? 0;
  const totalSales = sales?.reduce((sum, sale) => sum + Number(sale.total), 0) ?? 0;
  const averageOrderValue = sales?.length ? totalSales / sales.length : 0;

  // Format sales data for chart
  const salesData = sales?.slice(-7).map(sale => ({
    date: new Date(sale.createdAt).toLocaleDateString(),
    amount: Number(sale.total)
  })) ?? [];

  return (
    <main className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.username}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Revenue"
          value={`$${totalSales.toFixed(2)}`}
          icon={DollarSign}
          trend="↑ 2.1% from last month"
        />
        <DashboardCard
          title="Average Order"
          value={`$${averageOrderValue.toFixed(2)}`}
          icon={ShoppingCart}
        />
        <DashboardCard
          title="Total Products"
          value={totalProducts.toString()}
          icon={Package}
        />
        <DashboardCard
          title="Low Stock"
          value={lowStockProducts.toString()}
          icon={TrendingUp}
          trend="Items need restock"
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Sales Overview</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
