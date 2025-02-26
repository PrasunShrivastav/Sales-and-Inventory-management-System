import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart,
  LogOut,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Point of Sale", href: "/pos", icon: ShoppingCart },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Analytics", href: "/analytics", icon: BarChart },
];

export default function SidebarNav() {
  const [location] = useLocation();
  const { logoutMutation, user } = useAuth();

  return (
    <div className="flex h-full flex-col bg-sidebar px-3 py-4">
      <div className="flex items-center px-3 py-2 text-sidebar-foreground">
        <span className="text-lg font-semibold">Sales & Inventory</span>
      </div>

      <div className="mt-6 flex flex-1 flex-col gap-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3",
                  location === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-4 px-3">
        <div className="flex items-center gap-3 text-sidebar-foreground">
          <div className="flex-1">
            <div className="font-medium">{user?.username}</div>
            <div className="text-sm capitalize">{user?.role}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          className="justify-start gap-3"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
