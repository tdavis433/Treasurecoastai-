import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Scissors, 
  Home, 
  Car, 
  Dumbbell, 
  Heart,
  MessageCircle,
  Bot,
  Zap,
  Shield,
  BarChart3,
  Clock,
  Users,
  Sparkles,
  ArrowRight,
  Check,
  Globe,
  Lock,
  Palette,
  Utensils,
  Syringe,
  Key,
  ChevronRight,
  Star
} from "lucide-react";

interface DemoBot {
  botId: string;
  clientId: string;
  name: string;
  description: string;
  businessType: string;
  businessName: string;
  isDemo: boolean;
}

const businessTypeIcons: Record<string, React.ReactNode> = {
  sober_living: <Heart className="h-6 w-6" />,
  restaurant: <Utensils className="h-6 w-6" />,
  barber_salon: <Scissors className="h-6 w-6" />,
  home_services: <Home className="h-6 w-6" />,
  auto_shop: <Car className="h-6 w-6" />,
  gym_fitness: <Dumbbell className="h-6 w-6" />,
  med_spa: <Syringe className="h-6 w-6" />,
  tattoo: <Palette className="h-6 w-6" />,
  real_estate: <Key className="h-6 w-6" />,
};

const businessTypeColors: Record<string, { bg: string; glow: string }> = {
  sober_living: { bg: "bg-rose-500/20", glow: "shadow-rose-500/20" },
  restaurant: { bg: "bg-orange-500/20", glow: "shadow-orange-500/20" },
  barber_salon: { bg: "bg-purple-500/20", glow: "shadow-purple-500/20" },
  home_services: { bg: "bg-blue-500/20", glow: "shadow-blue-500/20" },
  auto_shop: { bg: "bg-slate-500/20", glow: "shadow-slate-500/20" },
  gym_fitness: { bg: "bg-green-500/20", glow: "shadow-green-500/20" },
  med_spa: { bg: "bg-pink-500/20", glow: "shadow-pink-500/20" },
  tattoo: { bg: "bg-indigo-500/20", glow: "shadow-indigo-500/20" },
  real_estate: { bg: "bg-amber-500/20", glow: "shadow-amber-500/20" },
};

const businessTypeLabels: Record<string, string> = {
  sober_living: "Recovery Housing",
  restaurant: "Restaurant",
  barber_salon: "Barbershop",
  home_services: "Home Services",
  auto_shop: "Auto Shop",
  gym_fitness: "Fitness Center",
  med_spa: "Med Spa",
  tattoo: "Tattoo Studio",
  real_estate: "Real Estate",
};

const features = [
  {
    icon: <Zap className="h-6 w-6 text-cyan-400" />,
    title: "Smart Automations",
    description: "Trigger responses based on keywords, time, inactivity, and more. Capture leads automatically.",
    color: "cyan"
  },
  {
    icon: <Shield className="h-6 w-6 text-green-400" />,
    title: "Safety First",
    description: "Built-in crisis detection, PII protection, and content safety rules for every conversation.",
    color: "green"
  },
  {
    icon: <Globe className="h-6 w-6 text-blue-400" />,
    title: "Multi-Tenant Platform",
    description: "Manage multiple businesses from one dashboard with workspace isolation and RBAC.",
    color: "blue"
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-purple-400" />,
    title: "Rich Analytics",
    description: "Track conversations, leads, sessions, and trends with CSV exports and date filtering.",
    color: "purple"
  },
  {
    icon: <Palette className="h-6 w-6 text-pink-400" />,
    title: "Custom Widget",
    description: "Fully customizable chat widget with themes, positioning, sounds, and accessibility options.",
    color: "pink"
  },
  {
    icon: <Lock className="h-6 w-6 text-amber-400" />,
    title: "Enterprise Security",
    description: "Session management, rate limiting, webhook signing, and Stripe billing integration.",
    color: "amber"
  }
];

const stats = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "<2s", label: "Response Time" },
  { value: "10+", label: "Industry Templates" },
  { value: "24/7", label: "AI Availability" }
];

export default function DemosPage() {
  const { data, isLoading, error } = useQuery<{ bots: DemoBot[] }>({
    queryKey: ['/api/demos'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E13]">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4 bg-white/10" />
            <Skeleton className="h-6 w-96 mx-auto bg-white/10" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <GlassCard key={i} data-testid={`skeleton-card-${i}`}>
                <GlassCardHeader>
                  <Skeleton className="h-12 w-12 rounded-lg mb-2 bg-white/10" />
                  <Skeleton className="h-6 w-40 bg-white/10" />
                  <Skeleton className="h-4 w-full bg-white/10" />
                </GlassCardHeader>
                <GlassCardContent>
                  <Skeleton className="h-10 w-full bg-white/10" />
                </GlassCardContent>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0E13] flex items-center justify-center">
        <GlassCard className="max-w-md" data-testid="card-error">
          <GlassCardHeader>
            <GlassCardTitle className="text-red-400">Error Loading Demos</GlassCardTitle>
            <GlassCardDescription>
              Failed to load demo bots. Please try again later.
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <Button onClick={() => window.location.reload()} data-testid="button-retry">
              Retry
            </Button>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  const bots = data?.bots || [];

  return (
    <div className="min-h-screen bg-[#0B0E13] text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]" />
        </div>

        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />

        <div className="relative z-10 container mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-white/80">AI-Powered Customer Engagement</span>
          </div>

          {/* Main Heading */}
          <h1 
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            data-testid="text-hero-title"
          >
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Transform Your Business
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              With AI Assistants
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed">
            Deploy intelligent chatbots that handle customer inquiries 24/7, capture leads, 
            book appointments, and provide instant support across any industry.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/login">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-8 py-6 text-lg gap-2 shadow-lg shadow-cyan-500/25"
                data-testid="button-get-started"
              >
                <Bot className="h-5 w-5" />
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/faith-house">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg gap-2"
                data-testid="button-live-demo"
              >
                <Heart className="h-5 w-5 text-rose-400" />
                See Faith House Live
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/40 text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              5-minute setup
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              HIPAA-ready safety features
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative py-8 border-y border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-cyan-400" data-testid={`stat-value-${i}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-white/50 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Templates Section */}
      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-4 py-1">
              Industry Templates
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4" data-testid="text-templates-title">
              Ready for{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Any Industry
              </span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Choose from our pre-built templates or customize your own. Each bot is trained for 
              industry-specific conversations, FAQs, and safety protocols.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => {
              const colors = businessTypeColors[bot.businessType] || { bg: "bg-white/10", glow: "shadow-white/10" };
              return (
                <GlassCard 
                  key={bot.botId} 
                  hover
                  glow
                  className={`group ${colors.glow}`}
                  data-testid={`card-bot-${bot.botId}`}
                >
                  <GlassCardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className={`p-3 rounded-xl ${colors.bg} transition-transform group-hover:scale-110`}>
                        {businessTypeIcons[bot.businessType] || <MessageCircle className="h-6 w-6" />}
                      </div>
                      <Badge 
                        className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                        data-testid={`badge-type-${bot.botId}`}
                      >
                        {businessTypeLabels[bot.businessType] || bot.businessType}
                      </Badge>
                    </div>
                    <GlassCardTitle className="text-xl" data-testid={`text-bot-name-${bot.botId}`}>
                      {bot.businessName}
                    </GlassCardTitle>
                    <GlassCardDescription className="line-clamp-2">
                      {bot.description}
                    </GlassCardDescription>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <Link href={`/demo/${bot.botId}`}>
                      <Button 
                        className="w-full gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 group-hover:border-cyan-500/30" 
                        variant="outline"
                        data-testid={`button-open-demo-${bot.botId}`}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Try Demo
                        <ChevronRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </GlassCardContent>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28 relative bg-gradient-to-b from-transparent to-white/[0.02]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20 px-4 py-1">
              Platform Features
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Succeed
              </span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              A complete platform for deploying, managing, and scaling AI assistants 
              across your entire organization.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <GlassCard 
                key={i} 
                hover
                className="group"
                data-testid={`card-feature-${i}`}
              >
                <GlassCardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <GlassCardTitle className="text-lg">{feature.title}</GlassCardTitle>
                  <GlassCardDescription>
                    {feature.description}
                  </GlassCardDescription>
                </GlassCardHeader>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-500/10 text-green-400 border-green-500/20 px-4 py-1">
              Getting Started
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Launch in{" "}
              <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                Minutes
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Choose Template", desc: "Select from 10+ industry templates or start from scratch" },
              { step: "2", title: "Customize", desc: "Add your business info, FAQs, and personalization" },
              { step: "3", title: "Deploy", desc: "Embed on your website with a single line of code" }
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-cyan-400 group-hover:scale-110 transition-transform">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial/Social Proof */}
      <section className="py-16 border-y border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i} 
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-[#0B0E13] flex items-center justify-center text-sm font-medium"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-white/80">
                <span className="font-semibold">Trusted by businesses</span>{" "}
                <span className="text-white/50">on the Treasure Coast</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Transform Your{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Customer Experience?
              </span>
            </h2>
            <p className="text-lg text-white/60 mb-8">
              Join businesses using Treasure Coast AI to deliver exceptional 
              customer support, capture more leads, and grow faster.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-8 py-6 text-lg gap-2 shadow-lg shadow-cyan-500/25"
                data-testid="button-cta-bottom"
              >
                Start Building Today
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Link href="/login">
                <Button 
                  size="lg" 
                  variant="ghost" 
                  className="text-white/70 hover:text-white hover:bg-white/5 px-8 py-6 text-lg"
                  data-testid="button-login"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-white">Treasure Coast AI</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link href="/login" className="hover:text-white/70 transition-colors">Sign In</Link>
              <span className="hover:text-white/70 transition-colors cursor-pointer">Contact</span>
              <span className="hover:text-white/70 transition-colors cursor-pointer">Privacy</span>
            </div>
            <p className="text-sm text-white/40">
              2025 Treasure Coast AI. Built with care.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
