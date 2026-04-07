"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createBrowserClient } from "@supabase/ssr";
import { cn } from "@/lib/utils";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(
          error.message === "Invalid login credentials"
            ? "البريد أو كلمة المرور غير صحيحة"
            : error.message
        );
        return;
      }

      toast.success("تم تسجيل الدخول بنجاح");
      // Dashboard — all roles have access to "/"
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-brand-lg"
          style={{ background: "#4338CA" }}
        >
          <span className="text-white font-bold text-2xl">SR</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Skidy Rein</h1>
        <p className="text-muted-foreground text-sm mt-1">
          تسجيل الدخول للوحة التحكم
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-brand-md">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@skidyrein.com"
                required
                className={cn(
                  "w-full pr-10 pl-4 py-2.5 rounded-xl",
                  "bg-muted/50 border border-input",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:ring-2 focus:ring-ring focus:border-transparent",
                  "transition-all text-sm"
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={cn(
                  "w-full pr-10 pl-10 py-2.5 rounded-xl",
                  "bg-muted/50 border border-input",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:ring-2 focus:ring-ring focus:border-transparent",
                  "transition-all text-sm"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-2.5 rounded-xl font-semibold text-sm",
              "flex items-center justify-center gap-2",
              "bg-brand-700 text-white",
              "hover:bg-brand-600 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                <span>تسجيل الدخول</span>
              </>
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-muted-foreground text-xs mt-6">
        Skidy Rein CRM &copy; {new Date().getFullYear()}
      </p>
    </motion.div>
  );
}