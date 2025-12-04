import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TreasureCoastLogo } from "@/components/treasure-coast-logo";
import { Lock, Mail, ArrowLeft, Sparkles } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/check"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Check if user needs to change password
      if (data.forcePasswordChange) {
        toast({
          title: "Password change required",
          description: "Please set a new password to continue.",
        });
        setTimeout(() => {
          window.location.href = "/change-password";
        }, 500);
        return;
      }
      
      toast({
        title: "Welcome back!",
        description: "Redirecting to your dashboard...",
      });
      setTimeout(() => {
        if (data.user?.role === "super_admin") {
          window.location.href = "/super-admin";
        } else {
          window.location.href = "/client/dashboard";
        }
      }, 500);
    },
    onError: (error: Error) => {
      setPassword("");
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center hero-mesh relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Back to home link */}
      <Link href="/">
        <button className="absolute top-6 left-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors" data-testid="link-back-home">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>
      </Link>

      <motion.div 
        className="relative z-10 w-full max-w-md px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center justify-center mb-6" data-testid="text-logo">
              <TreasureCoastLogo size="lg" />
            </div>
          </Link>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 relative">
          {/* Gradient border effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 p-[1px]">
            <div className="w-full h-full rounded-2xl bg-background/95" />
          </div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Secure Login</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2" data-testid="text-login-title">Welcome Back</h1>
              <p className="text-white/60">Sign in to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white/80">Username</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                    data-testid="input-username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                    data-testid="input-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 btn-gradient-primary rounded-xl text-base font-semibold"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-white/50 text-sm">
                Don't have an account?{" "}
                <Link href="/signup">
                  <span className="text-primary hover:text-primary/80 cursor-pointer" data-testid="link-signup">
                    Request Access
                  </span>
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-white/40 text-sm mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
