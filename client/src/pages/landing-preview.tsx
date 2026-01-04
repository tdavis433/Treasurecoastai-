import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import tcaBg from "@assets/tca_bg.jpg";
import tcaLogo from "@assets/tca_logo_nav.png";
import tcaWidgetMock from "@assets/tca_widget_mock.png";
import { 
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

export default function LandingPreview() {
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/bot-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      
      if (response.ok) {
        toast({ title: "Request received!", description: "We'll be in touch within 24 hours." });
        setContactForm({ name: '', email: '', phone: '', message: '' });
      } else {
        const data = await response.json().catch(() => ({}));
        toast({ title: "Something went wrong", description: data.error || "Please try again.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Connection error", description: "Please check your connection and try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-[rgba(245,248,255,0.92)] overflow-x-hidden" style={{ fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", background: "#0B0E13" }}>
      {/* Background Layer */}
      <div 
        className="fixed inset-0 -z-10"
        style={{ 
          backgroundImage: `url(${tcaBg})`,
          backgroundPosition: "center top",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat"
        }}
      >
        {/* Overlays */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(1200px 800px at 20% 10%, rgba(42, 246, 255, 0.18), transparent 55%),
              radial-gradient(900px 700px at 85% 18%, rgba(255, 79, 216, 0.14), transparent 60%),
              linear-gradient(to bottom,
                rgba(11,14,19,0.40) 0%,
                rgba(11,14,19,0.62) 45%,
                rgba(11,14,19,0.86) 75%,
                rgba(11,14,19,1.00) 100%
              )
            `
          }}
        />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 px-4 pt-4">
        <nav 
          className="max-w-[1200px] mx-auto px-5 py-3.5 rounded-[22px] flex items-center justify-between gap-3.5"
          style={{ 
            background: "rgba(10,12,18,0.45)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)"
          }}
        >
          <a href="#top" className="block" data-testid="logo">
            <img src={tcaLogo} alt="Treasure Coast AI" className="h-[34px] w-auto" />
          </a>
          
          <div className="hidden md:flex gap-5 font-medium text-[rgba(235,240,255,0.78)]">
            <a href="#how" className="px-2.5 py-2 rounded-xl hover:bg-white/5 transition-colors">How It Works</a>
            <a href="#templates" className="px-2.5 py-2 rounded-xl hover:bg-white/5 transition-colors">Templates</a>
            <a href="#pricing" className="px-2.5 py-2 rounded-xl hover:bg-white/5 transition-colors">Pricing</a>
          </div>
          
          <div className="flex gap-2.5 items-center">
            <Link href="/login">
              <button 
                className="hidden sm:inline-flex items-center justify-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ 
                  background: "rgba(10,12,18,0.35)",
                  border: "1px solid rgba(255,255,255,0.12)"
                }}
                data-testid="nav-login"
              >
                Client Login
              </button>
            </Link>
            <button 
              className="hidden sm:inline-flex items-center justify-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5"
              style={{ 
                background: "linear-gradient(135deg, rgba(42,246,255,0.28), rgba(255,79,216,0.22))",
                border: "1px solid rgba(255,255,255,0.16)",
                boxShadow: "0 10px 50px rgba(42,246,255,0.12), 0 10px 50px rgba(255,79,216,0.10)"
              }}
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="nav-book-demo"
            >
              Book Demo
            </button>
            <button 
              className="md:hidden p-2 rounded-xl hover:bg-white/5"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="nav-mobile-toggle"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-2 rounded-[22px] overflow-hidden"
              style={{ 
                background: "rgba(10,12,18,0.85)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)"
              }}
            >
              <div className="px-5 py-4 space-y-2">
                <a href="#how" className="block py-2 px-3 rounded-xl hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
                <a href="#templates" className="block py-2 px-3 rounded-xl hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>Templates</a>
                <a href="#pricing" className="block py-2 px-3 rounded-xl hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                <div className="pt-2 flex gap-2">
                  <Link href="/login" className="flex-1">
                    <button className="w-full py-2.5 rounded-full font-bold text-sm" style={{ background: "rgba(10,12,18,0.35)", border: "1px solid rgba(255,255,255,0.12)" }}>
                      Client Login
                    </button>
                  </Link>
                  <button 
                    className="flex-1 py-2.5 rounded-full font-bold text-sm"
                    style={{ background: "linear-gradient(135deg, rgba(42,246,255,0.28), rgba(255,79,216,0.22))", border: "1px solid rgba(255,255,255,0.16)" }}
                    onClick={() => { setMobileMenuOpen(false); document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' }); }}
                  >
                    Book Demo
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="px-4 pt-16 pb-4">
          <div className="max-w-[1200px] mx-auto grid md:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-[44px] md:text-[56px] font-extrabold leading-[1.02] tracking-tight mb-4">
                <span className="font-extrabold">AI Chatbots</span> that<br />
                run your front desk{" "}
                <span 
                  style={{ 
                    textShadow: "0 0 22px rgba(42,246,255,0.18), 0 0 22px rgba(255,79,216,0.14)"
                  }}
                >
                  24/7.
                </span>
              </h1>
              
              <p className="text-lg text-[rgba(210,220,255,0.72)] leading-relaxed max-w-[540px] mb-5">
                Answer questions instantly, capture leads, and send customers to booking—without hiring staff.
              </p>
              
              <div className="flex flex-wrap gap-3 items-center mb-5">
                <button 
                  className="inline-flex items-center justify-center gap-2.5 rounded-full px-5 py-3.5 font-bold transition-all hover:-translate-y-0.5"
                  style={{ 
                    background: "linear-gradient(135deg, rgba(42,246,255,0.28), rgba(255,79,216,0.22))",
                    border: "1px solid rgba(255,255,255,0.16)",
                    boxShadow: "0 10px 50px rgba(42,246,255,0.12), 0 10px 50px rgba(255,79,216,0.10)"
                  }}
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="hero-book-demo"
                >
                  Book a Live Demo
                </button>
                <button 
                  className="inline-flex items-center justify-center gap-2.5 rounded-full px-5 py-3.5 font-bold transition-all hover:-translate-y-0.5"
                  style={{ 
                    background: "rgba(10,12,18,0.35)",
                    border: "1px solid rgba(255,255,255,0.12)"
                  }}
                  onClick={() => document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="hero-view-demo"
                >
                  View Interactive Demo
                </button>
              </div>
              
              {/* Feature Strip */}
              <div 
                className="p-3.5 grid grid-cols-2 lg:grid-cols-4 gap-3 rounded-[26px]"
                style={{ 
                  background: "rgba(18, 22, 33, 0.55)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  backdropFilter: "blur(14px)",
                  boxShadow: "0 20px 80px rgba(0,0,0,0.55)"
                }}
              >
                {[
                  { color: "#2AF6FF", title: "24/7 Responses", sub: "Instant answers" },
                  { color: "#FF4FD8", title: "Lead Capture + Booking", sub: "Names, phones, intent" },
                  { color: "#2AF6FF", title: "Done-For-You Setup", sub: "We build + tune it" },
                  { color: "#FF4FD8", title: "Multi-Industry Templates", sub: "Copy/paste launch" },
                ].map((f, i) => (
                  <div 
                    key={i}
                    className="flex gap-2.5 items-center p-3 rounded-[18px]"
                    style={{ 
                      background: "rgba(10,12,18,0.35)",
                      border: "1px solid rgba(255,255,255,0.08)"
                    }}
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ 
                        background: f.color,
                        boxShadow: f.color === "#2AF6FF" 
                          ? "0 0 18px rgba(42,246,255,0.35)" 
                          : "0 0 18px rgba(255,79,216,0.35)"
                      }}
                    />
                    <div>
                      <div className="font-extrabold text-[13px]">{f.title}</div>
                      <div className="text-xs text-[rgba(210,220,255,0.70)] mt-0.5">{f.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Widget Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex justify-center"
            >
              <div 
                className="p-3.5 rounded-[28px]"
                style={{ 
                  background: "rgba(10,12,18,0.30)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 20px 80px rgba(0,0,0,0.55)"
                }}
              >
                <img 
                  src={tcaWidgetMock} 
                  alt="Treasure Coast AI chat widget preview" 
                  className="w-full max-w-[420px] h-auto rounded-[22px]"
                  style={{ filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.55))" }}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* BUILT FOR */}
        <section className="px-4 pt-4">
          <div 
            className="max-w-[1200px] mx-auto p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-[26px]"
            style={{ 
              background: "rgba(18, 22, 33, 0.55)",
              border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 20px 80px rgba(0,0,0,0.55)"
            }}
          >
            <div className="font-extrabold text-[rgba(235,240,255,0.85)]">Built For:</div>
            <div className="flex flex-wrap gap-2.5">
              {["Barbershops", "Salons", "Sober Living", "Home Services"].map((chip, i) => (
                <span 
                  key={i}
                  className="px-3.5 py-2.5 rounded-[18px] font-bold text-sm text-[rgba(235,240,255,0.86)]"
                  style={{ 
                    background: "rgba(10,12,18,0.35)",
                    border: "1px solid rgba(255,255,255,0.10)"
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="px-4 pt-8">
          <div 
            className="max-w-[1200px] mx-auto p-5 rounded-[26px]"
            style={{ 
              background: "rgba(18, 22, 33, 0.55)",
              border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 20px 80px rgba(0,0,0,0.55)"
            }}
          >
            <h2 className="text-[34px] font-bold tracking-tight mb-4">How It Works</h2>
            
            <div className="grid md:grid-cols-3 gap-3.5">
              {[
                { num: "01", title: "Add the widget to your website", text: "One copy/paste install. Works on any site." },
                { num: "02", title: "AI chats + qualifies leads 24/7", text: "Answers FAQs, captures info, and routes to booking." },
                { num: "03", title: "Manage everything in one dashboard", text: "See conversations, leads, and outcomes in real time." },
              ].map((step, i) => (
                <div 
                  key={i}
                  className="flex gap-3 p-4 rounded-[22px]"
                  style={{ 
                    background: "rgba(10,12,18,0.35)",
                    border: "1px solid rgba(255,255,255,0.10)"
                  }}
                >
                  <div 
                    className="px-3 py-2.5 rounded-[16px] font-black text-base"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <div className="font-extrabold mb-1.5">{step.title}</div>
                    <div className="text-sm text-[rgba(210,220,255,0.72)] leading-relaxed">{step.text}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div 
              className="mt-4 p-3.5 rounded-[22px] text-[rgba(235,240,255,0.90)]"
              style={{ 
                background: "rgba(42,246,255,0.06)",
                border: "1px solid rgba(42,246,255,0.18)"
              }}
            >
              <strong>Done-for-you setup:</strong> We configure the assistant, polish the answers, and make it match your brand.
            </div>
          </div>
        </section>

        {/* DEMO SHOWCASE */}
        <section id="demos" className="px-4 pt-8">
          <div 
            className="max-w-[1200px] mx-auto p-5 rounded-[26px]"
            style={{ 
              background: "rgba(18, 22, 33, 0.55)",
              border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 20px 80px rgba(0,0,0,0.55)"
            }}
          >
            <h2 className="text-[34px] font-bold tracking-tight mb-4">Demo Showcase</h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                { name: "Faith House — Sober Living", sub: "Admissions + FAQ + tour scheduling", path: "/demo/faith-house" },
                { name: "Fade Factory — Barbershop", sub: "Services + availability + booking links", path: "/demo/barber" },
                { name: "Luxe Locks — Salon", sub: "Pricing + consults + booking", path: "/demo/luxe-locks" },
                { name: "Polished Nails — Nail Studio", sub: "Services + scheduling + policies", path: "/demo/polished-nails" },
              ].map((demo, i) => (
                <Link key={i} href={demo.path}>
                  <div 
                    className="p-4 rounded-[22px] transition-all cursor-pointer hover:-translate-y-0.5"
                    style={{ 
                      background: "rgba(10,12,18,0.35)",
                      border: "1px solid rgba(255,255,255,0.10)"
                    }}
                  >
                    <div className="font-extrabold">{demo.name}</div>
                    <div className="text-sm text-[rgba(210,220,255,0.72)] mt-1.5">{demo.sub}</div>
                    <div className="mt-3.5 font-extrabold text-[rgba(235,240,255,0.90)]">Try the Demo →</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="px-4 pt-8">
          <div 
            className="max-w-[1200px] mx-auto p-5 rounded-[26px]"
            style={{ 
              background: "rgba(18, 22, 33, 0.55)",
              border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 20px 80px rgba(0,0,0,0.55)"
            }}
          >
            <h2 className="text-[34px] font-bold tracking-tight mb-4">Simple, Affordable Pricing</h2>
            
            <div className="grid md:grid-cols-2 gap-3.5">
              {/* Starter */}
              <div 
                className="p-4.5 rounded-[24px]"
                style={{ 
                  background: "rgba(10,12,18,0.35)",
                  border: "1px solid rgba(255,255,255,0.10)"
                }}
              >
                <div className="flex items-baseline justify-between mb-3">
                  <span className="font-black text-lg">Starter Plan</span>
                  <span className="font-black text-[32px]">$29<span className="font-bold text-sm text-[rgba(210,220,255,0.72)] ml-1">/mo</span></span>
                </div>
                <ul className="text-[rgba(220,230,255,0.82)] pl-4 mb-4 space-y-2 list-disc">
                  <li>1 website widget</li>
                  <li>Lead capture + routing</li>
                  <li>Basic FAQ + hours + location</li>
                  <li>Email support</li>
                </ul>
                <button 
                  className="w-full py-3.5 rounded-full font-bold transition-all hover:-translate-y-0.5"
                  style={{ 
                    background: "rgba(10,12,18,0.35)",
                    border: "1px solid rgba(255,255,255,0.12)"
                  }}
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Start Free
                </button>
              </div>
              
              {/* Pro */}
              <div 
                className="p-4.5 rounded-[24px]"
                style={{ 
                  background: "rgba(10,12,18,0.35)",
                  border: "1px solid rgba(42,246,255,0.22)",
                  boxShadow: "0 18px 70px rgba(42,246,255,0.10), 0 18px 70px rgba(255,79,216,0.08)"
                }}
              >
                <div className="flex items-baseline justify-between mb-3">
                  <span className="font-black text-lg">Pro Plan</span>
                  <span className="font-black text-[32px]">$79<span className="font-bold text-sm text-[rgba(210,220,255,0.72)] ml-1">/mo</span></span>
                </div>
                <ul className="text-[rgba(220,230,255,0.82)] pl-4 mb-4 space-y-2 list-disc">
                  <li>Everything in Starter</li>
                  <li>Done-for-you setup</li>
                  <li>Template install + tuning</li>
                  <li>Priority support</li>
                </ul>
                <button 
                  className="w-full py-3.5 rounded-full font-bold transition-all hover:-translate-y-0.5"
                  style={{ 
                    background: "linear-gradient(135deg, rgba(42,246,255,0.28), rgba(255,79,216,0.22))",
                    border: "1px solid rgba(255,255,255,0.16)",
                    boxShadow: "0 10px 50px rgba(42,246,255,0.12), 0 10px 50px rgba(255,79,216,0.10)"
                  }}
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-4 pt-11 text-center">
          <h2 className="text-[44px] font-bold tracking-tight mb-4">
            Unlock the{" "}
            <span style={{ textShadow: "0 0 22px rgba(42,246,255,0.18), 0 0 22px rgba(255,79,216,0.14)" }}>Future</span>
            {" "}of Sales.
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <button 
              className="inline-flex items-center justify-center gap-2.5 rounded-full px-5 py-3.5 font-bold transition-all hover:-translate-y-0.5"
              style={{ 
                background: "linear-gradient(135deg, rgba(42,246,255,0.28), rgba(255,79,216,0.22))",
                border: "1px solid rgba(255,255,255,0.16)",
                boxShadow: "0 10px 50px rgba(42,246,255,0.12), 0 10px 50px rgba(255,79,216,0.10)"
              }}
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Book a Demo
            </button>
            <button 
              className="inline-flex items-center justify-center gap-2.5 rounded-full px-5 py-3.5 font-bold transition-all hover:-translate-y-0.5"
              style={{ 
                background: "rgba(10,12,18,0.35)",
                border: "1px solid rgba(255,255,255,0.12)"
              }}
              onClick={() => document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Try the Live Demo
            </button>
          </div>
        </section>

        {/* DEMO / CONTACT FORM */}
        <section id="demo" className="px-4 pt-8">
          <div 
            className="max-w-[1200px] mx-auto p-5 rounded-[26px]"
            style={{ 
              background: "rgba(18, 22, 33, 0.55)",
              border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 20px 80px rgba(0,0,0,0.55)"
            }}
          >
            <h2 className="text-[34px] font-bold tracking-tight mb-1">Book a Demo</h2>
            <p className="text-[rgba(210,220,255,0.72)] mb-4">Drop your info and we'll set up a quick live walkthrough.</p>
            
            <form onSubmit={handleContactSubmit} className="grid gap-3 max-w-[520px]">
              <label className="block">
                <span className="block font-extrabold text-[13px] text-[rgba(235,240,255,0.86)] mb-1.5">Name</span>
                <input 
                  type="text"
                  placeholder="Your name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-3 rounded-[16px] text-[rgba(245,248,255,0.92)] outline-none transition-all"
                  style={{ 
                    background: "rgba(10,12,18,0.38)",
                    border: "1px solid rgba(255,255,255,0.10)"
                  }}
                  required
                  data-testid="input-contact-name"
                />
              </label>
              <label className="block">
                <span className="block font-extrabold text-[13px] text-[rgba(235,240,255,0.86)] mb-1.5">Email</span>
                <input 
                  type="email"
                  placeholder="you@company.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-3 rounded-[16px] text-[rgba(245,248,255,0.92)] outline-none transition-all"
                  style={{ 
                    background: "rgba(10,12,18,0.38)",
                    border: "1px solid rgba(255,255,255,0.10)"
                  }}
                  required
                  data-testid="input-contact-email"
                />
              </label>
              <label className="block">
                <span className="block font-extrabold text-[13px] text-[rgba(235,240,255,0.86)] mb-1.5">Phone</span>
                <input 
                  type="tel"
                  placeholder="(xxx) xxx-xxxx"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-3 rounded-[16px] text-[rgba(245,248,255,0.92)] outline-none transition-all"
                  style={{ 
                    background: "rgba(10,12,18,0.38)",
                    border: "1px solid rgba(255,255,255,0.10)"
                  }}
                  data-testid="input-contact-phone"
                />
              </label>
              <label className="block">
                <span className="block font-extrabold text-[13px] text-[rgba(235,240,255,0.86)] mb-1.5">Message</span>
                <textarea 
                  rows={4}
                  placeholder="What niche are you in? Barbershop, salon, etc."
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-3 rounded-[16px] text-[rgba(245,248,255,0.92)] outline-none transition-all resize-none"
                  style={{ 
                    background: "rgba(10,12,18,0.38)",
                    border: "1px solid rgba(255,255,255,0.10)"
                  }}
                  data-testid="input-contact-message"
                />
              </label>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50"
                style={{ 
                  background: "linear-gradient(135deg, rgba(42,246,255,0.28), rgba(255,79,216,0.22))",
                  border: "1px solid rgba(255,255,255,0.16)",
                  boxShadow: "0 10px 50px rgba(42,246,255,0.12), 0 10px 50px rgba(255,79,216,0.10)"
                }}
                data-testid="button-contact-submit"
              >
                {isSubmitting ? "Sending..." : "Book My Demo"}
              </button>
              <p className="text-xs text-center text-[rgba(210,220,255,0.60)]">
                No payment processing. You connect your own booking link.
              </p>
            </form>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="px-4 pt-7 pb-10 text-[rgba(210,220,255,0.70)]">
          <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>© 2025 Treasure Coast AI</div>
            <div>Your Business, Upgraded.</div>
          </div>
        </footer>
      </main>
    </div>
  );
}
