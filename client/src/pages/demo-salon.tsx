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
  ArrowLeft,
  TestTube2,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Star,
  Users,
  Award,
  Quote,
  Heart
} from "lucide-react";
import { Link } from "wouter";

function ParticleField({ color = "236, 72, 153" }: { color?: string }) {
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
    for (let i = 0; i < 40; i++) {
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
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
        ctx.fill();
      });
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationFrame); };
  }, [color]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.8 }} />;
}

function AmbientBackground({ primaryColor = "236, 72, 153" }: { primaryColor?: string }) {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(${primaryColor}, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse 60% 40% at 80% 20%, rgba(168, 85, 247, 0.05) 0%, transparent 40%),
          radial-gradient(ellipse 60% 40% at 20% 80%, rgba(${primaryColor}, 0.04) 0%, transparent 40%)`,
        animation: 'ambientShift 35s ease-in-out infinite'
      }} />
      <style>{`
        @keyframes ambientShift { 0%, 100% { opacity: 1; } 50% { opacity: 0.85; } }
        @keyframes gradientSlide { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
      `}</style>
    </>
  );
}

const services = [
  { name: "Women's Haircut", price: "$55-75", duration: "60 min", description: "Precision cut with consultation, shampoo & blowout styling", popular: true },
  { name: "Blowout & Style", price: "$45", duration: "45 min", description: "Professional blowout with styling for any occasion" },
  { name: "Full Highlights", price: "$140-200", duration: "2.5 hrs", description: "Complete highlight transformation with toner", popular: true },
  { name: "Balayage", price: "$180-250", duration: "3 hrs", description: "Hand-painted highlights for a natural, sun-kissed look" },
  { name: "Color & Cut Combo", price: "$150+", duration: "2.5 hrs", description: "Full color service plus precision haircut" },
  { name: "Keratin Treatment", price: "$250-350", duration: "2.5 hrs", description: "Smoothing treatment for frizz-free hair up to 3 months" },
  { name: "Bridal Hair", price: "$150+", duration: "1.5 hrs", description: "Custom bridal styling with trial session included" },
  { name: "Extensions", price: "Consultation", duration: "3+ hrs", description: "Tape-in or hand-tied extensions for length and volume" },
];

const team = [
  { name: "Isabella Martinez", role: "Owner & Master Stylist", years: "18 years", specialty: "Balayage & Color", image: "IM" },
  { name: "Sophie Chen", role: "Senior Colorist", years: "12 years", specialty: "Vivid Colors", image: "SC" },
  { name: "Ashley Williams", role: "Stylist", years: "8 years", specialty: "Bridal & Events", image: "AW" },
  { name: "Emma Taylor", role: "Stylist", years: "6 years", specialty: "Extensions", image: "ET" },
];

const testimonials = [
  { name: "Jennifer L.", text: "Isabella completely transformed my hair! The balayage is exactly what I wanted. I get compliments everywhere I go.", rating: 5 },
  { name: "Maria S.", text: "Sophie is a color genius. She fixed my hair after a disaster at another salon. Now I won't go anywhere else!", rating: 5 },
  { name: "Amanda R.", text: "Ashley did my wedding hair and it was absolutely perfect. Even with humidity, it stayed flawless all day.", rating: 5 },
  { name: "Lisa M.", text: "The online booking is so convenient! I can see all available times and book my favorite stylist at midnight.", rating: 5 },
];

const stats = [
  { value: "18+", label: "Years Experience", icon: Award },
  { value: "15,000+", label: "Happy Clients", icon: Heart },
  { value: "4.9", label: "Google Rating", icon: Star },
  { value: "4", label: "Expert Stylists", icon: Users },
];

const faqs = [
  { q: "Do I need an appointment?", a: "Yes, we're appointment-only to ensure you get dedicated time with your stylist. Book online 24/7!" },
  { q: "How do I choose the right service?", a: "Our AI assistant can help! Describe what you're looking for and we'll recommend the best service." },
  { q: "Can I see photos of your work?", a: "Yes! Check our Instagram @glamourstudiostuart or ask our AI for examples of specific styles." },
  { q: "Do you do wedding parties?", a: "Absolutely! We offer bridal packages including trials. Contact us for group pricing." },
  { q: "What products do you use?", a: "We use Olaplex, Redken, and Kevin Murphy products. All available for purchase." },
];

export default function DemoSalon() {
  const primaryColor = "#EC4899";
  const primaryRgb = "236, 72, 153";

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/widget/embed.js";
    script.async = true;
    script.dataset.clientId = "demo_glamour_salon";
    script.dataset.botId = "bot_demo_glamour_salon";
    script.dataset.theme = "dark";
    script.dataset.primaryColor = primaryColor;
    script.dataset.greeting = "Hi! I'm the Glamour Studio assistant. I can help you book an appointment, recommend services, or answer any questions about our salon. What are you looking for today?";
    script.dataset.showGreetingPopup = "true";
    script.dataset.greetingTitle = "Glamour Studio";
    script.dataset.greetingMessage = "Ready for a new look? I can help you book with your favorite stylist!";
    script.dataset.greetingDelay = "3";
    script.dataset.businessName = "Glamour Studio";
    script.dataset.businessSubtitle = "Hair Salon • Demo";
    script.dataset.bubbleIcon = "sparkles";
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      ["tcai-bubble", "tcai-iframe", "tcai-greeting-popup"].forEach(id => document.getElementById(id)?.remove());
      if (window.TreasureCoastAI) {
        if (window.TreasureCoastAI.bubblePulseInterval) clearInterval(window.TreasureCoastAI.bubblePulseInterval);
        window.TreasureCoastAI.initialized = false;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050608] relative overflow-hidden">
      <AmbientBackground primaryColor={primaryRgb} />
      <ParticleField color={primaryRgb} />
      
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/demos"><div className="flex items-center gap-2 cursor-pointer hover:opacity-80"><ArrowLeft className="h-4 w-4 text-white/70" /><span className="text-white/70 text-sm">All Demos</span></div></Link>
          <TreasureCoastLogo size="md" />
          <Link href="/login"><Button variant="outline" className="border-white/20 text-white hover:bg-white/10">Client Login</Button></Link>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="text-center space-y-8">
            <div className="relative p-8 rounded-2xl mx-auto max-w-3xl" style={{ background: 'rgba(0, 0, 0, 0.25)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <div className="space-y-6">
                <Badge className="bg-pink-500/10 text-pink-400 border-pink-400/25">
                  <Sparkles className="h-3 w-3 mr-1" /> Treasure Coast AI - Live Demo
                </Badge>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold" style={{ lineHeight: 1.2 }}>
                  <span className="block text-transparent bg-clip-text pb-1" style={{ backgroundImage: 'linear-gradient(135deg, #EC4899 0%, #DB2777 25%, #F472B6 50%, #A855F7 75%, #C4B5FD 100%)' }}>
                    Glamour Studio Salon
                  </span>
                  <span className="block text-transparent bg-clip-text mt-2" style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.6) 100%)', fontSize: '0.45em', fontWeight: 500 }}>
                    Where Beauty Begins
                  </span>
                </h1>
                
                <div className="h-[2px] w-64 mx-auto mt-4 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${primaryColor}, #A855F7, ${primaryColor}, transparent)`, backgroundSize: '200% 100%', animation: 'gradientSlide 20s linear infinite', opacity: 0.3 }} />
                
                <p className="text-base text-white/55 leading-relaxed max-w-2xl mx-auto">
                  Jensen Beach's premier hair salon. Expert colorists, stunning transformations.
                  This is a <strong className="text-white/75">live AI demo</strong> showing how our assistant handles bookings and consultations.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {[
                { icon: CheckCircle2, color: primaryColor, text: 'Book online 24/7' },
                { icon: CheckCircle2, color: '#A855F7', text: 'Expert colorists' },
                { icon: CheckCircle2, color: '#22C55E', text: 'Bridal services' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <item.icon className="h-4 w-4" style={{ color: item.color }} />
                  <span className="text-sm text-white/65">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="max-w-lg mx-auto p-4 rounded-xl" style={{ background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.15)' }}>
              <div className="flex items-start gap-3">
                <TestTube2 className="h-5 w-5 text-pink-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-pink-400">Demo Environment</p>
                  <p className="text-sm text-white/45 mt-1">Click the <span className="text-pink-400 font-medium">chat bubble</span> to try the AI assistant!</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <stat.icon className="h-8 w-8 mx-auto mb-3" style={{ color: primaryColor }} />
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <Badge className="bg-pink-500/10 text-pink-400 border-pink-400/25 mb-4">Our Services</Badge>
            <h2 className="text-3xl font-bold text-white">Hair Services & Treatments</h2>
            <p className="text-white/50 mt-2">Book any service through our AI assistant</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((service, i) => (
              <Card key={i} className="border-0 relative" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                {service.popular && <div className="absolute top-3 right-3"><Badge className="bg-pink-500/20 text-pink-400 border-pink-400/30 text-xs">Popular</Badge></div>}
                <CardContent className="pt-6 pb-5 px-5">
                  <h3 className="text-base font-semibold text-white mb-2">{service.name}</h3>
                  <div className="text-lg font-bold mb-2" style={{ color: primaryColor }}>{service.price}</div>
                  <p className="text-xs text-white/50 mb-2">{service.description}</p>
                  <div className="flex items-center gap-1 text-white/40 text-xs"><Clock className="h-3 w-3" /><span>{service.duration}</span></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-400/25 mb-4">Meet The Team</Badge>
            <h2 className="text-3xl font-bold text-white">Expert Stylists</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <div key={i} className="text-center p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold" style={{ background: `linear-gradient(135deg, ${primaryColor}30 0%, rgba(168, 85, 247, 0.2) 100%)`, border: '2px solid rgba(255, 255, 255, 0.1)', color: primaryColor }}>
                  {member.image}
                </div>
                <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                <p className="text-sm text-pink-400 mb-2">{member.role}</p>
                <p className="text-xs text-white/40">{member.years} • {member.specialty}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <Badge className="bg-green-500/10 text-green-400 border-green-400/25 mb-4">Reviews</Badge>
            <h2 className="text-3xl font-bold text-white">What Clients Say</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((review, i) => (
              <div key={i} className="p-6 rounded-xl relative" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <Quote className="h-8 w-8 text-pink-500/20 absolute top-4 right-4" />
                <div className="flex gap-1 mb-3">{[...Array(review.rating)].map((_, j) => <Star key={j} className="h-4 w-4 fill-pink-400 text-pink-400" />)}</div>
                <p className="text-white/70 mb-4 italic">"{review.text}"</p>
                <p className="text-sm font-medium text-white">— {review.name}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-400/25 mb-4">Platform Features</Badge>
            <h2 className="text-3xl font-bold text-white">What Treasure Coast AI Delivers</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: MessageCircle, color: primaryColor, title: '24/7 AI Booking', desc: 'Clients book consultations and appointments anytime.' },
              { icon: Calendar, color: '#A855F7', title: 'Service Recommendations', desc: 'AI helps clients choose the right service for their goals.' },
              { icon: BarChart3, color: '#22C55E', title: 'Live Dashboard', desc: 'Track bookings, leads, and conversations in real-time.' }
            ].map((card, i) => (
              <Card key={i} className="border-0" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-5" style={{ background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}05 100%)`, border: `1px solid ${card.color}20` }}>
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
            <Badge className="bg-white/5 text-white/55 border-white/10 mb-4">FAQ</Badge>
            <h2 className="text-3xl font-bold text-white">Common Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="p-5 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <h3 className="text-white font-medium mb-2">{faq.q}</h3>
                <p className="text-sm text-white/50">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="p-8 rounded-2xl text-center" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <h2 className="text-2xl font-bold text-white mb-4">Visit Glamour Studio</h2>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" style={{ color: primaryColor }} /><span>250 Ocean Blvd, Jensen Beach, FL</span></div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" style={{ color: primaryColor }} /><span>(772) 555-GLAM</span></div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" style={{ color: primaryColor }} /><span>Tue-Fri 9-8 • Sat 9-5</span></div>
            </div>
            <div className="mt-6 flex justify-center gap-4">
              <Button size="lg" style={{ background: primaryColor }} className="text-white font-semibold"><Calendar className="h-4 w-4 mr-2" />Book Appointment</Button>
              <Button variant="outline" size="lg" className="border-white/20 text-white"><Phone className="h-4 w-4 mr-2" />Call Salon</Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 relative z-10" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3"><TreasureCoastLogo variant="icon" size="sm" /><span className="text-sm text-white/35">Treasure Coast AI</span></div>
          <p className="text-xs text-white/25">Demo featuring Glamour Studio Salon - Jensen Beach, FL</p>
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
