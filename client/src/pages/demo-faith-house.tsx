import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TreasureCoastLogo } from "@/components/treasure-coast-logo";
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
  ClipboardList
} from "lucide-react";

function ParticleField() {
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
        ctx.fillStyle = `rgba(0, 229, 204, ${particle.opacity})`;
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
}

function AmbientBackground() {
  return (
    <>
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 229, 204, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(168, 85, 247, 0.05) 0%, transparent 40%),
            radial-gradient(ellipse 60% 40% at 20% 80%, rgba(0, 229, 204, 0.04) 0%, transparent 40%)
          `,
          animation: 'ambientShift 35s ease-in-out infinite'
        }}
      />
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.04]"
        style={{
          background: `
            linear-gradient(90deg, transparent 0%, rgba(0, 229, 204, 0.2) 50%, transparent 100%)
          `,
          animation: 'glowStreak 25s linear infinite',
          transform: 'translateX(-100%)'
        }}
      />
      <style>{`
        @keyframes ambientShift {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.85;
            transform: scale(1.02);
          }
        }
        @keyframes glowStreak {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes gradientSlide {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
      `}</style>
    </>
  );
}

function AnimatedUnderline() {
  return (
    <div 
      className="h-[2px] w-64 mx-auto mt-4 rounded-full"
      style={{
        background: 'linear-gradient(90deg, transparent, #00E5CC, #A855F7, #00E5CC, transparent)',
        backgroundSize: '200% 100%',
        animation: 'gradientSlide 20s linear infinite',
        opacity: 0.2
      }}
    />
  );
}

export default function DemoFaithHouse() {
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/widget/embed.js";
    script.async = true;
    script.dataset.clientId = "faith_house_demo";
    script.dataset.botId = "faith_house_demo_main";
    script.dataset.theme = "dark";
    script.dataset.primaryColor = "#00E5CC";
    script.dataset.greeting = "Hi, I'm the Faith House Assistant. I can answer questions about our sober living home and help you book a tour or schedule a phone call. How can I assist you today?";
    script.dataset.showGreetingPopup = "true";
    script.dataset.greetingTitle = "Faith House Assistant";
    script.dataset.greetingMessage = "Hi there — I'm the Faith House Assistant. I can answer questions about our sober living home and help you book a tour or schedule a call.";
    script.dataset.greetingDelay = "3";
    script.dataset.businessName = "Faith House Assistant";
    script.dataset.businessSubtitle = "Sober Living • Demo";
    script.dataset.bubbleIcon = "house-plus";
    
    script.onload = () => {
      setWidgetLoaded(true);
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      const widgetBubble = document.getElementById("tcai-bubble");
      const widgetIframe = document.getElementById("tcai-iframe");
      const greetingPopup = document.getElementById("tcai-greeting-popup");
      if (widgetBubble) widgetBubble.remove();
      if (widgetIframe) widgetIframe.remove();
      if (greetingPopup) greetingPopup.remove();
      if (window.TreasureCoastAI) {
        if (window.TreasureCoastAI.bubblePulseInterval) {
          clearInterval(window.TreasureCoastAI.bubblePulseInterval);
          window.TreasureCoastAI.bubblePulseInterval = null;
        }
        window.TreasureCoastAI.initialized = false;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050608] relative overflow-hidden">
      <AmbientBackground />
      <ParticleField />
      <div id="faith-house-demo-widget" data-testid="faith-house-demo-widget" />
      
      <header className="border-b border-white/[0.06] bg-[#050608]/80 backdrop-blur-2xl sticky top-0 z-50 relative">
        <div 
          className="absolute bottom-0 left-0 right-0 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(0, 229, 204, 0.15), transparent)'
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <TreasureCoastLogo variant="full" size="md" />
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                className="bg-amber-500/15 text-amber-400 border-amber-400/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                data-testid="badge-demo-header"
              >
                <TestTube2 className="h-3 w-3 mr-1" />
                LIVE DEMO
              </Badge>
              <Button variant="outline" size="sm" className="border-white/15 text-white/60 hover:text-white hover:bg-white/[0.06] hover:border-white/25" asChild>
                <a href="/login" className="flex items-center gap-2">
                  Staff Login
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="text-center space-y-8">
          <div 
            className="relative p-8 rounded-2xl mx-auto max-w-3xl"
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div 
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, transparent 50%)'
              }}
            />
            
            <div className="space-y-6 relative">
              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-400/25 shadow-[0_0_20px_rgba(0,229,204,0.1)]">
                <Sparkles className="h-3 w-3 mr-1" style={{ filter: 'drop-shadow(0 0 4px rgba(0,229,204,0.5))' }} />
                Treasure Coast AI - Live Demo
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span 
                  className="block text-transparent bg-clip-text"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #00E5CC 0%, #00D4BD 25%, #5EEAD4 50%, #A78BFA 75%, #C4B5FD 100%)',
                    filter: 'drop-shadow(0 0 30px rgba(0, 229, 204, 0.3))'
                  }}
                >
                  Faith House Sober Living
                </span>
                <span 
                  className="block text-transparent bg-clip-text mt-2"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.6) 100%)',
                    fontSize: '0.45em',
                    fontWeight: 500,
                    letterSpacing: '0.05em'
                  }}
                >
                  Powered by Treasure Coast AI
                </span>
              </h1>
              
              <AnimatedUnderline />
              
              <p className="text-base text-white/55 leading-relaxed max-w-2xl mx-auto" style={{ letterSpacing: '0.01em' }}>
                Faith House is a structured men's sober living home in Port St. Lucie.
                This is a <strong className="text-white/75">live AI assistant demo</strong> showing how 
                Treasure Coast AI handles inquiries, tours, and phone call scheduling.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {[
              { icon: CheckCircle2, color: '#00E5CC', text: '24/7 AI assistant' },
              { icon: CheckCircle2, color: '#A855F7', text: 'Instant tour booking' },
              { icon: CheckCircle2, color: '#22C55E', text: 'Live dashboard' }
            ].map((item, i) => (
              <div 
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  boxShadow: `0 0 20px ${item.color}08`
                }}
              >
                <item.icon 
                  className="h-4 w-4" 
                  style={{ 
                    color: item.color,
                    filter: `drop-shadow(0 0 6px ${item.color}50)`
                  }} 
                />
                <span className="text-sm text-white/65">{item.text}</span>
              </div>
            ))}
          </div>

          <div 
            className="max-w-lg mx-auto p-4 rounded-xl transition-all duration-300"
            data-testid="demo-info-banner"
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.15)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 0 30px rgba(245, 158, 11, 0.05)'
            }}
          >
            <div className="flex items-start gap-3">
              <TestTube2 className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.4))' }} />
              <div className="text-left">
                <p className="text-sm font-medium text-amber-400">Demo Environment</p>
                <p className="text-sm text-white/45 mt-1">
                  Click the <span className="text-cyan-400 font-medium" style={{ textShadow: '0 0 10px rgba(0,229,204,0.3)' }}>chat bubble</span> in the bottom-right corner to try the AI assistant!
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              className="relative overflow-hidden text-[#0A0A0F] font-semibold shadow-[0_0_30px_rgba(0,229,204,0.35)] hover:shadow-[0_0_40px_rgba(0,229,204,0.5)] transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #00E5CC 0%, #00D4BD 50%, #00C2B3 100%)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
              asChild
            >
              <a href="/client/dashboard" className="flex items-center gap-2">
                View Demo Dashboard
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white/15 text-white/65 hover:text-white hover:bg-white/[0.06] hover:border-cyan-500/30 transition-all duration-300" 
              asChild
            >
              <a href="https://treasurecoastai.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                Learn More
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        <div 
          className="mt-24 pt-16 relative"
          style={{
            borderTop: '1px solid transparent',
            backgroundImage: 'linear-gradient(90deg, transparent, rgba(0, 229, 204, 0.1), transparent)',
            backgroundSize: '100% 1px',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'top'
          }}
        >
          <div className="text-center mb-12">
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-400/25 shadow-[0_0_20px_rgba(168,85,247,0.1)] mb-4">
              Platform Features
            </Badge>
            <h2 
              className="text-3xl font-bold text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.85) 100%)'
              }}
            >
              What Treasure Coast AI Delivers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                icon: MessageCircle, 
                color: '#00E5CC', 
                title: '24/7 AI Conversations',
                desc: 'Your AI assistant never sleeps. It answers questions, provides information, and captures leads around the clock - even when your team is offline.'
              },
              { 
                icon: Calendar, 
                color: '#A855F7', 
                title: 'Instant Tour & Call Bookings',
                desc: 'The AI collects visitor information naturally and creates structured bookings for tours or phone calls - no forms needed.'
              },
              { 
                icon: BarChart3, 
                color: '#22C55E', 
                title: 'Live Dashboard & Analytics',
                desc: 'Track every conversation, lead, and booking in real-time. Get insights into what visitors are asking and how your AI is performing.'
              }
            ].map((card, i) => (
              <Card 
                key={i}
                className="border-0 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 group"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)'
                }}
              >
                <CardContent className="pt-8 pb-6 px-6">
                  <div 
                    className="h-12 w-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}05 100%)`,
                      border: `1px solid ${card.color}20`,
                      boxShadow: `0 0 20px ${card.color}10`
                    }}
                  >
                    <card.icon 
                      className="h-6 w-6" 
                      style={{ 
                        color: card.color,
                        filter: `drop-shadow(0 0 8px ${card.color}40)`
                      }} 
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">
                    {card.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div 
          className="mt-20 p-8 rounded-2xl relative overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, rgba(0, 229, 204, 0.03) 0%, rgba(168, 85, 247, 0.03) 50%, rgba(0, 229, 204, 0.03) 100%)'
            }}
          />
          
          <div className="text-center mb-8 relative">
            <Badge className="bg-white/5 text-white/55 border-white/10 mb-3">
              <Zap className="h-3 w-3 mr-1" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }} />
              Under the Hood
            </Badge>
            <h3 className="text-xl font-semibold text-white">How It Works</h3>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 relative">
            {[
              { icon: MessageCircle, color: '#00E5CC', text: 'Visitor chats with AI' },
              { icon: ClipboardList, color: '#A855F7', text: 'AI collects booking info' },
              { icon: Calendar, color: '#22C55E', text: 'Booking created' },
              { icon: BarChart3, color: '#F59E0B', text: 'Appears in dashboard' }
            ].map((step, i, arr) => (
              <div key={i} className="flex items-center gap-4 md:gap-6">
                <div 
                  className="flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: `0 0 15px ${step.color}08`
                  }}
                >
                  <step.icon 
                    className="h-5 w-5" 
                    style={{ 
                      color: step.color,
                      filter: `drop-shadow(0 0 6px ${step.color}50)`
                    }} 
                  />
                  <span className="text-sm text-white/65">{step.text}</span>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-white/15 hidden md:block" />
                )}
                {i < arr.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-white/15 rotate-90 md:hidden" />
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer 
        className="mt-20 py-8 relative z-10"
        style={{
          borderTop: '1px solid transparent',
          backgroundImage: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent)',
          backgroundSize: '100% 1px',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TreasureCoastLogo variant="icon" size="sm" />
              <span className="text-sm text-white/35">
                Treasure Coast AI - Empowering Local Businesses
              </span>
            </div>
            <p className="text-xs text-white/25">
              Demo featuring Faith House Sober Living - Port St. Lucie, FL
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

declare global {
  interface Window {
    TreasureCoastAI?: {
      initialized: boolean;
      config: Record<string, unknown>;
      fullConfig: Record<string, unknown> | null;
      iframe: HTMLIFrameElement | null;
      bubble: HTMLDivElement | null;
      isOpen: boolean;
      bubblePulseInterval: ReturnType<typeof setInterval> | null;
      open: () => void;
      close: () => void;
      toggle: () => void;
    };
  }
}
