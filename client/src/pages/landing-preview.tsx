import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import tropicalBg from "@assets/stock_images/tropical_coastal_sun_45ef332b.jpg";
import { 
  MessageSquare, 
  Calendar,
  ArrowRight,
  Check,
  Scissors,
  Heart,
  Sparkles,
  Home as HomeIcon,
  Clock,
  Link2,
  TrendingUp,
  Wrench,
  ChevronRight,
  Send,
  Menu,
  X
} from "lucide-react";

const NeonLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 60 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00E5CC" />
        <stop offset="50%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#00E5CC" />
      </linearGradient>
      <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#neonGlow)">
      <rect x="10" y="10" width="40" height="40" rx="4" transform="rotate(45 30 30)" 
        stroke="url(#neonGradient)" strokeWidth="2" fill="none"/>
      <rect x="15" y="15" width="30" height="30" rx="3" transform="rotate(45 30 30)" 
        stroke="url(#neonGradient)" strokeWidth="1.5" fill="rgba(0,229,204,0.1)"/>
      <circle cx="30" cy="20" r="3" fill="#00E5CC"/>
      <circle cx="22" cy="30" r="2.5" fill="#8B5CF6"/>
      <circle cx="38" cy="30" r="2.5" fill="#8B5CF6"/>
      <circle cx="30" cy="38" r="2" fill="#00E5CC"/>
      <line x1="30" y1="23" x2="30" y2="35" stroke="#00E5CC" strokeWidth="1.5"/>
      <line x1="24" y1="30" x2="36" y2="30" stroke="#8B5CF6" strokeWidth="1.5"/>
      <line x1="30" y1="20" x2="22" y2="30" stroke="url(#neonGradient)" strokeWidth="1"/>
      <line x1="30" y1="20" x2="38" y2="30" stroke="url(#neonGradient)" strokeWidth="1"/>
    </g>
  </svg>
);

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
        toast({
          title: "Request received!",
          description: "We'll be in touch within 24 hours.",
        });
        setContactForm({ name: '', email: '', phone: '', message: '' });
      } else {
        const data = await response.json().catch(() => ({}));
        toast({
          title: "Something went wrong",
          description: data.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    { icon: Clock, label: "24/7 Responses", desc: "Never miss a lead" },
    { icon: Link2, label: "Lead Capture + Booking", desc: "Automatic follow-up" },
    { icon: Wrench, label: "Done-For-You Setup", desc: "We handle everything" },
    { icon: Sparkles, label: "Multi-Industry Templates", desc: "Ready to deploy" }
  ];

  const industries = [
    { icon: Scissors, label: "Barbershops" },
    { icon: Sparkles, label: "Salons" },
    { icon: Heart, label: "Sober Living" },
    { icon: HomeIcon, label: "Home Services" }
  ];

  const demos = [
    {
      name: "Faith House",
      type: "Sober Living",
      features: ["Pricing, admission, payment FAQs", "Availability inquiries", "Book tour link + lead capture"],
      href: "/demo/faith-house",
      gradient: "from-cyan-500/20 to-teal-500/20"
    },
    {
      name: "Fade Factory",
      type: "Barbershop",
      features: ["Pricing, services, hours", "Availability questions", "Booking link + lead capture"],
      href: "/demo/barbershop",
      gradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      name: "Luxe Locks",
      type: "Salon",
      features: ["Pricing, services, hours", "Availability questions", "Booking link + lead capture"],
      href: "/demo/salon",
      gradient: "from-rose-500/20 to-pink-500/20"
    },
    {
      name: "Polished Nails",
      type: "Nails Studio",
      features: ["Pricing, services, hours", "Availability questions", "Booking link + lead capture"],
      href: "/demo/nails",
      gradient: "from-fuchsia-500/20 to-purple-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* ══════════════════════════════════════════════════════════════
          NAVIGATION - Clean, minimal
      ══════════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3" data-testid="logo">
            <NeonLogo className="w-10 h-10" />
            <span className="font-semibold text-lg tracking-tight">
              <span className="text-white">TREASURE COAST</span>
              <span className="text-cyan-400 ml-1">AI</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#how-it-works" className="hover:text-white transition-colors" data-testid="nav-how-it-works">How It Works</a>
            <a href="#demos" className="hover:text-white transition-colors" data-testid="nav-demos">Templates</a>
            <a href="#pricing" className="hover:text-white transition-colors" data-testid="nav-pricing">Pricing</a>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" className="text-white/70 hover:text-white" data-testid="nav-login">
                Login
              </Button>
            </Link>
            <Button 
              className="hidden sm:flex bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-medium px-5 hover:opacity-90 transition-opacity"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="nav-book-demo"
            >
              Book Demo
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="nav-mobile-toggle"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5"
            >
              <div className="px-4 py-4 space-y-3">
                <a 
                  href="#how-it-works" 
                  className="block py-2 text-white/70 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </a>
                <a 
                  href="#demos" 
                  className="block py-2 text-white/70 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Templates
                </a>
                <a 
                  href="#pricing" 
                  className="block py-2 text-white/70 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                  <Link href="/login">
                    <Button variant="ghost" className="w-full text-white/70 hover:text-white justify-start">
                      Login
                    </Button>
                  </Link>
                  <Button 
                    className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-medium hover:opacity-90"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Book Demo
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ══════════════════════════════════════════════════════════════
          HERO SECTION - Cinematic background, clean content
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Cinematic Background - 20% of visual weight */}
        <div className="absolute inset-0">
          <img 
            src={tropicalBg} 
            alt="" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f]/70 to-[#0a0a0f]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-transparent to-[#0a0a0f]/80" />
        </div>

        {/* Subtle neon glow accents */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Content - 80% clean SaaS */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Headlines */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" data-testid="hero-headline">
                <span className="text-white">AI Chatbots</span>
                <span className="text-white/80"> that run your front desk </span>
                <span className="bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">24/7.</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-white/60 mb-8 max-w-lg leading-relaxed">
                Answer questions instantly, capture leads, and send customers to booking—without hiring staff.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold px-8 py-6 text-lg hover:opacity-90 transition-opacity group"
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="hero-book-demo"
                >
                  Book a Live Demo
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Link href="/demos">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/5 px-8 py-6 text-lg"
                    data-testid="hero-view-demos"
                  >
                    View Interactive Demo
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right: Chat Widget Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Glow behind widget */}
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur-2xl opacity-50" />
                
                {/* Chat Widget */}
                <div className="relative bg-[#12121a]/90 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
                  {/* Widget Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <NeonLogo className="w-8 h-8" />
                    <div>
                      <div className="font-semibold text-white">Treasure Coast AI</div>
                      <div className="text-xs text-white/50">Your Business, Upgraded.</div>
                    </div>
                    <div className="ml-auto flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                    </div>
                  </div>

                  {/* Sample Questions */}
                  <div className="space-y-3 mb-6">
                    {[
                      "How much is a haircut?",
                      "Are you open today?",
                      "Can I book for tomorrow at 5?"
                    ].map((q, i) => (
                      <div 
                        key={i}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        {q}
                        <ChevronRight className="w-4 h-4 text-white/40" />
                      </div>
                    ))}
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-3 py-1.5 text-xs">
                      <Check className="w-3 h-3 text-cyan-400" />
                      <span className="text-cyan-300">Lead Captured</span>
                    </div>
                    <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-3 py-1.5 text-xs">
                      <Calendar className="w-3 h-3 text-purple-400" />
                      <span className="text-purple-300">Booking Link Sent</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1.5 text-xs">
                      <Check className="w-3 h-3 text-green-400" />
                      <span className="text-green-300">Follow-Up Automated</span>
                    </div>
                  </div>

                  {/* Input */}
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <span className="text-white/40 text-sm flex-1">Ask Anything...</span>
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURE STRIP - Clean pills
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-12 border-y border-white/5 bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center"
                data-testid={`feature-${i}`}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-3">
                  <f.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="font-medium text-white mb-1">{f.label}</div>
                <div className="text-sm text-white/50">{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          BUILT FOR SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-sm text-white/40 uppercase tracking-wider mb-6">Built For</div>
          <div className="flex flex-wrap justify-center gap-4">
            {industries.map((ind, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2.5 hover:border-cyan-500/30 transition-colors"
                data-testid={`industry-${i}`}
              >
                <ind.icon className="w-4 h-4 text-cyan-400" />
                <span className="text-white/80 text-sm font-medium">{ind.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 bg-[#0a0a0f] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-testid="how-it-works-title">
              How It Works
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              Get your 24/7 AI front desk live in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Install Chat Widget",
                desc: "Drop one script tag on your website. We provide the code and can install it for you.",
                icon: MessageSquare
              },
              {
                step: "02",
                title: "Capture Leads & Bookings",
                desc: "AI answers questions, captures contact info, and sends booking links automatically.",
                icon: TrendingUp
              },
              {
                step: "03",
                title: "Grow Your Business",
                desc: "Review leads and conversations in your dashboard. We optimize the AI for you.",
                icon: Sparkles
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:border-cyan-500/20 transition-colors"
                data-testid={`step-${i}`}
              >
                <div className="text-cyan-400 text-sm font-mono mb-4">Step {item.step}</div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center mb-5">
                  <item.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-white/50 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          DEMO SHOWCASE
      ══════════════════════════════════════════════════════════════ */}
      <section id="demos" className="py-24 bg-[#0a0a0f] relative">
        {/* Subtle cinematic accent */}
        <div className="absolute bottom-0 left-0 right-0 h-[400px] overflow-hidden pointer-events-none">
          <img 
            src={tropicalBg} 
            alt="" 
            className="w-full h-full object-cover object-bottom opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-testid="demos-title">
              Demo Showcase
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              See how our AI handles FAQs and appointments for different industries
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {demos.map((demo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group"
                data-testid={`demo-card-${i}`}
              >
                <div className={`bg-gradient-to-br ${demo.gradient} rounded-2xl p-[1px]`}>
                  <div className="bg-[#0f0f18] rounded-2xl p-6 h-full">
                    <div className="mb-4">
                      <div className="text-xl font-semibold text-white mb-1">{demo.name}</div>
                      <div className="text-sm text-white/50">{demo.type}</div>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      {demo.features.map((f, fi) => (
                        <div key={fi} className="flex items-start gap-2 text-sm text-white/60">
                          <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Link href={demo.href}>
                      <Button 
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                        data-testid={`demo-button-${i}`}
                      >
                        Try the Demo
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 bg-[#0a0a0f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-testid="pricing-title">
              Simple, Affordable Pricing
            </h2>
            <p className="text-lg text-white/50">
              No setup fees. No contracts. Cancel anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Starter Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white/[0.02] border border-white/10 rounded-2xl p-8"
              data-testid="pricing-starter"
            >
              <div className="mb-6">
                <div className="text-lg font-medium text-white mb-2">Starter Plan</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$29</span>
                  <span className="text-white/50">/mo</span>
                </div>
              </div>
              
              <div className="space-y-3 mb-8">
                {[
                  "24/7 AI Chatbot",
                  "Instant Booking Links",
                  "Professional Templates",
                  "Email Notifications"
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-white/70">
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-white/20 text-white hover:bg-white/5"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="pricing-starter-cta"
              >
                Start Free
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl p-[1px]"
              data-testid="pricing-pro"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-cyan-500 to-cyan-400 text-black text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <div className="bg-[#0f0f18] rounded-2xl p-8 h-full">
                <div className="mb-6">
                  <div className="text-lg font-medium text-white mb-2">Pro Plan</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">$79</span>
                    <span className="text-white/50">/mo</span>
                  </div>
                </div>
                
                <div className="space-y-3 mb-8">
                  {[
                    "Everything in Starter",
                    "Priority Support",
                    "Advanced Analytics",
                    "Custom Branding",
                    "Multiple Locations"
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-3 text-white/70">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold hover:opacity-90"
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="pricing-pro-cta"
                >
                  Get Started
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          UNLOCK THE FUTURE CTA
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        {/* Cinematic background accent */}
        <div className="absolute inset-0">
          <img 
            src={tropicalBg} 
            alt="" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-[#0a0a0f]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6" data-testid="cta-title">
              Unlock the <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Future of Sales.</span>
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
              Your business should never miss a lead. Let AI handle your front desk 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold px-8 py-6 text-lg hover:opacity-90"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="cta-book-demo"
              >
                Book a Demo
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <Link href="/demos">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/5 px-8 py-6 text-lg"
                  data-testid="cta-try-demo"
                >
                  Try the Live Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CONTACT FORM
      ══════════════════════════════════════════════════════════════ */}
      <section id="contact" className="py-24 bg-[#0a0a0f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <NeonLogo className="w-12 h-12" />
                <div>
                  <div className="font-semibold text-xl text-white">TREASURE COAST AI</div>
                  <div className="text-white/50 text-sm">Your Business, Upgraded.</div>
                </div>
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4" data-testid="contact-title">
                Book a Demo
              </h3>
              <p className="text-white/60 mb-6 leading-relaxed">
                See how Treasure Coast AI can transform your business with a personalized demo. We'll show you exactly how our AI chatbots can capture leads and book appointments 24/7.
              </p>
              
              <div className="space-y-4 text-white/50 text-sm">
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Free 15-minute demo call</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Done-for-you setup included</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>No technical skills required</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Name</label>
                  <Input
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    placeholder="Your name"
                    required
                    data-testid="input-name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Email</label>
                  <Input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    placeholder="you@example.com"
                    required
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Phone</label>
                  <Input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    placeholder="(555) 123-4567"
                    data-testid="input-phone"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Message (optional)</label>
                  <Textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[100px]"
                    placeholder="Tell us about your business..."
                    data-testid="input-message"
                  />
                </div>
                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold py-6 hover:opacity-90"
                  disabled={isSubmitting}
                  data-testid="button-submit"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer className="py-8 border-t border-white/5 bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <NeonLogo className="w-6 h-6" />
              <span className="text-white/50 text-sm">© 2025 Treasure Coast AI. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <a href="#" className="hover:text-white/70 transition-colors">Privacy</a>
              <a href="#" className="hover:text-white/70 transition-colors">Terms</a>
              <Link href="/login" className="hover:text-white/70 transition-colors">Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
