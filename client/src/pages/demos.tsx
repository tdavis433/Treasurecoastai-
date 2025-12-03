import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TreasureCoastLogo } from "@/components/treasure-coast-logo";
import { PlatformHelpBot } from "@/components/platform-help-bot";
import { 
  Building2, 
  Scissors, 
  Home, 
  Car, 
  Dumbbell, 
  Heart,
  MessageCircle,
  Bot,
  Utensils,
  Syringe,
  Key,
  Palette,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Play
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

const businessTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  sober_living: { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/30" },
  restaurant: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  barber_salon: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  home_services: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  auto_shop: { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/30" },
  gym_fitness: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
  med_spa: { bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/30" },
  tattoo: { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/30" },
  real_estate: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
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
    <div className="min-h-screen bg-[#0B0E13] text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <TreasureCoastLogo size="sm" />
                <span className="text-xl font-bold text-white">Treasure Coast AI</span>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" className="text-white/70 hover:text-white gap-2" data-testid="button-back-home">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" data-testid="button-login">
                  Client Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Play className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-cyan-400 font-medium">Live Demos</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-demos-title">
            See Our AI Assistants{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              In Action
            </span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Try out real AI assistants we've built for different industries. 
            Chat with them to see how they handle questions, capture leads, and book appointments.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mb-12 text-center">
          <div>
            <div className="text-3xl font-bold text-cyan-400">{bots.length}</div>
            <div className="text-sm text-white/50">Live Demos</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <div className="text-3xl font-bold text-purple-400">GPT-4</div>
            <div className="text-sm text-white/50">Powered</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <div className="text-3xl font-bold text-green-400">24/7</div>
            <div className="text-sm text-white/50">Available</div>
          </div>
        </div>

        {/* Demo Grid */}
        {bots.length === 0 ? (
          <div className="text-center py-20">
            <Bot className="h-16 w-16 mx-auto text-white/20 mb-4" />
            <h3 className="text-xl font-medium text-white/70 mb-2">No demos available yet</h3>
            <p className="text-white/50">Check back soon to see our AI assistants in action.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => {
              const colors = businessTypeColors[bot.businessType] || { bg: "bg-white/10", text: "text-white", border: "border-white/20" };
              return (
                <GlassCard 
                  key={bot.botId} 
                  hover
                  glow
                  className="group"
                  data-testid={`card-demo-${bot.botId}`}
                >
                  <GlassCardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className={`p-3 rounded-xl ${colors.bg} transition-transform duration-300 group-hover:scale-110`}>
                        {businessTypeIcons[bot.businessType] || <MessageCircle className="h-6 w-6" />}
                      </div>
                      <Badge 
                        className={`${colors.bg} ${colors.text} ${colors.border}`}
                        data-testid={`badge-type-${bot.botId}`}
                      >
                        {businessTypeLabels[bot.businessType] || bot.businessType}
                      </Badge>
                    </div>
                    <GlassCardTitle className="text-xl group-hover:text-cyan-300 transition-colors" data-testid={`text-demo-name-${bot.botId}`}>
                      {bot.businessName}
                    </GlassCardTitle>
                    <GlassCardDescription className="line-clamp-2 text-white/60">
                      {bot.description}
                    </GlassCardDescription>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <Link href={`/demo/${bot.botId}`}>
                      <Button 
                        className="w-full gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white" 
                        data-testid={`button-try-demo-${bot.botId}`}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Try This Demo
                        <ChevronRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </GlassCardContent>
                </GlassCard>
              );
            })}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <GlassCard className="max-w-2xl mx-auto p-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              <span className="text-cyan-400 font-medium">Want one for your business?</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              We'll Build Your Custom AI Assistant
            </h3>
            <p className="text-white/60 mb-6">
              Tell us about your business and we'll create a custom AI chatbot tailored to your needs.
            </p>
            <Link href="/#contact-form">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-8"
                data-testid="button-get-started-cta"
              >
                Get Started — We Build It For You
              </Button>
            </Link>
          </GlassCard>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-white/40 text-sm">
          © {new Date().getFullYear()} Treasure Coast AI. All rights reserved.
        </div>
      </footer>

      {/* Platform Help Bot */}
      <PlatformHelpBot variant="demo" />
    </div>
  );
}
