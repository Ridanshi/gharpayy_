import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { User } from "@/types";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const toast = useToast();
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@flowops.ai", password: "FlowOps@123" }
  });

  async function onSubmit(values: FormValues) {
    const result = await api<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify(values) });
    setSession(result.user, result.token);
    toast.show({ title: "Welcome back", body: "Your operations workspace is ready." });
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-background noise">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.05fr_.95fr]">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="hidden lg:block">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            AI operations intelligence for PG teams
          </div>
          <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight">Convert more tours into confirmed reservations.</h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">FlowOps AI prioritizes high-intent leads, detects bottlenecks, predicts property pressure, and keeps revenue operations moving.</p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {["Lead urgency", "Pressure index", "Revival queue"].map((item, index) => (
              <div key={item} className="rounded-lg border bg-card p-4 shadow-sm">
                <p className="text-3xl font-bold text-primary">{index === 0 ? "92" : index === 1 ? "84%" : "18"}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.form initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} onSubmit={handleSubmit(onSubmit)} className="glass mx-auto w-full max-w-md rounded-lg p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Sign in to FlowOps AI</h2>
              <p className="text-sm text-muted-foreground">Demo credentials are prefilled.</p>
            </div>
          </div>
          <div className="space-y-4">
            <Input placeholder="Email" {...register("email")} />
            <Input placeholder="Password" type="password" {...register("password")} />
            {formState.errors.email && <p className="text-sm text-destructive">{formState.errors.email.message}</p>}
            <Button className="w-full" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Signing in..." : "Open workspace"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-5 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            Admin: admin@flowops.ai / FlowOps@123
            <br />
            Ops: ops@flowops.ai / FlowOps@123
            <br />
            Agent: agent@flowops.ai / FlowOps@123
          </div>
        </motion.form>
      </div>
    </div>
  );
}
