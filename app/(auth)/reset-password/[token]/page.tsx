"use client";

import React, { useState, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";

import { ResetPasswordSchema, ResetPasswordInput } from "@/lib/validators/auth.schema";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import apiClient from "@/lib/api/client";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function ResetPasswordPage({ params }: PageProps) {
  // Next.js 16 dynamic async param pattern
  const { token } = use(params);
  
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post("/auth/reset-password", {
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (response.data.success) {
        setIsSuccess(true);
        toast.success(response.data.message || "Password reset successful!");
      } else {
        toast.error(response.data.message || "Reset failed");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid or expired reset token.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-background">
      {/* Decorative Gradients */}
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary-500 flex items-center justify-center text-white shadow-elevated mb-3">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset Password</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Set your new secure password to access your account.
          </p>
        </div>

        {/* Card */}
        <Card className="p-8 shadow-overlay" glass>
          {!isSuccess ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="New Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-foreground text-muted-foreground outline-none transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register("password")}
              />

              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="hover:text-foreground text-muted-foreground outline-none transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              <Button type="submit" variant="primary" className="w-full py-3 mt-2" isLoading={isLoading}>
                Update Password
              </Button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4 animate-scale-in">
              <div className="h-12 w-12 rounded-full bg-success-50 text-success-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Password updated</h2>
              <p className="text-sm text-muted-foreground">
                Your password has been successfully reset. You can now login with your new credentials.
              </p>
              <Button onClick={() => router.push("/login")} variant="primary" className="w-full py-3 mt-2">
                Log In Now
              </Button>
            </div>
          )}

          {!isSuccess && (
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors"
              >
                Cancel and back to login
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
