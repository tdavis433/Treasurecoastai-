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
  ArrowLeft,
  TestTube2,
  ExternalLink,
  CheckCircle2,
  Zap,
  ClipboardList,
  Scissors,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  Users,
  Award,
  TrendingUp,
  Quote
} from "lucide-react";
import { Link } from "wouter";

function ParticleField({ color = "245, 158, 11" }: { color?: string }) {
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
        ctx.fillStyle = `rgba(${color}, ${particle.opacity})`;
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
}

function AmbientBackground({ primaryColor = "245, 158, 11", secondaryColor = "168, 85, 247" }: { primaryColor?: string; secondaryColor?: string }) {
  return (
    <>
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(${primaryColor}, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(${secondaryColor}, 0.05) 0%, transparent 40%),
            radial-gradient(ellipse 60% 40% at 20% 80%, rgba(${primaryColor}, 0.04) 0%, transparent 40%)
          `,
          animation: 'ambientShift 35s ease-in-out infinite'
        }}
      />
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            conic-gradient(from 0deg at 50% 50%, 
              rgba(${primaryColor}, 0.03) 0deg,
              rgba(10, 15, 25, 0.02) 90deg,
              rgba(0, 0, 0, 0.01) 180deg,
              rgba(10, 15, 25, 0.02) 270deg,
              rgba(${primaryColor}, 0.03) 360deg
            )
          `,
          animation: 'cinematicRotate 100s linear infinite',
          opacity: 0.4
        }}
      />
      <style>{`
        @keyframes ambientShift {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.02); }
        }
        @keyframes cinematicRotate {
          0% { transform: rotate(0deg) scale(1.5); }
          100% { transform: rotate(360deg) scale(1.5); }
        }
        @keyframes gradientSlide {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </>
  );
}

function AnimatedUnderline({ color = "#F59E0B" }: { color?: string }) {
  return (
    <div 
      className="h-[2px] w-64 mx-auto mt-4 rounded-full"
      style={{
        background: `linear-gradient(90deg, transparent, ${color}, #A855F7, ${color}, transparent)`,
        backgroundSize: '200% 100%',
        animation: 'gradientSlide 20s linear infinite',
        opacity: 0.3
      }}
    />
  );
}

const services = [
  { name: "Signature Haircut", price: "$35", duration: "45 min", description: "Precision cut with hot towel, shampoo & styling", popular: true },
  { name: "Hot Towel Shave", price: "$40", duration: "45 min", description: "Traditional straight razor shave with premium products" },
  { name: "Haircut & Beard Combo", price: "$50", duration: "1 hr", description: "Full haircut plus beard shaping - the complete package", popular: true },
  { name: "Beard Trim & Shape", price: "$20", duration: "20 min", description: "Expert beard trimming and edge-up" },
  { name: "Kids Cut (12 & Under)", price: "$22", duration: "30 min", description: "Patient, kid-friendly cuts" },
  { name: "Grey Blending", price: "$30", duration: "30 min", description: "Natural-looking color that blends grey seamlessly" },
];

const team = [
  { name: "Marcus Williams", role: "Owner & Master Barber", years: "20+ years", specialty: "Classic Fades", image: "MW" },
  { name: "Danny Cruz", role: "Senior Barber", years: "12 years", specialty: "Modern Styles", image: "DC" },
  { name: "James Robinson", role: "Master Barber", years: "15 years", specialty: "Straight Razor Shaves", image: "JR" },
  { name: "Tyler Bennett", role: "Barber", years: "5 years", specialty: "Kids & Teens", image: "TB" },
];

const testimonials = [
  { name: "David M.", text: "Been coming here for 5 years. Marcus gives the best fade in the Treasure Coast. The hot towel finish is always on point.", rating: 5 },
  { name: "Steve R.", text: "Found them through their AI booking - so easy! Danny understood exactly what I wanted and nailed the cut.", rating: 5 },
  { name: "Tom H.", text: "Finally a barbershop that respects the traditional craft. James gives an incredible straight razor shave.", rating: 5 },
  { name: "Mike P.", text: "Best barbershop experience I've had. Clean shop, skilled barbers, and you can book online anytime.", rating: 5 },
];

const stats = [
  { value: "20+", label: "Years Experience", icon: Award },
  { value: "50,000+", label: "Haircuts Given", icon: Scissors },
  { value: "4.9", label: "Google Rating", icon: Star },
  { value: "4", label: "Expert Barbers", icon: Users },
];

const faqs = [
  { q: "Do I need an appointment?", a: "Walk-ins are always welcome! However, booking online guarantees your spot and reduces wait time." },
  { q: "How much is a haircut?", a: "Our signature haircut is $35 and includes hot towel, shampoo, and styling. Kids cuts are $22." },
  { q: "Can I request a specific barber?", a: "Absolutely! You can select your preferred barber when booking online." },
  { q: "Do you offer senior discounts?", a: "Yes! Seniors 65+ receive 15% off all services." },
  { q: "What products do you use?", a: "We use and sell premium products including American Crew, Layrite, and Reuzel." },
];

export default function DemoBarbershop() {
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const primaryColor = "#F59E0B";
  const primaryRgb = "245, 158, 11";

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/widget/embed.js";
    script.async = true;
    script.dataset.clientId = "ws_demo_barbershop";
    script.dataset.botId = "bot_demo_barbershop";
    script.dataset.theme = "dark";
    script.dataset.primaryColor = primaryColor;
    script.dataset.greeting = "Hey! I'm the Classic Cuts assistant. I can help you book an appointment, check wait times, or answer any questions about our services. What can I do for you?";
    script.dataset.showGreetingPopup = "true";
    script.dataset.greetingTitle = "Classic Cuts Assistant";
    script.dataset.greetingMessage = "Need a fresh cut? I can help you book with your favorite barber or answer any questions.";
    script.dataset.greetingDelay = "3";
    script.dataset.businessName = "Classic Cuts Assistant";
    script.dataset.businessSubtitle = "Barbershop • Demo";
    script.dataset.bubbleIcon = "scissors";
    
    script.onload = () => setWidgetLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
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
      <AmbientBackground primaryColor={primaryRgb} />
      <ParticleField color={primaryRgb} />
      
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

      <main className="relative z-10">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="text-center space-y-8">
            <div 
              className="relative p-8 rounded-2xl mx-auto max-w-3xl overflow-visible"
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="space-y-6 relative">
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-400/25 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                  <Scissors className="h-3 w-3 mr-1" style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.5))' }} />
                  Treasure Coast AI - Live Demo
                </Badge>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold" style={{ lineHeight: 1.2 }}>
                  <span 
                    className="block text-transparent bg-clip-text pb-1"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, #F59E0B 0%, #D97706 25%, #FBBF24 50%, #A855F7 75%, #C4B5FD 100%)',
                      filter: 'drop-shadow(0 0 30px rgba(245, 158, 11, 0.3))'
                    }}
                  >
                    Classic Cuts Barbershop
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
                    Where Style Meets Precision
                  </span>
                </h1>
                
                <AnimatedUnderline color={primaryColor} />
                
                <p className="text-base text-white/55 leading-relaxed max-w-2xl mx-auto">
                  Stuart's premier barbershop since 2004. Traditional craft meets modern style.
                  This is a <strong className="text-white/75">live AI assistant demo</strong> showing how 
                  Treasure Coast AI handles bookings and customer inquiries.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {[
                { icon: CheckCircle2, color: primaryColor, text: 'Book appointments 24/7' },
                { icon: CheckCircle2, color: '#A855F7', text: 'Choose your barber' },
                { icon: CheckCircle2, color: '#22C55E', text: 'Walk-ins welcome' }
              ].map((item, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-full"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <item.icon className="h-4 w-4" style={{ color: item.color }} />
                  <span className="text-sm text-white/65">{item.text}</span>
                </div>
              ))}
            </div>

            <div 
              className="max-w-lg mx-auto p-4 rounded-xl"
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.15)'
              }}
            >
              <div className="flex items-start gap-3">
                <TestTube2 className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-amber-400">Demo Environment</p>
                  <p className="text-sm text-white/45 mt-1">
                    Click the <span className="text-amber-400 font-medium">chat bubble</span> to try the AI assistant!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div 
                key={i}
                className="text-center p-6 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <stat.icon className="h-8 w-8 mx-auto mb-3" style={{ color: primaryColor }} />
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-400/25 mb-4">
              Our Services
            </Badge>
            <h2 className="text-3xl font-bold text-white">Premium Grooming Services</h2>
            <p className="text-white/50 mt-2">Book any service through our AI assistant</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <Card 
                key={i}
                className="border-0 relative overflow-hidden group"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                {service.popular && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-400/30 text-xs">Popular</Badge>
                  </div>
                )}
                <CardContent className="pt-6 pb-5 px-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                    <span className="text-xl font-bold" style={{ color: primaryColor }}>{service.price}</span>
                  </div>
                  <p className="text-sm text-white/50 mb-3">{service.description}</p>
                  <div className="flex items-center gap-1 text-white/40 text-sm">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{service.duration}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-400/25 mb-4">
              Meet The Team
            </Badge>
            <h2 className="text-3xl font-bold text-white">Master Barbers</h2>
            <p className="text-white/50 mt-2">Request your favorite barber when booking</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <div 
                key={i}
                className="text-center p-6 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <div 
                  className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}30 0%, rgba(168, 85, 247, 0.2) 100%)`,
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    color: primaryColor
                  }}
                >
                  {member.image}
                </div>
                <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                <p className="text-sm text-amber-400 mb-2">{member.role}</p>
                <p className="text-xs text-white/40">{member.years} • {member.specialty}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <Badge className="bg-green-500/10 text-green-400 border-green-400/25 mb-4">
              Reviews
            </Badge>
            <h2 className="text-3xl font-bold text-white">What Clients Say</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((review, i) => (
              <div 
                key={i}
                className="p-6 rounded-xl relative"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <Quote className="h-8 w-8 text-amber-500/20 absolute top-4 right-4" />
                <div className="flex gap-1 mb-3">
                  {[...Array(review.rating)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/70 mb-4 italic">"{review.text}"</p>
                <p className="text-sm font-medium text-white">— {review.name}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-400/25 mb-4">
              Platform Features
            </Badge>
            <h2 className="text-3xl font-bold text-white">What Treasure Coast AI Delivers</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: MessageCircle, color: primaryColor, title: '24/7 AI Booking', desc: 'Clients book appointments anytime. No phone tag, no waiting.' },
              { icon: Calendar, color: '#A855F7', title: 'Barber Selection', desc: 'AI helps clients choose the right barber for their style.' },
              { icon: BarChart3, color: '#22C55E', title: 'Live Dashboard', desc: 'Track every booking, lead, and conversation in real-time.' }
            ].map((card, i) => (
              <Card 
                key={i}
                className="border-0"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <CardContent className="pt-8 pb-6 px-6">
                  <div 
                    className="h-12 w-12 rounded-xl flex items-center justify-center mb-5"
                    style={{
                      background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}05 100%)`,
                      border: `1px solid ${card.color}20`
                    }}
                  >
                    <card.icon className="h-6 w-6" style={{ color: card.color }} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
                  <p className="text-sm text-white/45">{card.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <Badge className="bg-white/5 text-white/55 border-white/10 mb-4">
              FAQ
            </Badge>
            <h2 className="text-3xl font-bold text-white">Common Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div 
                key={i}
                className="p-5 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <h3 className="text-white font-medium mb-2">{faq.q}</h3>
                <p className="text-sm text-white/50">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div 
            className="p-8 rounded-2xl text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <h2 className="text-2xl font-bold text-white mb-4">Visit Classic Cuts</h2>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" style={{ color: primaryColor }} />
                <span>100 Main Street, Stuart, FL 34994</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" style={{ color: primaryColor }} />
                <span>(772) 555-CUTS</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: primaryColor }} />
                <span>Tue-Fri 9-7 • Sat 8-5 • Sun 10-3</span>
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-4">
              <Button 
                size="lg"
                style={{ background: primaryColor }}
                className="text-black font-semibold"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Book Now
              </Button>
              <Button variant="outline" size="lg" className="border-white/20 text-white">
                <Phone className="h-4 w-4 mr-2" />
                Call Shop
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 relative z-10" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TreasureCoastLogo variant="icon" size="sm" />
              <span className="text-sm text-white/35">Treasure Coast AI - Empowering Local Businesses</span>
            </div>
            <p className="text-xs text-white/25">Demo featuring Classic Cuts Barbershop - Stuart, FL</p>
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
