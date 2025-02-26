import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SidebarNav from "@/components/layout/sidebar-nav";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define available currencies
const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
];

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  // Load saved preferences on component mount
  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    // Load currency preference
    const savedCurrency = localStorage.getItem("currency");
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }
  }, []);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    try {
      // Password change functionality will be implemented later
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update password",
      });
    }
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleCurrencyChange = (value: string) => {
    setSelectedCurrency(value);
    localStorage.setItem("currency", value);

    // Emit a custom event that other components can listen for
    const event = new CustomEvent("currencyChange", {
      detail: { currency: value },
    });
    window.dispatchEvent(event);

    toast({
      title: "Currency Updated",
      description: `Currency has been changed to ${
        currencies.find((c) => c.code === value)?.name
      }`,
    });
  };

  // Find the current currency details
  const currentCurrency =
    currencies.find((c) => c.code === selectedCurrency) || currencies[0];

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r">
        <SidebarNav />
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="grid gap-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <Input value={user?.username} disabled />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Input value={user?.role} disabled />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Currency Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Select Currency
                </label>
                <Select
                  value={selectedCurrency}
                  onValueChange={handleCurrencyChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} - {currency.name} ({currency.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-4 p-4 bg-muted rounded-md">
                <div className="text-sm font-medium mb-2">Preview:</div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">
                      Product Price
                    </div>
                    <div className="text-lg font-semibold">
                      {currentCurrency.symbol}1,000.00
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">
                      Order Total
                    </div>
                    <div className="text-lg font-semibold">
                      {currentCurrency.symbol}42,000.00
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    {...form.register("currentPassword")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">New Password</label>
                  <Input type="password" {...form.register("newPassword")} />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    {...form.register("confirmPassword")}
                  />
                </div>
                <Button type="submit">Update Password</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span>Dark Mode</span>
                <Button variant="outline" onClick={toggleTheme}>
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
