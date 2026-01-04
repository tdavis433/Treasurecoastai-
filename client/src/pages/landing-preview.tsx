import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import tcaBg from "@assets/tca_bg.jpg";
import tcaLogo from "@assets/tca_logo_nav.png";
import tcaWidgetMock from "@assets/tca_widget_mock.png";
import { Menu, X } from "lucide-react";

// CSS Variables matching design pack
const cssVars = {
  bg: "#0B0E13",
  glass: "rgba(18, 22, 33, 0.55)",
  glassStrong: "rgba(10, 12, 18, 0.62)",
  text: "rgba(245, 248, 255, 0.92)",
  muted: "rgba(210, 220, 255, 0.72)",
  cyan: "#2AF6FF",
  magenta: "#FF4FD8",
  border: "rgba(255,255,255,0.10)",
  shadow: "0 20px 80px rgba(0,0,0,0.55)",
};

// Reusable glass style
const glassStyle = {
  background: cssVars.glass,
  border: `1px solid ${cssVars.border}`,
  borderRadius: "26px",
  boxShadow: cssVars.shadow,
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};

// Button styles
const btnBase = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  fontWeight: 700,
  letterSpacing: "0.2px",
  cursor: "pointer",
  transition: "transform .15s ease, box-shadow .15s ease, background .15s ease",
};

const btnPrimary = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(42,246,255,0.28), rgba(255,79,216,0.22))",
  borderColor: "rgba(255,255,255,0.16)",
  boxShadow: "0 10px 50px rgba(42,246,255,0.12), 0 10px 50px rgba(255,79,216,0.10)",
};

const btnGhost = {
  ...btnBase,
  background: "rgba(10,12,18,0.35)",
};

const btnLg = { padding: "14px 18px", fontSize: "16px" };
const btnPill = { padding: "10px 14px", fontSize: "14px" };

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
    } catch {
      toast({ title: "Connection error", description: "Please check your connection and try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif", color: cssVars.text, background: cssVars.bg }}>
      {/* Background Layer */}
      <div 
        className="fixed inset-0"
        style={{ zIndex: -2, backgroundImage: `url(${tcaBg})`, backgroundPosition: "center top", backgroundSize: "cover", backgroundRepeat: "no-repeat", transform: "translateZ(0)" }}
        aria-hidden="true"
      >
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
      <header className="sticky top-0 z-50" style={{ padding: "18px 18px 0" }}>
        <nav 
          className="max-w-[1200px] mx-auto flex items-center justify-between"
          style={{ 
            padding: "14px 18px",
            borderRadius: "22px",
            background: "rgba(10,12,18,0.45)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            gap: "14px",
          }}
        >
          <a href="#top" data-testid="logo">
            <img src={tcaLogo} alt="Treasure Coast AI" style={{ height: "34px", width: "auto", display: "block" }} />
          </a>
          
          <nav className="hidden md:flex gap-5" style={{ fontWeight: 500, color: "rgba(235,240,255,0.78)" }} aria-label="Primary">
            <a href="#how" className="hover:bg-white/5 transition-colors" style={{ padding: "8px 10px", borderRadius: "12px" }}>How It Works</a>
            <a href="#demos" className="hover:bg-white/5 transition-colors" style={{ padding: "8px 10px", borderRadius: "12px" }}>Templates</a>
            <a href="#pricing" className="hover:bg-white/5 transition-colors" style={{ padding: "8px 10px", borderRadius: "12px" }}>Pricing</a>
          </nav>
          
          <div className="flex gap-2 items-center">
            <a 
              href="#demo" 
              style={{ ...btnGhost, ...btnPill }}
              className="hidden md:inline-flex hover:-translate-y-px"
              data-testid="nav-login"
            >
              Client Login
            </a>
            <a 
              href="#demo" 
              style={{ ...btnPrimary, ...btnPill }}
              className="hover:-translate-y-px"
              data-testid="nav-book-demo"
            >
              Book Demo
            </a>
            <button 
              className="md:hidden p-2 rounded-full hover:bg-white/10"
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
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden mt-2 rounded-2xl overflow-hidden"
              style={{ background: "rgba(10,12,18,0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}
            >
              <div className="p-4 space-y-2">
                <a href="#how" className="block py-2 px-3 rounded-xl hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
                <a href="#demos" className="block py-2 px-3 rounded-xl hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>Templates</a>
                <a href="#pricing" className="block py-2 px-3 rounded-xl hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main id="top">
        {/* HERO SECTION */}
        <section style={{ padding: "64px 18px 18px" }}>
          <div className="max-w-[1200px] mx-auto grid md:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
            {/* Left - Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 style={{ margin: "0 0 16px", fontSize: "clamp(44px, 5vw, 56px)", lineHeight: 1.02, letterSpacing: "-0.02em" }}>
                <span style={{ fontWeight: 800 }}>AI Chatbots</span> that<br />
                run your front desk <span style={{ fontWeight: 800, textShadow: "0 0 22px rgba(42,246,255,0.18), 0 0 22px rgba(255,79,216,0.14)" }}>24/7.</span>
              </h1>
              
              <p style={{ margin: "0 0 22px", color: cssVars.muted, fontSize: "18px", lineHeight: 1.5, maxWidth: "540px" }}>
                Answer questions instantly, capture leads, and send customers to booking—without hiring staff.
              </p>
              
              <div className="flex flex-wrap gap-3" style={{ marginBottom: "22px" }}>
                <a 
                  href="#demo" 
                  style={{ ...btnPrimary, ...btnLg }}
                  className="hover:-translate-y-px"
                  data-testid="hero-book-demo"
                >
                  Book a Live Demo
                </a>
                <a 
                  href="#demos" 
                  style={{ ...btnGhost, ...btnLg }}
                  className="hover:-translate-y-px"
                  data-testid="hero-view-demo"
                >
                  View Interactive Demo
                </a>
              </div>

            </motion.div>

            {/* Right - Phone Mockup with Frame */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center"
            >
              <div 
                style={{ 
                  padding: "14px",
                  borderRadius: "28px",
                  background: "rgba(10,12,18,0.30)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: cssVars.shadow,
                  backdropFilter: "blur(12px)",
                }}
              >
                <img 
                  src={tcaWidgetMock} 
                  alt="Treasure Coast AI chat widget preview" 
                  style={{ 
                    width: "min(420px, 90vw)", 
                    height: "auto", 
                    display: "block",
                    borderRadius: "22px",
                    filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.55))",
                  }}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* NEON DIVIDER + FEATURE STRIP */}
        <section style={{ padding: "24px 18px 0" }}>
          {/* Neon Line */}
          <div 
            style={{ 
              height: "3px", 
              maxWidth: "1200px", 
              margin: "0 auto 20px",
              background: "linear-gradient(90deg, transparent 5%, rgba(42,246,255,0.8) 25%, rgba(255,79,216,0.8) 75%, transparent 95%)",
              boxShadow: "0 0 30px rgba(42,246,255,0.6), 0 0 60px rgba(255,79,216,0.5), 0 0 10px rgba(42,246,255,0.8)",
              borderRadius: "2px",
            }}
          />
          
          {/* Feature Strip */}
          <div 
            className="max-w-[1200px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3"
            style={{ 
              ...glassStyle,
              padding: "14px 16px",
            }}
          >
            {[
              { title: "24/7 Responses", sub: "Instant answers", color: cssVars.cyan },
              { title: "Lead Capture + Booking", sub: "Names, phones, intent", color: cssVars.magenta },
              { title: "Done-For-You Setup", sub: "We build + tune it", color: cssVars.cyan },
              { title: "Multi‑Industry Templates", sub: "Copy/paste launch", color: cssVars.magenta },
            ].map((feature, i) => (
              <div 
                key={i} 
                className="flex gap-2 items-center"
                style={{ 
                  padding: "12px", 
                  borderRadius: "18px", 
                  background: "rgba(10,12,18,0.35)", 
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div 
                  style={{ 
                    width: "10px", 
                    height: "10px", 
                    borderRadius: "999px", 
                    background: feature.color,
                    boxShadow: `0 0 18px ${feature.color}55`,
                    flexShrink: 0,
                  }} 
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: "13px" }}>{feature.title}</div>
                  <div style={{ fontSize: "12px", color: "rgba(210,220,255,0.70)", marginTop: "2px" }}>{feature.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* NEON DIVIDER + BUILT FOR */}
        <section style={{ padding: "24px 18px 0" }}>
          {/* Neon Line */}
          <div 
            style={{ 
              height: "3px", 
              maxWidth: "1200px", 
              margin: "0 auto 20px",
              background: "linear-gradient(90deg, transparent 5%, rgba(42,246,255,0.8) 25%, rgba(255,79,216,0.8) 75%, transparent 95%)",
              boxShadow: "0 0 30px rgba(42,246,255,0.6), 0 0 60px rgba(255,79,216,0.5), 0 0 10px rgba(42,246,255,0.8)",
              borderRadius: "2px",
            }}
          />
          
          <div 
            className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3"
            style={{ ...glassStyle, padding: "14px 16px" }}
          >
            <div style={{ fontWeight: 800, color: "rgba(235,240,255,0.85)" }}>Built For:</div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              {["Barbershops", "Salons", "Sober Living", "Home Services"].map((chip) => (
                <span 
                  key={chip}
                  style={{ 
                    padding: "10px 14px", 
                    borderRadius: "18px", 
                    background: "rgba(10,12,18,0.35)", 
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(235,240,255,0.86)",
                    fontWeight: 700,
                    fontSize: "14px",
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" style={{ padding: "34px 18px 0" }}>
          <div className="max-w-[1200px] mx-auto" style={{ ...glassStyle, padding: "22px" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "34px", letterSpacing: "-0.02em" }}>How It Works</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { num: "01", title: "Add the widget to your website", text: "One copy/paste install. Works on any site." },
                { num: "02", title: "AI chats + qualifies leads 24/7", text: "Answers FAQs, captures info, and routes to booking." },
                { num: "03", title: "Manage everything in one dashboard", text: "See conversations, leads, and outcomes in real time." },
              ].map((step) => (
                <div 
                  key={step.num}
                  className="flex gap-3"
                  style={{ padding: "16px", borderRadius: "22px", background: "rgba(10,12,18,0.35)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <div style={{ fontWeight: 900, fontSize: "16px", padding: "10px 12px", borderRadius: "16px", background: "rgba(255,255,255,0.06)" }}>
                    {step.num}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: "6px" }}>{step.title}</div>
                    <div style={{ color: cssVars.muted, fontSize: "14px", lineHeight: 1.4 }}>{step.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "16px", padding: "14px 16px", borderRadius: "22px", background: "rgba(42,246,255,0.06)", border: "1px solid rgba(42,246,255,0.18)", color: "rgba(235,240,255,0.90)" }}>
              <strong>Done-for-you setup:</strong> We configure the assistant, polish the answers, and make it match your brand.
            </div>
          </div>
        </section>

        {/* DEMOS */}
        <section id="demos" style={{ padding: "34px 18px 0" }}>
          <div className="max-w-[1200px] mx-auto" style={{ ...glassStyle, padding: "22px" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "34px", letterSpacing: "-0.02em" }}>Demo Showcase</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Faith House — Sober Living", sub: "Admissions + FAQ + tour scheduling" },
                { title: "Fade Factory — Barbershop", sub: "Services + availability + booking links" },
                { title: "Luxe Locks — Salon", sub: "Pricing + consults + booking" },
                { title: "Polished Nails — Nail Studio", sub: "Services + scheduling + policies" },
              ].map((card, i) => (
                <a 
                  key={i}
                  href="#demo"
                  className="hover:-translate-y-0.5 transition-transform"
                  style={{ 
                    display: "block",
                    padding: "16px", 
                    borderRadius: "22px", 
                    background: "rgba(10,12,18,0.35)", 
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                  data-testid={`demo-card-${i}`}
                >
                  <div style={{ fontWeight: 800 }}>{card.title}</div>
                  <div style={{ color: cssVars.muted, marginTop: "6px", fontSize: "14px" }}>{card.sub}</div>
                  <div style={{ marginTop: "14px", fontWeight: 800, color: "rgba(235,240,255,0.90)" }}>Try the Demo →</div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" style={{ padding: "34px 18px 0" }}>
          <div className="max-w-[1200px] mx-auto" style={{ ...glassStyle, padding: "22px" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "34px", letterSpacing: "-0.02em" }}>Simple, Affordable Pricing</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Starter Plan */}
              <div style={{ padding: "18px", borderRadius: "24px", background: "rgba(10,12,18,0.35)", border: "1px solid rgba(255,255,255,0.10)" }}>
                <div className="flex items-baseline justify-between" style={{ marginBottom: "12px" }}>
                  <div style={{ fontWeight: 900, fontSize: "18px" }}>Starter Plan</div>
                  <div style={{ fontWeight: 900, fontSize: "32px" }}>$29<span style={{ fontWeight: 700, fontSize: "14px", color: cssVars.muted, marginLeft: "4px" }}>/mo</span></div>
                </div>
                <ul style={{ margin: "0 0 16px", paddingLeft: "18px", color: "rgba(220,230,255,0.82)" }}>
                  <li style={{ margin: "8px 0" }}>1 website widget</li>
                  <li style={{ margin: "8px 0" }}>Lead capture + routing</li>
                  <li style={{ margin: "8px 0" }}>Basic FAQ + hours + location</li>
                  <li style={{ margin: "8px 0" }}>Email support</li>
                </ul>
                <a href="#demo" style={{ ...btnGhost, ...btnLg, width: "100%" }} className="hover:-translate-y-px">Start Free</a>
              </div>
              
              {/* Pro Plan */}
              <div style={{ 
                padding: "18px", 
                borderRadius: "24px", 
                background: "rgba(10,12,18,0.35)", 
                border: "1px solid rgba(42,246,255,0.22)",
                boxShadow: "0 18px 70px rgba(42,246,255,0.10), 0 18px 70px rgba(255,79,216,0.08)",
              }}>
                <div className="flex items-baseline justify-between" style={{ marginBottom: "12px" }}>
                  <div style={{ fontWeight: 900, fontSize: "18px" }}>Pro Plan</div>
                  <div style={{ fontWeight: 900, fontSize: "32px" }}>$79<span style={{ fontWeight: 700, fontSize: "14px", color: cssVars.muted, marginLeft: "4px" }}>/mo</span></div>
                </div>
                <ul style={{ margin: "0 0 16px", paddingLeft: "18px", color: "rgba(220,230,255,0.82)" }}>
                  <li style={{ margin: "8px 0" }}>Everything in Starter</li>
                  <li style={{ margin: "8px 0" }}>Done-for-you setup</li>
                  <li style={{ margin: "8px 0" }}>Template install + tuning</li>
                  <li style={{ margin: "8px 0" }}>Priority support</li>
                </ul>
                <a href="#demo" style={{ ...btnPrimary, ...btnLg, width: "100%" }} className="hover:-translate-y-px">Get Started</a>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section style={{ padding: "44px 18px 10px", textAlign: "center" }}>
          <h2 style={{ margin: "0 0 18px", fontSize: "44px", letterSpacing: "-0.02em" }}>
            Unlock the <span style={{ textShadow: "0 0 22px rgba(42,246,255,0.18), 0 0 22px rgba(255,79,216,0.14)" }}>Future</span> of Sales.
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#demo" style={{ ...btnPrimary, ...btnLg }} className="hover:-translate-y-px" data-testid="cta-book-demo">Book a Demo</a>
            <a href="#demos" style={{ ...btnGhost, ...btnLg }} className="hover:-translate-y-px" data-testid="cta-live-demo">Try the Live Demo</a>
          </div>
        </section>

        {/* DEMO / CONTACT */}
        <section id="demo" style={{ padding: "34px 18px 0" }}>
          <div className="max-w-[1200px] mx-auto" style={{ ...glassStyle, padding: "22px" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "34px", letterSpacing: "-0.02em" }}>Book a Demo</h2>
            <p style={{ margin: "-6px 0 18px", color: cssVars.muted }}>Drop your info and we'll set up a quick live walkthrough.</p>

            <form onSubmit={handleContactSubmit} className="grid gap-3 max-w-[520px]">
              <label className="block">
                <span style={{ display: "block", fontWeight: 800, fontSize: "13px", color: "rgba(235,240,255,0.86)", marginBottom: "6px" }}>Name</span>
                <input 
                  type="text" 
                  placeholder="Your name" 
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                  data-testid="input-name"
                  style={{ 
                    width: "100%", 
                    padding: "12px", 
                    borderRadius: "16px", 
                    border: "1px solid rgba(255,255,255,0.10)", 
                    background: "rgba(10,12,18,0.38)", 
                    color: cssVars.text,
                    outline: "none",
                  }}
                  className="focus:border-[rgba(42,246,255,0.25)] focus:shadow-[0_0_0_4px_rgba(42,246,255,0.08)]"
                />
              </label>
              <label className="block">
                <span style={{ display: "block", fontWeight: 800, fontSize: "13px", color: "rgba(235,240,255,0.86)", marginBottom: "6px" }}>Email</span>
                <input 
                  type="email" 
                  placeholder="you@company.com" 
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                  data-testid="input-email"
                  style={{ 
                    width: "100%", 
                    padding: "12px", 
                    borderRadius: "16px", 
                    border: "1px solid rgba(255,255,255,0.10)", 
                    background: "rgba(10,12,18,0.38)", 
                    color: cssVars.text,
                    outline: "none",
                  }}
                  className="focus:border-[rgba(42,246,255,0.25)] focus:shadow-[0_0_0_4px_rgba(42,246,255,0.08)]"
                />
              </label>
              <label className="block">
                <span style={{ display: "block", fontWeight: 800, fontSize: "13px", color: "rgba(235,240,255,0.86)", marginBottom: "6px" }}>Phone</span>
                <input 
                  type="tel" 
                  placeholder="(xxx) xxx‑xxxx" 
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  data-testid="input-phone"
                  style={{ 
                    width: "100%", 
                    padding: "12px", 
                    borderRadius: "16px", 
                    border: "1px solid rgba(255,255,255,0.10)", 
                    background: "rgba(10,12,18,0.38)", 
                    color: cssVars.text,
                    outline: "none",
                  }}
                  className="focus:border-[rgba(42,246,255,0.25)] focus:shadow-[0_0_0_4px_rgba(42,246,255,0.08)]"
                />
              </label>
              <label className="block">
                <span style={{ display: "block", fontWeight: 800, fontSize: "13px", color: "rgba(235,240,255,0.86)", marginBottom: "6px" }}>Message</span>
                <textarea 
                  rows={4} 
                  placeholder="What niche are you in? Barbershop, salon, etc."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  data-testid="input-message"
                  style={{ 
                    width: "100%", 
                    padding: "12px", 
                    borderRadius: "16px", 
                    border: "1px solid rgba(255,255,255,0.10)", 
                    background: "rgba(10,12,18,0.38)", 
                    color: cssVars.text,
                    outline: "none",
                    resize: "vertical",
                  }}
                  className="focus:border-[rgba(42,246,255,0.25)] focus:shadow-[0_0_0_4px_rgba(42,246,255,0.08)]"
                />
              </label>

              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{ ...btnPrimary, ...btnLg, width: "100%", opacity: isSubmitting ? 0.7 : 1 }} 
                className="hover:-translate-y-px disabled:cursor-not-allowed"
                data-testid="button-submit-demo"
              >
                {isSubmitting ? "Sending..." : "Book My Demo"}
              </button>
              <div style={{ fontSize: "12px", color: "rgba(210,220,255,0.60)", textAlign: "center" }}>
                No payment processing. You connect your own booking link.
              </div>
            </form>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: "28px 18px 42px", color: "rgba(210,220,255,0.70)" }}>
          <div className="max-w-[1200px] mx-auto flex justify-between items-center">
            <div>© {new Date().getFullYear()} Treasure Coast AI</div>
            <div>Your Business, Upgraded.</div>
          </div>
        </footer>
      </main>
    </div>
  );
}
