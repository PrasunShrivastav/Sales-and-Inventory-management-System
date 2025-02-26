import { useLocation, useNavigate } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";

const schema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6).max(50),
});

type FormData = z.infer<typeof schema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { login, register } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => navigate("/"),
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid username or password",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: () => navigate("/"),
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Username already exists",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (form.formState.submitCount % 2 === 0) {
      loginMutation.mutate(data);
    } else {
      registerMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full max-w-sm p-6">
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
        <button
          type="submit"
          disabled={loginMutation.isPending || registerMutation.isPending}
          className="w-full p-2 bg-primary text-primary-foreground rounded"
        >
          {form.formState.submitCount % 2 === 0 ? "Login" : "Register"}
        </button>
      </form>
    </div>
  );
}