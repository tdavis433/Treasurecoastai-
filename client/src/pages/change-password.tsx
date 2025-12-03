import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TreasureCoastLogo } from "@/components/treasure-coast-logo";
import { Lock, Shield, CheckCircle } from "lucide-react";

export default function ChangePassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: user } = useQuery<{ id: string; username: string; role: string; mustChangePassword: boolean }>({
    queryKey: ["/api/auth/me"],
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { newPassword: string; confirmPassword: string }) => {
      const response = await apiRequest("POST", "/api/auth/change-password", data);
      return response.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Password updated!",
        description: "Your new password has been set successfully.",
      });
      setTimeout(() => {
        if (data.redirect) {
          window.location.href = data.redirect;
        } else if (user?.role === "super_admin") {
          window.location.href = "/super-admin";
        } else {
          window.location.href = "/client/dashboard";
        }
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update password",
        description: error.message || "Please check your password requirements",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({ newPassword, confirmPassword });
  };

  const passwordRequirements = [
    { met: newPassword.length >= 8, text: "At least 8 characters" },
    { met: /[A-Z]/.test(newPassword), text: "One uppercase letter" },
    { met: /[a-z]/.test(newPassword), text: "One lowercase letter" },
    { met: /[0-9]/.test(newPassword), text: "One number" },
  ];

  const allRequirementsMet = passwordRequirements.every(req => req.met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center hero-mesh relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <motion.div 
        className="relative z-10 w-full max-w-md px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6" data-testid="text-logo">
            <TreasureCoastLogo size="lg" />
          </div>
        </div>

        <div className="glass-card p-8 relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 p-[1px]">
            <div className="w-full h-full rounded-2xl bg-background/95" />
          </div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-sm mb-4">
                <Shield className="w-3.5 h-3.5" />
                <span>Security Required</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2" data-testid="text-change-password-title">Set Your Password</h1>
              <p className="text-white/60">Please create a new secure password to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-white/80">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                    data-testid="input-new-password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white/80">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                <p className="text-white/60 text-sm font-medium mb-2">Password Requirements:</p>
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 ${req.met ? 'text-green-400' : 'text-white/20'}`} />
                    <span className={req.met ? 'text-green-400' : 'text-white/40'}>{req.text}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-sm pt-2 border-t border-white/10 mt-2">
                  <CheckCircle className={`w-4 h-4 ${passwordsMatch ? 'text-green-400' : 'text-white/20'}`} />
                  <span className={passwordsMatch ? 'text-green-400' : 'text-white/40'}>Passwords match</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 btn-gradient-primary rounded-xl text-base font-semibold"
                disabled={changePasswordMutation.isPending || !allRequirementsMet || !passwordsMatch}
                data-testid="button-change-password"
              >
                {changePasswordMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </span>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-white/40 text-sm mt-6">
          This is a one-time requirement to secure your account
        </p>
      </motion.div>
    </div>
  );
}
