import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TreasureCoastLogo } from "@/components/treasure-coast-logo";
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Sparkles, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [success, setSuccess] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token") || "";

  const validateTokenQuery = useQuery({
    queryKey: ["/api/auth/reset-password", token],
    queryFn: async () => {
      if (!token) throw new Error("No token provided");
      const response = await fetch(`/api/auth/reset-password/${token}`);
      const data = await response.json();
      if (!data.valid) {
        throw new Error(data.error || "Invalid or expired token");
      }
      return data;
    },
    enabled: !!token,
    retry: false,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; newPassword: string; confirmPassword: string }) => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }
      
      return result;
    },
    onSuccess: () => {
      setSuccess(true);
      toast({
        title: "Password reset successful",
        description: "You can now sign in with your new password.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validatePassword = (password: string): string => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must include a lowercase letter";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must include an uppercase letter";
    }
    if (!/\d/.test(password)) {
      return "Password must include a number";
    }
    return "";
  };

  useEffect(() => {
    if (newPassword) {
      setPasswordError(validatePassword(newPassword));
    } else {
      setPasswordError("");
    }
  }, [newPassword]);

  useEffect(() => {
    if (confirmPassword && newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match");
    } else {
      setConfirmError("");
    }
  }, [newPassword, confirmPassword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const passError = validatePassword(newPassword);
    if (passError) {
      setPasswordError(passError);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match");
      return;
    }

    resetPasswordMutation.mutate({ token, newPassword, confirmPassword });
  };

  const isFormValid = newPassword && confirmPassword && !passwordError && !confirmError;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-mesh relative overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse" />
        <motion.div 
          className="relative z-10 w-full max-w-md px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="glass-card p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/20 mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" data-testid="text-invalid-link-title">Invalid Reset Link</h1>
            <p className="text-white/60 mb-6">This password reset link is missing required information.</p>
            <Link href="/forgot-password">
              <Button className="btn-gradient-primary" data-testid="button-request-new-link">
                Request a New Link
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (validateTokenQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-mesh relative overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse" />
        <motion.div 
          className="relative z-10 w-full max-w-md px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="glass-card p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60">Validating reset link...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (validateTokenQuery.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-mesh relative overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse" />
        <motion.div 
          className="relative z-10 w-full max-w-md px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="glass-card p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/20 mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" data-testid="text-expired-link-title">Link Expired or Invalid</h1>
            <p className="text-white/60 mb-6">
              {(validateTokenQuery.error as Error)?.message || "This password reset link is no longer valid."}
            </p>
            <Link href="/forgot-password">
              <Button className="btn-gradient-primary" data-testid="button-request-new-link">
                Request a New Link
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-mesh relative overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse" />
        <motion.div 
          className="relative z-10 w-full max-w-md px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <Link href="/">
              <div className="inline-flex items-center justify-center mb-6">
                <TreasureCoastLogo size="lg" />
              </div>
            </Link>
          </div>
          <div className="glass-card p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" data-testid="text-success-title">Password Reset Complete</h1>
            <p className="text-white/60 mb-6">Your password has been successfully reset. You can now sign in with your new password.</p>
            <Link href="/login">
              <Button className="w-full btn-gradient-primary" data-testid="button-sign-in">
                Sign In Now
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center hero-mesh relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <Link href="/login">
        <button className="absolute top-6 left-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors" data-testid="link-back-login">
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>
      </Link>

      <motion.div 
        className="relative z-10 w-full max-w-md px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center justify-center mb-6" data-testid="text-logo">
              <TreasureCoastLogo size="lg" />
            </div>
          </Link>
        </div>

        <div className="glass-card p-8 relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 p-[1px]">
            <div className="w-full h-full rounded-2xl bg-background/95" />
          </div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Secure Reset</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2" data-testid="text-reset-password-title">Reset Your Password</h1>
              <p className="text-white/60">Create a new secure password for your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-white/80">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className={`pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl ${passwordError ? 'border-destructive/50' : ''}`}
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-destructive" data-testid="text-password-error">{passwordError}</p>
                )}
                <div className="text-xs text-white/40 space-y-0.5">
                  <p className={newPassword.length >= 8 ? 'text-primary' : ''}>At least 8 characters</p>
                  <p className={/[a-z]/.test(newPassword) ? 'text-primary' : ''}>One lowercase letter</p>
                  <p className={/[A-Z]/.test(newPassword) ? 'text-primary' : ''}>One uppercase letter</p>
                  <p className={/\d/.test(newPassword) ? 'text-primary' : ''}>One number</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white/80">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className={`pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl ${confirmError ? 'border-destructive/50' : ''}`}
                    data-testid="input-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmError && (
                  <p className="text-sm text-destructive" data-testid="text-confirm-error">{confirmError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 btn-gradient-primary rounded-xl text-base font-semibold"
                disabled={resetPasswordMutation.isPending || !isFormValid}
                data-testid="button-reset-password"
              >
                {resetPasswordMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-white/40 text-sm mt-6">
          Password requirements: 8+ characters, uppercase, lowercase, number
        </p>
      </motion.div>
    </div>
  );
}
