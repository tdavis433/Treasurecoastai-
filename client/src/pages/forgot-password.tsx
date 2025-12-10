import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TreasureCoastLogo } from "@/components/treasure-coast-logo";
import { Mail, ArrowLeft, CheckCircle, Sparkles } from "lucide-react";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to process request");
      }
      
      return data;
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    forgotPasswordMutation.mutate(email.trim());
  };

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
            {submitted ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2" data-testid="text-check-email-title">Check Your Email</h1>
                <p className="text-white/60 mb-6">
                  If an account exists for <span className="text-white">{email}</span>, we've sent a password reset link.
                </p>
                <p className="text-white/50 text-sm mb-6">
                  The link will expire in 60 minutes. Please also check your spam folder.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setSubmitted(false);
                      setEmail("");
                    }}
                    variant="outline"
                    className="w-full"
                    data-testid="button-try-different-email"
                  >
                    Try a different email
                  </Button>
                  <Link href="/login">
                    <Button className="w-full btn-gradient-primary" data-testid="button-back-to-login">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm mb-4">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Password Recovery</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2" data-testid="text-forgot-password-title">Forgot Password?</h1>
                  <p className="text-white/60">Enter your email address and we'll send you a link to reset your password.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/80">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                        data-testid="input-email"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 btn-gradient-primary rounded-xl text-base font-semibold"
                    disabled={forgotPasswordMutation.isPending || !email.trim()}
                    data-testid="button-send-reset-link"
                  >
                    {forgotPasswordMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                  <p className="text-white/50 text-sm">
                    Remember your password?{" "}
                    <Link href="/login">
                      <span className="text-primary hover:text-primary/80 cursor-pointer" data-testid="link-sign-in">
                        Sign In
                      </span>
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-white/40 text-sm mt-6">
          For security, reset links expire after 60 minutes
        </p>
      </motion.div>
    </div>
  );
}
