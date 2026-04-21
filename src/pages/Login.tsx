import { useState } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/authStore";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eye, EyeOff, TrendingUp } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  useDocumentTitle("Login | CryptoLens-AI");
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const login = useAuthStore((s) => s.login);
  const registerAction = useAuthStore((s) => s.register);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });


  // Already authenticated — redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(data: LoginFormData) {
    setServerError(null);
    setIsSubmitting(true);

    try {
      await login(data.email, data.password);
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDemoLogin() {
    setServerError(null);
    setIsDemoLoading(true);

    try {
      await login("demo@cryptolens.io", "DemoPass123");
      navigate("/", { replace: true });
    } catch {
      try {
        await registerAction("demo@cryptolens.io", "DemoPass123", "Demo User");
        navigate("/", { replace: true });
      } catch (err) {
        if (err instanceof ApiError) {
          setServerError("Demo error: " + err.message);
        } else {
          setServerError("Something went wrong loading the demo.");
        }
      }
    } finally {
      setIsDemoLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f8f9fb]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1e3a5f] via-[#2563eb] to-[#3b82f6] flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              CryptoLens-AI
            </span>
          </div>
          <p className="text-blue-100/80 text-sm mt-1">
            AI-Powered Financial Intelligence
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <blockquote className="text-white/90 text-lg leading-relaxed">
            "Real-time portfolio tracking with AI-powered analysis. Make
            data-driven decisions with confidence."
          </blockquote>
          <div className="flex items-center gap-4 text-sm text-blue-100/70">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Live market data</span>
            </div>
            <span>•</span>
            <span>30+ cryptocurrencies</span>
            <span>•</span>
            <span>Gemini AI analyst</span>
          </div>
        </div>

        <div className="relative z-10 text-blue-200/50 text-xs">
          © {new Date().getFullYear()} CryptoLens-AI. Built with React, Express &
          PostgreSQL.
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#2563eb] rounded-xl flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#0f172a] tracking-tight">
              CryptoLens-AI
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#0f172a]">Welcome back</h1>
            <p className="text-sm text-[#64748b] mt-1">
              Sign in to your account to continue
            </p>
          </div>

          {serverError && (
            <div
              className="flex items-center gap-2 border border-[#fecaca] bg-[#fef2f2] rounded-lg p-3 mb-6 text-sm text-[#dc2626]"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-[#0f172a]"
              >
                Email
              </Label>
              <Input
                {...register("email")}
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="h-11 bg-white border-[#e2e5ea] rounded-lg focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-[#dc2626]">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-[#0f172a]"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-11 bg-white border-[#e2e5ea] rounded-lg pr-10 focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#dc2626]">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || isDemoLoading}
              className="w-full h-11 bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold rounded-lg transition-all disabled:opacity-50"
              id="login-submit-btn"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </Button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-[#e2e5ea]"></div>
              <span className="flex-shrink-0 mx-4 text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-[#e2e5ea]"></div>
            </div>

            <Button
              type="button"
              onClick={handleDemoLogin}
              disabled={isSubmitting || isDemoLoading}
              className="w-full h-11 bg-white border border-[#e2e5ea] text-[#0f172a] hover:bg-[#f8f9fb] hover:border-[#cbd5e1] font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              {isDemoLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#2563eb]/30 border-t-[#2563eb] rounded-full animate-spin" />
                  Loading demo…
                </span>
              ) : (
                "Continue with Demo Account"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#64748b]">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-[#2563eb] font-semibold hover:text-[#1d4ed8] transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
