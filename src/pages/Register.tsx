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
import { AlertCircle, Eye, EyeOff, TrendingUp, Check, X } from "lucide-react";

const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export default function Register() {
  useDocumentTitle("Register | CryptoLens-AI");
  const navigate = useNavigate();
  const registerUser = useAuthStore((s) => s.register);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wait for the session check to complete before deciding where to send the user.
  // Without this, isAuthenticated is always false on first render, causing a redirect
  // loop that consumes the single-use refresh token and logs the user out.
  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const watchedPassword = watch("password", "");

  async function onSubmit(data: RegisterFormData) {
    setServerError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await registerUser(data.email, data.password, data.name);
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f8f9fb]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1e3a5f] via-[#2563eb] to-[#3b82f6] flex-col justify-between p-12 relative overflow-hidden">
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
          <h2 className="text-white text-2xl font-bold leading-tight">
            Start tracking your
            <br />
            portfolio in seconds
          </h2>
          <ul className="space-y-3 text-blue-100/80 text-sm">
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
                <Check className="h-3 w-3 text-green-300" />
              </div>
              Real-time crypto market data
            </li>
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
                <Check className="h-3 w-3 text-green-300" />
              </div>
              AI-powered portfolio analysis
            </li>
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
                <Check className="h-3 w-3 text-green-300" />
              </div>
              Secure, persistent data storage
            </li>
          </ul>
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
            <h1 className="text-2xl font-bold text-[#0f172a]">
              Create your account
            </h1>
            <p className="text-sm text-[#64748b] mt-1">
              Get started with CryptoLens-AI in under a minute
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
                htmlFor="name"
                className="text-sm font-medium text-[#0f172a]"
              >
                Full name
              </Label>
              <Input
                {...register("name")}
                id="name"
                placeholder="John Doe"
                autoComplete="name"
                className="h-11 bg-white border-[#e2e5ea] rounded-lg focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
                aria-invalid={!!errors.name}
              />
              {(errors.name || fieldErrors.name) && (
                <p className="text-xs text-[#dc2626]">
                  {errors.name?.message || fieldErrors.name?.[0]}
                </p>
              )}
            </div>

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
              {(errors.email || fieldErrors.email) && (
                <p className="text-xs text-[#dc2626]">
                  {errors.email?.message || fieldErrors.email?.[0]}
                </p>
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
                  autoComplete="new-password"
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

              {/* Password strength indicator */}
              {watchedPassword && (
                <div className="space-y-1.5 mt-2">
                  {passwordRules.map((rule) => {
                    const passes = rule.test(watchedPassword);
                    return (
                      <div
                        key={rule.label}
                        className="flex items-center gap-2 text-xs"
                      >
                        {passes ? (
                          <Check className="h-3 w-3 text-[#16a34a]" />
                        ) : (
                          <X className="h-3 w-3 text-[#94a3b8]" />
                        )}
                        <span
                          className={
                            passes ? "text-[#16a34a]" : "text-[#94a3b8]"
                          }
                        >
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-[#0f172a]"
              >
                Confirm password
              </Label>
              <Input
                {...register("confirmPassword")}
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-11 bg-white border-[#e2e5ea] rounded-lg focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-[#dc2626]">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold rounded-lg transition-all disabled:opacity-50"
              id="register-submit-btn"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#64748b]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#2563eb] font-semibold hover:text-[#1d4ed8] transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
