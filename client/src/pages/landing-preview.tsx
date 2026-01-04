import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import tcaBg from "@assets/tca_bg.jpg";
import tcaLogo from "@assets/tca_logo_nav.png";
import tcaWidgetMock from "@assets/tca_widget_mock.png";
import { 
  Menu,
  X,
  Clock,
  Calendar,
  Sparkles,
  LayoutTemplate,
  Scissors,
  Heart,
  Home as HomeIcon,
  ChevronRight,
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
    <div className="min-h-screen text-white overflow-x-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#0B0E13" }}>
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
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(1200px 800px at 20% 10%, rgba(42, 246, 255, 0.15), transparent 55%),
              radial-gradient(900px 700px at 85% 18%, rgba(255, 79, 216, 0.12), transparent 60%),
              linear-gradient(to bottom,
                rgba(11,14,19,0.30) 0%,
                rgba(11,14,19,0.50) 40%,
                rgba(11,14,19,0.80) 70%,
                rgba(11,14,19,1.00) 100%
              )
            `
          }}
        />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 px-4 pt-4">
        <nav 
          className="max-w-[1200px] mx-auto px-5 py-3 rounded-full flex items-center justify-between gap-3"
          style={{ 
            background: "rgba(10,12,18,0.50)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)"
          }}
        >
          <a href="#top" className="flex items-center gap-2" data-testid="logo">
            <img src={tcaLogo} alt="Treasure Coast AI" className="h-8 w-auto" />
            <span className="font-semibold text-sm hidden sm:inline">TREASURE COAST AI</span>
          </a>
          
          <div className="hidden md:flex gap-6 text-sm text-white/80">
            <a href="#how" className="hover:text-white transition-colors">How It Works</a>
            <a href="#demos" className="hover:text-white transition-colors">Templates</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          
          <div className="flex gap-2 items-center">
            <button 
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:bg-white/10"
              style={{ border: "1px solid rgba(255,255,255,0.25)" }}
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="nav-book-demo"
            >
              Book Demo
            </button>
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
        <section className="px-4 pt-12 pb-6">
          <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-8 items-center">
            {/* Left - Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.05] tracking-tight mb-4">
                <span className="font-bold">AI Chatbots </span>
                <span className="text-white/70">that run your front desk </span>
                <span className="font-bold">24/7.</span>
              </h1>
              
              <p className="text-base sm:text-lg text-white/60 leading-relaxed max-w-md mb-6">
                Answer questions instantly, capture leads, and send customers to booking—without hiring staff.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-base transition-all hover:-translate-y-0.5"
                  style={{ 
                    background: "transparent",
                    border: "2px solid rgba(255,255,255,0.9)"
                  }}
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="hero-book-demo"
                >
                  Book a Live Demo
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-base transition-all hover:-translate-y-0.5"
                  style={{ 
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.35)"
                  }}
                  onClick={() => document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="hero-view-demo"
                >
                  View Interactive Demo
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {/* Right - Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center"
            >
              <img 
                src={tcaWidgetMock} 
                alt="Treasure Coast AI chat widget preview" 
                className="w-full max-w-[340px] h-auto"
                style={{ filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.5))" }}
              />
            </motion.div>
          </div>
        </section>

        {/* FEATURE STRIP - Light Background */}
        <section className="px-4 py-4">
          <div 
            className="max-w-[900px] mx-auto py-4 px-6 rounded-2xl"
            style={{ 
              background: "rgba(250,250,255,0.92)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
            }}
          >
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium">24/7 Responses</span>
              </div>
              <div className="hidden sm:block w-px h-5 bg-gray-300" />
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium">Lead Capture + Booking</span>
              </div>
              <div className="hidden sm:block w-px h-5 bg-gray-300" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium">Done-For-You Setup</span>
              </div>
              <div className="hidden sm:block w-px h-5 bg-gray-300" />
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium">Multi-industry Templates</span>
              </div>
            </div>
          </div>
        </section>

        {/* BUILT FOR - Light Background */}
        <section className="px-4 py-4">
          <div 
            className="max-w-[700px] mx-auto py-4 px-6 rounded-2xl"
            style={{ 
              background: "rgba(250,250,255,0.92)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
            }}
          >
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-gray-300 hidden sm:block" />
                <span className="text-gray-600 font-medium">Built For:</span>
                <div className="h-px w-8 bg-gray-300 hidden sm:block" />
              </div>
              
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { icon: Scissors, label: "Barbershops" },
                  { icon: Sparkles, label: "Salons" },
                  { icon: Heart, label: "Sober Living" },
                  { icon: HomeIcon, label: "Home Services" },
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg"
                    style={{ background: "rgba(240,240,245,1)", border: "1px solid rgba(200,200,210,0.5)" }}
                  >
                    <item.icon className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA - Unlock the Future */}
        <section className="px-4 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Unlock the <span className="font-bold">Future of Sales.</span>
            </h2>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-base transition-all hover:-translate-y-0.5"
                style={{ 
                  background: "linear-gradient(135deg, rgba(42,246,255,0.3), rgba(255,79,216,0.25))",
                  border: "1px solid rgba(255,255,255,0.2)",
                  boxShadow: "0 8px 32px rgba(42,246,255,0.15)"
                }}
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Book a Demo
                <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-base text-white/80 hover:text-white transition-all"
                onClick={() => document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Try the Live Demo
              </button>
            </div>
          </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="px-4 py-8">
          <div 
            className="max-w-[1100px] mx-auto p-6 rounded-3xl"
            style={{ 
              background: "rgba(18, 22, 33, 0.6)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)"
            }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">How It Works</h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { num: "01", title: "Add the widget to your website", text: "One copy/paste install. Works on any site." },
                { num: "02", title: "AI chats + qualifies leads 24/7", text: "Answers FAQs, captures info, and routes to booking." },
                { num: "03", title: "Manage everything in one dashboard", text: "See conversations, leads, and outcomes in real time." },
              ].map((step, i) => (
                <div 
                  key={i}
                  className="flex gap-3 p-4 rounded-2xl"
                  style={{ background: "rgba(10,12,18,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="px-3 py-2 rounded-xl font-black text-sm bg-white/5">{step.num}</div>
                  <div>
                    <div className="font-bold mb-1">{step.title}</div>
                    <div className="text-sm text-white/60">{step.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DEMO SHOWCASE */}
        <section id="demos" className="px-4 py-6">
          <div 
            className="max-w-[1100px] mx-auto p-6 rounded-3xl"
            style={{ 
              background: "rgba(18, 22, 33, 0.6)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)"
            }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Demo Showcase</h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Faith House", sub: "Sober Living", path: "/demo/faith-house" },
                { name: "Fade Factory", sub: "Barbershop", path: "/demo/barber" },
                { name: "Luxe Locks", sub: "Salon", path: "/demo/luxe-locks" },
                { name: "Polished Nails", sub: "Nail Studio", path: "/demo/polished-nails" },
              ].map((demo, i) => (
                <Link key={i} href={demo.path}>
                  <div 
                    className="p-4 rounded-2xl transition-all cursor-pointer hover:-translate-y-1"
                    style={{ background: "rgba(10,12,18,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="font-bold">{demo.name}</div>
                    <div className="text-sm text-white/50 mb-3">{demo.sub}</div>
                    <span className="text-cyan-400 text-sm font-medium">Try the Demo →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="px-4 py-6">
          <div 
            className="max-w-[800px] mx-auto p-6 rounded-3xl"
            style={{ 
              background: "rgba(18, 22, 33, 0.6)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)"
            }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Simple, Affordable Pricing</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Starter */}
              <div className="p-5 rounded-2xl" style={{ background: "rgba(10,12,18,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-baseline justify-between mb-4">
                  <span className="font-bold text-lg">Starter Plan</span>
                  <span className="font-bold text-2xl">$29<span className="text-sm font-normal text-white/50">/mo</span></span>
                </div>
                <ul className="text-white/70 text-sm space-y-2 mb-5">
                  <li>• 1 website widget</li>
                  <li>• Lead capture + routing</li>
                  <li>• Basic FAQ + hours + location</li>
                  <li>• Email support</li>
                </ul>
                <button 
                  className="w-full py-3 rounded-full font-semibold transition-all hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Start Free
                </button>
              </div>
              
              {/* Pro */}
              <div 
                className="p-5 rounded-2xl"
                style={{ 
                  background: "rgba(10,12,18,0.4)", 
                  border: "1px solid rgba(42,246,255,0.25)",
                  boxShadow: "0 0 30px rgba(42,246,255,0.08)"
                }}
              >
                <div className="flex items-baseline justify-between mb-4">
                  <span className="font-bold text-lg">Pro Plan</span>
                  <span className="font-bold text-2xl text-cyan-400">$79<span className="text-sm font-normal text-white/50">/mo</span></span>
                </div>
                <ul className="text-white/70 text-sm space-y-2 mb-5">
                  <li>• Everything in Starter</li>
                  <li>• Done-for-you setup</li>
                  <li>• Template install + tuning</li>
                  <li>• Priority support</li>
                </ul>
                <button 
                  className="w-full py-3 rounded-full font-semibold transition-all hover:-translate-y-0.5"
                  style={{ 
                    background: "linear-gradient(135deg, rgba(42,246,255,0.3), rgba(255,79,216,0.25))",
                    border: "1px solid rgba(255,255,255,0.15)"
                  }}
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT FORM */}
        <section id="demo" className="px-4 py-8">
          <div 
            className="max-w-[600px] mx-auto p-6 rounded-3xl"
            style={{ 
              background: "rgba(18, 22, 33, 0.6)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)"
            }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Book a Demo</h2>
            <p className="text-white/60 mb-6">Drop your info and we'll set up a quick live walkthrough.</p>
            
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">Name</label>
                <input 
                  type="text"
                  placeholder="Your name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none transition-all focus:ring-2 focus:ring-cyan-500/30"
                  style={{ background: "rgba(10,12,18,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
                  required
                  data-testid="input-contact-name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">Email</label>
                <input 
                  type="email"
                  placeholder="you@company.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none transition-all focus:ring-2 focus:ring-cyan-500/30"
                  style={{ background: "rgba(10,12,18,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
                  required
                  data-testid="input-contact-email"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">Phone</label>
                <input 
                  type="tel"
                  placeholder="(xxx) xxx-xxxx"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none transition-all focus:ring-2 focus:ring-cyan-500/30"
                  style={{ background: "rgba(10,12,18,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
                  data-testid="input-contact-phone"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">Message</label>
                <textarea 
                  rows={3}
                  placeholder="What niche are you in? Barbershop, salon, etc."
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none transition-all resize-none focus:ring-2 focus:ring-cyan-500/30"
                  style={{ background: "rgba(10,12,18,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
                  data-testid="input-contact-message"
                />
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50"
                style={{ 
                  background: "linear-gradient(135deg, rgba(42,246,255,0.3), rgba(255,79,216,0.25))",
                  border: "1px solid rgba(255,255,255,0.15)"
                }}
                data-testid="button-contact-submit"
              >
                {isSubmitting ? "Sending..." : "Book My Demo"}
              </button>
            </form>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="px-4 py-8 text-white/50 text-sm">
          <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-white/10 pt-6">
            <div className="flex items-center gap-3">
              <img src={tcaLogo} alt="Treasure Coast AI" className="h-6 w-auto opacity-70" />
              <span>© 2025 Treasure Coast AI</span>
            </div>
            <div className="flex gap-4">
              <Link href="/login" className="hover:text-white transition-colors">Login</Link>
              <span className="text-white/30">|</span>
              <span>Your Business, Upgraded.</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
