import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20),
  password: z.string().min(6, "Password must be at least 6 characters").max(50),
  role: z.enum(["admin", "sales", "manager"]),
});

type FormData = z.infer<typeof schema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
      role: "sales",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (form.formState.submitCount % 2 === 0) {
        // Login
        await loginMutation.mutateAsync({
          username: data.username,
          password: data.password,
        });
      } else {
        // Register
        await registerMutation.mutateAsync(data);
      }
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const formVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.6, delay: 0.3, ease: "easeOut" }
    }
  };

  const heroVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.6, delay: 0.3, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex bg-background"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div 
        className="flex-1 flex items-center justify-center p-8"
        variants={formVariants}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {form.formState.submitCount % 2 === 0 ? "Welcome Back" : "Create Account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  {...form.register("username")}
                  className="w-full"
                  autoComplete="username"
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  className="w-full"
                  autoComplete="current-password"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              {form.formState.submitCount % 2 !== 0 && (
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    onValueChange={(value) => form.setValue("role", value as "admin" | "sales" | "manager")}
                    defaultValue={form.getValues("role")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-4">
                <Button 
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending || registerMutation.isPending}
                >
                  {form.formState.submitCount % 2 === 0 ? "Login" : "Register"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => form.handleSubmit(onSubmit)()}
                >
                  {form.formState.submitCount % 2 === 0 
                    ? "Need an account? Register" 
                    : "Already have an account? Login"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        className="hidden md:flex flex-1 bg-primary items-center justify-center p-8"
        variants={heroVariants}
      >
        <div className="max-w-md text-primary-foreground">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-white to-primary-foreground/80 bg-clip-text text-transparent">
            Sales & Inventory Management System
          </h2>
          <p className="text-xl opacity-90 leading-relaxed">
            A complete solution for managing your sales, inventory, and business analytics.
            Streamline your operations with our powerful tools.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}