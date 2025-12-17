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
  Heart,
  Palette
} from "lucide-react";
import { Link } from "wouter";

function ParticleField({ color = "244, 114, 182" }: { color?: string }) {
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

function AmbientBackground({ primaryColor = "244, 114, 182" }: { primaryColor?: string }) {
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
  { name: "Classic Manicure", price: "$25", duration: "30 min", description: "Nail shaping, cuticle care, hand massage & polish" },
  { name: "Gel Manicure", price: "$45", duration: "45 min", description: "Long-lasting gel polish with LED curing - lasts 2+ weeks", popular: true },
  { name: "Classic Pedicure", price: "$40", duration: "45 min", description: "Foot soak, exfoliation, massage & polish" },
  { name: "Spa Pedicure", price: "$55", duration: "60 min", description: "Deluxe pedicure with paraffin, extended massage & mask", popular: true },
  { name: "Acrylic Full Set", price: "$70-90", duration: "90 min", description: "Full acrylic nail application with your choice of shape" },
  { name: "Acrylic Fill", price: "$45-55", duration: "60 min", description: "Maintenance fill for existing acrylic nails" },
  { name: "Dip Powder", price: "$55", duration: "60 min", description: "Durable, lightweight alternative to gel or acrylic" },
  { name: "Nail Art", price: "$5-20/nail", duration: "Varies", description: "Custom designs from simple accents to intricate art" },
  { name: "Gel-X Extensions", price: "$80-100", duration: "90 min", description: "Soft gel extensions for natural-looking length" },
  { name: "Mani-Pedi Combo", price: "$60", duration: "75 min", description: "Classic manicure + classic pedicure - save $5!", popular: true },
];

const team = [
  { name: "Linh Nguyen", role: "Owner & Nail Artist", years: "15 years", specialty: "Nail Art & Design", image: "LN" },
  { name: "Kim Tran", role: "Senior Technician", years: "12 years", specialty: "Acrylics", image: "KT" },
  { name: "Jessica Lee", role: "Nail Technician", years: "8 years", specialty: "Gel & Dip", image: "JL" },
  { name: "Maria Santos", role: "Nail Technician", years: "6 years", specialty: "Spa Pedicures", image: "MS" },
];

const testimonials = [
  { name: "Sarah T.", text: "Linh is an artist! She created the most beautiful nail design for my wedding. Everyone asked where I got them done.", rating: 5 },
  { name: "Michelle R.", text: "Finally found a nail salon that's truly clean! They use hospital-grade sanitation. My gel manicure lasted 3 weeks!", rating: 5 },
  { name: "Ashley K.", text: "The spa pedicure was heavenly. Maria takes her time and the massage is amazing. I fell asleep in the chair!", rating: 5 },
  { name: "Christina M.", text: "Love that I can book online anytime. No more calling during busy hours. The reminder texts are super helpful too!", rating: 5 },
];

const stats = [
  { value: "15+", label: "Years Experience", icon: Award },
  { value: "20,000+", label: "Happy Clients", icon: Heart },
  { value: "4.9", label: "Google Rating", icon: Star },
  { value: "4", label: "Expert Techs", icon: Users },
];

const faqs = [
  { q: "Do I need an appointment?", a: "Walk-ins are welcome but booking online guarantees your spot! You can book 24/7 through our AI assistant." },
  { q: "How long do gel nails last?", a: "Gel manicures typically last 2-3 weeks. We recommend coming back for removal to protect your natural nails." },
  { q: "Do you offer nail art?", a: "Yes! From simple French tips to intricate hand-painted designs. Show us a picture or let our artists create something unique." },
  { q: "What are your sanitation practices?", a: "We use hospital-grade sterilization for all metal tools and single-use files, buffers, and liners. Your safety is our priority." },
  { q: "Can I bring my own polish?", a: "Absolutely! We're happy to use your favorite colors. We also offer 500+ colors in-house." },
];

export default function DemoNails() {
  const primaryColor = "#F472B6";
  const primaryRgb = "244, 114, 182";

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/widget/embed.js";
    script.async = true;
    script.dataset.clientId = "demo_polished_nails";
    script.dataset.botId = "bot_demo_polished_nails";
    script.dataset.theme = "dark";
    script.dataset.primaryColor = primaryColor;
    script.dataset.greeting = "Hi! I'm the Polished Nail Studio assistant. I can help you book an appointment, check availability, or answer questions about our services. What can I help you with?";
    script.dataset.showGreetingPopup = "true";
    script.dataset.greetingTitle = "Polished Nails";
    script.dataset.greetingMessage = "Ready for gorgeous nails? Let me help you book an appointment!";
    script.dataset.greetingDelay = "3";
    script.dataset.businessName = "Polished Nails";
    script.dataset.businessSubtitle = "Nail Salon • Demo";
    script.dataset.bubbleIcon = "palette";
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
                <Badge className="bg-pink-400/10 text-pink-300 border-pink-400/25">
                  <Palette className="h-3 w-3 mr-1" /> Treasure Coast AI - Live Demo
                </Badge>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold" style={{ lineHeight: 1.2 }}>
                  <span className="block text-transparent bg-clip-text pb-1" style={{ backgroundImage: 'linear-gradient(135deg, #F472B6 0%, #EC4899 25%, #F9A8D4 50%, #A855F7 75%, #C4B5FD 100%)' }}>
                    Polished Nail Studio
                  </span>
                  <span className="block text-transparent bg-clip-text mt-2" style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.6) 100%)', fontSize: '0.45em', fontWeight: 500 }}>
                    Nails That Speak Style
                  </span>
                </h1>
                
                <div className="h-[2px] w-64 mx-auto mt-4 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${primaryColor}, #A855F7, ${primaryColor}, transparent)`, backgroundSize: '200% 100%', animation: 'gradientSlide 20s linear infinite', opacity: 0.3 }} />
                
                <p className="text-base text-white/55 leading-relaxed max-w-2xl mx-auto">
                  Stuart's favorite nail salon. Stunning designs, relaxing atmosphere, hospital-grade sanitation.
                  This is a <strong className="text-white/75">live AI demo</strong> showing how our assistant handles bookings.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {[
                { icon: CheckCircle2, color: primaryColor, text: 'Book online 24/7' },
                { icon: CheckCircle2, color: '#A855F7', text: 'Walk-ins welcome' },
                { icon: CheckCircle2, color: '#22C55E', text: 'Custom nail art' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <item.icon className="h-4 w-4" style={{ color: item.color }} />
                  <span className="text-sm text-white/65">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="max-w-lg mx-auto p-4 rounded-xl" style={{ background: 'rgba(244, 114, 182, 0.08)', border: '1px solid rgba(244, 114, 182, 0.15)' }}>
              <div className="flex items-start gap-3">
                <TestTube2 className="h-5 w-5 text-pink-300 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-pink-300">Demo Environment</p>
                  <p className="text-sm text-white/45 mt-1">Click the <span className="text-pink-300 font-medium">chat bubble</span> to try the AI assistant!</p>
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
            <Badge className="bg-pink-400/10 text-pink-300 border-pink-400/25 mb-4">Our Services</Badge>
            <h2 className="text-3xl font-bold text-white">Nail Services & Treatments</h2>
            <p className="text-white/50 mt-2">Book any service through our AI assistant</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {services.map((service, i) => (
              <Card key={i} className="border-0 relative" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                {service.popular && <div className="absolute top-2 right-2"><Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">Popular</Badge></div>}
                <CardContent className="pt-5 pb-4 px-4">
                  <h3 className="text-sm font-semibold text-white mb-1">{service.name}</h3>
                  <div className="text-base font-bold mb-1" style={{ color: primaryColor }}>{service.price}</div>
                  <p className="text-xs text-white/50 mb-1 line-clamp-2">{service.description}</p>
                  <div className="flex items-center gap-1 text-white/40 text-xs"><Clock className="h-3 w-3" /><span>{service.duration}</span></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-400/25 mb-4">Meet The Team</Badge>
            <h2 className="text-3xl font-bold text-white">Expert Nail Technicians</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <div key={i} className="text-center p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold" style={{ background: `linear-gradient(135deg, ${primaryColor}30 0%, rgba(168, 85, 247, 0.2) 100%)`, border: '2px solid rgba(255, 255, 255, 0.1)', color: primaryColor }}>
                  {member.image}
                </div>
                <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                <p className="text-sm text-pink-300 mb-2">{member.role}</p>
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
                <Quote className="h-8 w-8 text-pink-400/20 absolute top-4 right-4" />
                <div className="flex gap-1 mb-3">{[...Array(review.rating)].map((_, j) => <Star key={j} className="h-4 w-4 fill-pink-300 text-pink-300" />)}</div>
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
              { icon: MessageCircle, color: primaryColor, title: '24/7 AI Booking', desc: 'Clients book appointments anytime - even at midnight.' },
              { icon: Calendar, color: '#A855F7', title: 'Service Selection', desc: 'AI helps clients choose the right nail service for them.' },
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
            <h2 className="text-2xl font-bold text-white mb-4">Visit Polished Nail Studio</h2>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" style={{ color: primaryColor }} /><span>500 Palm Beach Rd, Stuart, FL</span></div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" style={{ color: primaryColor }} /><span>(772) 555-NAIL</span></div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" style={{ color: primaryColor }} /><span>Mon-Sat 10-7 • Sun 11-5</span></div>
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
          <p className="text-xs text-white/25">Demo featuring Polished Nail Studio - Stuart, FL</p>
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
