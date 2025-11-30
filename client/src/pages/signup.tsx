import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Mail, Lock, Phone, ArrowRight, Check, Sparkles } from "lucide-react";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    phone: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const signupMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/auth/signup", {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        businessName: data.businessName,
        phone: data.phone || undefined,
      });
      return response.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/check"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Account created!",
        description: "Welcome to Treasure Coast AI. Redirecting to your dashboard...",
      });
      setTimeout(() => {
        window.location.href = "/client/dashboard";
      }, 1000);
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to create account. Please try again.";
      toast({
        title: "Signup failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      signupMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0f1a] via-[#0d1424] to-[#0a0f1a] p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>
      
      <Card className="w-full max-w-lg relative bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">Create Your Account</CardTitle>
          <CardDescription className="text-white/60">
            Start building AI-powered chatbots for your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white/80">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange("fullName")}
                    className={`pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 ${errors.fullName ? 'border-red-500' : ''}`}
                    data-testid="input-fullname"
                  />
                </div>
                {errors.fullName && <p className="text-red-400 text-sm">{errors.fullName}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-white/80">Business Name *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="My Awesome Business"
                    value={formData.businessName}
                    onChange={handleChange("businessName")}
                    className={`pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 ${errors.businessName ? 'border-red-500' : ''}`}
                    data-testid="input-business-name"
                  />
                </div>
                {errors.businessName && <p className="text-red-400 text-sm">{errors.businessName}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange("email")}
                  className={`pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 ${errors.email ? 'border-red-500' : ''}`}
                  autoComplete="email"
                  data-testid="input-email"
                />
              </div>
              {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white/80">Phone Number (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={handleChange("phone")}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  data-testid="input-phone"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={handleChange("password")}
                    className={`pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 ${errors.password ? 'border-red-500' : ''}`}
                    autoComplete="new-password"
                    data-testid="input-password"
                  />
                </div>
                {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white/80">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    className={`pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    autoComplete="new-password"
                    data-testid="input-confirm-password"
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-sm">{errors.confirmPassword}</p>}
              </div>
            </div>
            
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white py-6 text-lg gap-2"
                disabled={signupMutation.isPending}
                data-testid="button-signup"
              >
                {signupMutation.isPending ? (
                  "Creating your account..."
                ) : (
                  <>
                    Get Started Free
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 text-white/40 text-xs pt-2">
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3 text-green-400" />
                No credit card required
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3 text-green-400" />
                Free plan included
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3 text-green-400" />
                Cancel anytime
              </div>
            </div>
            
            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-white/60 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
