import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6).max(50),
  role: z.enum(["admin", "sales", "manager"]).optional(),
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
        await loginMutation.mutateAsync(data);
      } else {
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

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center">Welcome</h1>
          <div>
            <input
              {...form.register("username")}
              placeholder="Username"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <input
              {...form.register("password")}
              type="password"
              placeholder="Password"
              className="w-full p-2 border rounded"
            />
          </div>
          {form.formState.submitCount % 2 !== 0 && (
            <div>
              <select
                {...form.register("role")}
                className="w-full p-2 border rounded"
              >
                <option value="sales">Sales</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          <button
            type="submit"
            disabled={loginMutation.isPending || registerMutation.isPending}
            className="w-full p-2 bg-primary text-primary-foreground rounded"
          >
            {form.formState.submitCount % 2 === 0 ? "Login" : "Register"}
          </button>
          <button
            type="button"
            onClick={() => form.handleSubmit(onSubmit)()}
            className="w-full p-2 text-primary underline"
          >
            {form.formState.submitCount % 2 === 0 
              ? "Need an account? Register" 
              : "Already have an account? Login"}
          </button>
        </form>
      </div>
      <div className="hidden md:flex flex-1 bg-primary items-center justify-center p-8">
        <div className="max-w-md text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">Sales & Inventory Management System</h2>
          <p className="text-lg opacity-90">
            A complete solution for managing your sales, inventory, and business analytics.
          </p>
        </div>
      </div>
    </div>
  );
}