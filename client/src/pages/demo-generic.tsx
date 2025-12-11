import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TreasureCoastLogo } from "@/components/treasure-coast-logo";
import { Link } from "wouter";
import { 
  MessageCircle, 
  Calendar, 
  BarChart3,
  Sparkles,
  ArrowRight, 
  TestTube2,
  ExternalLink,
  CheckCircle2,
  Zap,
  ClipboardList,
  Heart,
  Car,
  Scissors,
  Dumbbell,
  Home,
  Syringe,
  Key,
  Utensils,
  Palette,
  ArrowLeft
} from "lucide-react";

interface DemoPageProps {
  workspaceSlug: string;
  botId: string;
}

interface DemoConfig {
  businessName: string;
  tagline: string;
  description: string;
  businessType: string;
  accentColor: string;
  features: string[];
  ctaText: string;
  icon: React.ReactNode;
}

const businessTypeConfigs: Record<string, Partial<DemoConfig>> = {
  auto_shop: {
    accentColor: "#64748b",
    icon: <Car className="h-8 w-8" />,
    features: [
      "Instant service estimates",
      "Appointment scheduling",
      "Service history access",
      "Maintenance reminders"
    ],
    ctaText: "Schedule Service"
  },
  barber_salon: {
    accentColor: "#a855f7",
    icon: <Scissors className="h-8 w-8" />,
    features: [
      "Easy appointment booking",
      "Barber availability",
      "Service menu & pricing",
      "Walk-in wait times"
    ],
    ctaText: "Book Now"
  },
  gym_fitness: {
    accentColor: "#22c55e",
    icon: <Dumbbell className="h-8 w-8" />,
    features: [
      "Membership info",
      "Class schedules",
      "Free trial booking",
      "Facility amenities"
    ],
    ctaText: "Start Free Trial"
  },
  home_services: {
    accentColor: "#3b82f6",
    icon: <Home className="h-8 w-8" />,
    features: [
      "Free estimates",
      "Service scheduling",
      "Emergency availability",
      "Project consultations"
    ],
    ctaText: "Get Estimate"
  },
  med_spa: {
    accentColor: "#ec4899",
    icon: <Syringe className="h-8 w-8" />,
    features: [
      "Treatment information",
      "Free consultations",
      "Pricing guidance",
      "Appointment booking"
    ],
    ctaText: "Book Consultation"
  },
  real_estate: {
    accentColor: "#f59e0b",
    icon: <Key className="h-8 w-8" />,
    features: [
      "Property search help",
      "Showing scheduling",
      "Market insights",
      "Agent matching"
    ],
    ctaText: "Find Properties"
  },
  restaurant: {
    accentColor: "#f97316",
    icon: <Utensils className="h-8 w-8" />,
    features: [
      "Reservation booking",
      "Menu information",
      "Event inquiries",
      "Dietary accommodations"
    ],
    ctaText: "Make Reservation"
  },
  tattoo: {
    accentColor: "#6366f1",
    icon: <Palette className="h-8 w-8" />,
    features: [
      "Artist portfolios",
      "Consultation booking",
      "Style guidance",
      "Pricing estimates"
    ],
    ctaText: "Book Consultation"
  },
  sober_living: {
    accentColor: "#ef4444",
    icon: <Heart className="h-8 w-8" />,
    features: [
      "Program information",
      "Tour scheduling",
      "Admissions guidance",
      "Family support"
    ],
    ctaText: "Schedule Tour"
  },
  pet_grooming: {
    accentColor: "#06b6d4",
    icon: <Heart className="h-8 w-8" />,
    features: [
      "Service options",
      "Appointment booking",
      "Pet care tips",
      "Pricing info"
    ],
    ctaText: "Book Grooming"
  }
};

function ParticleField({ accentColor }: { accentColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.008 + 0.003
      });
    }

    let animationFrame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `${accentColor}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [accentColor]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
}

function AmbientBackground({ accentColor }: { accentColor: string }) {
  return (
    <>
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, ${accentColor}15 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(168, 85, 247, 0.05) 0%, transparent 40%),
            radial-gradient(ellipse 60% 40% at 20% 80%, ${accentColor}10 0%, transparent 40%)
          `
        }}
      />
      <style>{`
        @keyframes gradientSlide {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </>
  );
}

export default function DemoGenericPage({ workspaceSlug, botId }: DemoPageProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { data: botData, isLoading } = useQuery<{
    botId: string;
    clientId: string;
    name: string;
    description: string;
    businessProfile: {
      businessName: string;
      type: string;
      location: string;
      phone: string;
      services: string[];
      highlights: string[];
    };
  }>({
    queryKey: ['/api/demo', botId],
  });

  const businessType = botData?.businessProfile?.type || 'general';
  const config = businessTypeConfigs[businessType] || businessTypeConfigs.sober_living;
  const accentColor = config.accentColor || '#00E5CC';
  const businessName = botData?.businessProfile?.businessName || botData?.name || 'AI Assistant';

  useEffect(() => {
    if (!botId || !accentColor || isLoading) return;

    const existingWidget = document.getElementById('tc-ai-widget-script');
    if (existingWidget) existingWidget.remove();
    
    const existingContainer = document.getElementById('tcai-bubble');
    if (existingContainer) existingContainer.remove();
    
    const existingIframe = document.getElementById('tcai-iframe');
    if (existingIframe) existingIframe.remove();

    const script = document.createElement('script');
    script.id = 'tc-ai-widget-script';
    script.src = '/widget/embed.js';
    script.async = true;
    script.setAttribute('data-bot-id', botId);
    script.setAttribute('data-client-id', workspaceSlug);
    script.setAttribute('data-primary-color', accentColor);
    script.setAttribute('data-theme', 'dark');
    script.setAttribute('data-business-name', businessName);
    script.setAttribute('data-business-type', businessType);
    script.setAttribute('data-show-greeting-popup', 'true');
    script.setAttribute('data-greeting-title', `Chat with ${businessName}`);
    script.setAttribute('data-greeting-message', 'Hi! How can I help you today?');
    script.setAttribute('data-greeting-delay', '2');
    document.body.appendChild(script);

    return () => {
      const widget = document.getElementById('tc-ai-widget-script');
      if (widget) widget.remove();
      const bubble = document.getElementById('tcai-bubble');
      if (bubble) bubble.remove();
      const iframe = document.getElementById('tcai-iframe');
      if (iframe) iframe.remove();
      const popup = document.getElementById('tcai-greeting-popup');
      if (popup) popup.remove();
      if ((window as any).TreasureCoastAI) {
        (window as any).TreasureCoastAI.initialized = false;
      }
    };
  }, [botId, workspaceSlug, accentColor, businessName]);

  const description = botData?.description || 'AI-powered customer assistant';
  const features = config.features || [];
  const services = botData?.businessProfile?.services || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E13] flex items-center justify-center">
        <div className="text-white/60">Loading demo...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E13] text-white overflow-x-hidden">
      <AmbientBackground accentColor={accentColor} />
      <ParticleField accentColor={accentColor} />

      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <Link href="/demos">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" data-testid="link-back-demos">
              <ArrowLeft className="h-4 w-4 text-white/70" />
              <span className="text-white/70 text-sm">All Demos</span>
            </div>
          </Link>
          <div className="flex items-center" data-testid="text-logo">
            <TreasureCoastLogo size="md" />
          </div>
          <Link href="/login">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" data-testid="button-login">
              Client Login
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 pt-24 pb-20">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 text-center mb-16">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ 
              background: `${accentColor}20`,
              border: `1px solid ${accentColor}40`
            }}
          >
            <TestTube2 className="h-4 w-4" style={{ color: accentColor }} />
            <span className="text-sm font-medium" style={{ color: accentColor }}>Live Demo</span>
          </div>

          <div 
            className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{ 
              background: `${accentColor}20`,
              border: `1px solid ${accentColor}30`,
              color: accentColor
            }}
          >
            {config.icon}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4" data-testid="text-demo-title">
            {businessName}
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-8">
            {description}
          </p>

          <Button 
            size="lg"
            className="gap-2 text-white"
            style={{ background: accentColor }}
            onClick={() => {
              const widget = document.querySelector('[data-tc-widget-toggle]') as HTMLElement;
              if (widget) widget.click();
            }}
            data-testid="button-try-chat"
          >
            <MessageCircle className="h-5 w-5" />
            Chat with this AI Assistant
            <ArrowRight className="h-5 w-5" />
          </Button>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <Card 
                key={i} 
                className="bg-white/5 border-white/10 backdrop-blur-sm"
                data-testid={`card-feature-${i}`}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: accentColor }} />
                  <span className="text-white/80 text-sm">{feature}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {services.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">Services</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {services.slice(0, 8).map((service, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="text-white/70 border-white/20 px-4 py-2"
                >
                  {service}
                </Badge>
              ))}
            </div>
          </section>
        )}

        <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-16">
          <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-8 text-center">
              <div 
                className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center"
                style={{ background: `${accentColor}20` }}
              >
                <Sparkles className="h-8 w-8" style={{ color: accentColor }} />
              </div>
              <h3 className="text-2xl font-bold mb-4">What Treasure Coast AI Does</h3>
              <p className="text-white/60 mb-6 max-w-2xl mx-auto">
                We build and manage custom AI assistants like this one for local businesses. 
                Your AI handles customer questions, captures leads, and books appointments 24/7 — 
                so you can focus on running your business.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 text-white/70">
                  <MessageCircle className="h-5 w-5" style={{ color: accentColor }} />
                  <span>24/7 Customer Support</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <ClipboardList className="h-5 w-5" style={{ color: accentColor }} />
                  <span>Lead Capture</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Calendar className="h-5 w-5" style={{ color: accentColor }} />
                  <span>Appointment Booking</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <BarChart3 className="h-5 w-5" style={{ color: accentColor }} />
                  <span>Analytics Dashboard</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-xl font-bold mb-4">Want one for your business?</h3>
          <p className="text-white/60 mb-6">
            We'll build and manage a custom AI assistant tailored to your needs.
          </p>
          <Link href="/#contact-form">
            <Button 
              size="lg"
              className="gap-2"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
              }}
              data-testid="button-get-started"
            >
              Get Started — We Build It For You
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-white/40 text-sm">
          © {new Date().getFullYear()} Treasure Coast AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
