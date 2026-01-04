import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import cosmicBg from "@assets/generated_images/purple_magenta_tropical_sunset.png";
import { 
  MessageSquare, 
  Calendar,
  ArrowRight,
  Check,
  Scissors,
  Heart,
  Home as HomeIcon,
  Clock,
  Link2,
  Sparkles,
  ChevronRight,
  Send,
  Menu,
  X,
  CheckCircle,
  Mail
} from "lucide-react";

// Diamond circuit-board logo matching the mockup exactly
const TreasureCoastLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00D4FF"/>
        <stop offset="50%" stopColor="#8B5CF6"/>
        <stop offset="100%" stopColor="#00D4FF"/>
      </linearGradient>
      <linearGradient id="innerFill" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1a1040"/>
        <stop offset="100%" stopColor="#2d1b69"/>
      </linearGradient>
    </defs>
    
    {/* Diamond shape rotated 45 degrees */}
    <g transform="translate(50,50) rotate(45) translate(-32,-32)" filter="url(#logoGlow)">
      <rect x="0" y="0" width="64" height="64" rx="6" 
        fill="url(#innerFill)" 
        stroke="url(#diamondGrad)" 
        strokeWidth="2.5"/>
      <rect x="6" y="6" width="52" height="52" rx="3" 
        fill="none" 
        stroke="#00D4FF" 
        strokeWidth="1"
        opacity="0.5"/>
    </g>
    
    {/* Circuit pattern */}
    <g transform="translate(50,50)" filter="url(#logoGlow)">
      {/* Main vertical line */}
      <line x1="0" y1="-20" x2="0" y2="20" stroke="#00D4FF" strokeWidth="2"/>
      
      {/* Top branches */}
      <line x1="0" y1="-16" x2="-12" y2="-16" stroke="#00D4FF" strokeWidth="1.5"/>
      <line x1="0" y1="-16" x2="12" y2="-16" stroke="#00D4FF" strokeWidth="1.5"/>
      <line x1="-12" y1="-16" x2="-12" y2="-6" stroke="#00D4FF" strokeWidth="1.5"/>
      <line x1="12" y1="-16" x2="12" y2="-6" stroke="#00D4FF" strokeWidth="1.5"/>
      
      {/* Middle branches */}
      <line x1="0" y1="0" x2="-16" y2="0" stroke="#00D4FF" strokeWidth="1.5"/>
      <line x1="0" y1="0" x2="16" y2="0" stroke="#00D4FF" strokeWidth="1.5"/>
      <line x1="-16" y1="0" x2="-16" y2="10" stroke="#00D4FF" strokeWidth="1.5"/>
      <line x1="16" y1="0" x2="16" y2="10" stroke="#00D4FF" strokeWidth="1.5"/>
      
      {/* Bottom branches */}
      <line x1="0" y1="12" x2="-8" y2="12" stroke="#00D4FF" strokeWidth="1.5"/>
      <line x1="0" y1="12" x2="8" y2="12" stroke="#00D4FF" strokeWidth="1.5"/>
      
      {/* Circuit nodes */}
      <circle cx="0" cy="-20" r="3.5" fill="#00D4FF"/>
      <circle cx="-12" cy="-16" r="2.5" fill="#00D4FF"/>
      <circle cx="12" cy="-16" r="2.5" fill="#00D4FF"/>
      <circle cx="-12" cy="-6" r="2" fill="#00D4FF"/>
      <circle cx="12" cy="-6" r="2" fill="#00D4FF"/>
      <circle cx="0" cy="0" r="3" fill="#00D4FF"/>
      <circle cx="-16" cy="0" r="2" fill="#00D4FF"/>
      <circle cx="16" cy="0" r="2" fill="#00D4FF"/>
      <circle cx="-16" cy="10" r="2" fill="#00D4FF"/>
      <circle cx="16" cy="10" r="2" fill="#00D4FF"/>
      <circle cx="0" cy="20" r="3.5" fill="#00D4FF"/>
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

  const chatMessages = [
    "How much is a haircut?",
    "Are you open today?",
    "Can I book for tomorrow at 5?",
  ];

  return (
    <div className="min-h-screen bg-[#0a0612] text-white overflow-x-hidden">
      {/* ══════════════════════════════════════════════════════════════
          NAVIGATION
      ══════════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0612]/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2" data-testid="logo">
            <TreasureCoastLogo className="w-10 h-10" />
            <span className="font-semibold text-lg tracking-tight text-white">
              TREASURE COAST AI
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm text-white/80">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#demos" className="hover:text-white transition-colors">Templates</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              className="hidden sm:flex bg-transparent border border-white/50 text-white hover:bg-white/10 font-medium px-5 rounded-full"
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
              className="md:hidden bg-[#0a0612]/95 backdrop-blur-xl border-t border-white/5"
            >
              <div className="px-4 py-4 space-y-3">
                <a href="#how-it-works" className="block py-2 text-white/70 hover:text-white" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
                <a href="#demos" className="block py-2 text-white/70 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Templates</a>
                <a href="#pricing" className="block py-2 text-white/70 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                <Button 
                  className="w-full bg-transparent border border-white/50 text-white hover:bg-white/10 rounded-full"
                  onClick={() => { setMobileMenuOpen(false); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}
                >
                  Book Demo
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ══════════════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${cosmicBg})` }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0612]/60 via-transparent to-[#0a0612]" />
        
        {/* Neon light trails at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="heroTrail1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity="0"/>
                <stop offset="30%" stopColor="#00D4FF" stopOpacity="0.8"/>
                <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#EC4899" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="heroTrail2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EC4899" stopOpacity="0"/>
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.5"/>
                <stop offset="100%" stopColor="#00D4FF" stopOpacity="0"/>
              </linearGradient>
              <filter id="heroGlow">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <path d="M0,70 Q300,30 600,60 T1200,50" stroke="url(#heroTrail1)" strokeWidth="3" fill="none" filter="url(#heroGlow)"/>
            <path d="M0,90 Q400,60 800,80 T1200,70" stroke="url(#heroTrail2)" strokeWidth="2" fill="none" filter="url(#heroGlow)"/>
          </svg>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="text-white">AI Chatbots </span>
                <span className="text-white/70">that run your front desk </span>
                <span className="text-white">24/7.</span>
              </h1>
              
              <p className="text-lg text-white/60 mb-8 max-w-md">
                Answer questions instantly, capture leads, and send customers to booking—without hiring staff.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-medium px-8 py-6 text-base rounded-full group"
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="hero-book-demo"
                >
                  Book a Live Demo
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg"
                  variant="ghost"
                  className="border border-white/40 text-white/90 hover:bg-white/5 font-medium px-8 py-6 text-base rounded-full"
                  onClick={() => document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="hero-view-demos"
                >
                  View Interactive Demo
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>

            {/* Right Column - Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex justify-center lg:justify-end"
            >
              {/* Phone Frame */}
              <div className="relative w-[280px] sm:w-[320px]">
                {/* Phone glow */}
                <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/40 via-cyan-500/20 to-pink-500/40 rounded-[3rem] blur-2xl" />
                
                {/* Phone body */}
                <div className="relative bg-gradient-to-br from-[#1a1040]/95 to-[#0d0620]/95 backdrop-blur-xl rounded-[2rem] border-2 border-purple-500/40 p-4 shadow-2xl">
                  {/* Phone notch */}
                  <div className="flex justify-center mb-2">
                    <div className="flex items-center gap-6">
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                    </div>
                  </div>
                  
                  {/* Chat messages */}
                  <div className="space-y-3 mb-4">
                    {chatMessages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.15 }}
                        className="flex items-center justify-between bg-white/90 text-gray-800 rounded-xl px-4 py-3 text-sm font-medium"
                      >
                        <span>{msg}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Status badges */}
                  <div className="space-y-2 mb-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.4 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span className="text-white/80">Lead Captured</span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.55 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Link2 className="w-4 h-4 text-purple-400" />
                      <span className="text-white/80">Booking Link Sent</span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.7 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-white/80">Follow-Up Automated</span>
                    </motion.div>
                  </div>
                  
                  {/* Input */}
                  <div className="flex items-center justify-between bg-white/90 text-gray-500 rounded-xl px-4 py-3 text-sm">
                    <span>Ask Anything...</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURE STRIP - Light background with 4 features
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-6 bg-white/95">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-gray-700">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">24/7 Responses</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">Lead Capture + Booking</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">Done-For-You Setup</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">Multi-industry Templates</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          BUILT FOR SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-white/95">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px flex-1 max-w-[100px] bg-gray-300" />
            <h2 className="text-xl font-medium text-gray-700">Built For:</h2>
            <div className="h-px flex-1 max-w-[100px] bg-gray-300" />
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: Scissors, label: "Barbershops" },
              { icon: Sparkles, label: "Salons" },
              { icon: Heart, label: "Sober Living" },
              { icon: HomeIcon, label: "Home Services" },
            ].map((industry, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700"
              >
                <industry.icon className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">{industry.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 bg-[#0a0612]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-white">How It </span>
              <span className="text-cyan-400">Works</span>
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Install the Widget", desc: "Add our embed code to your website. Takes less than 5 minutes." },
              { step: "02", title: "AI Answers & Qualifies", desc: "Your assistant handles FAQs, captures leads, and sends booking links." },
              { step: "03", title: "Track Conversions", desc: "Monitor leads, bookings, and conversations from your dashboard." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative bg-gradient-to-br from-[#1a1040]/60 to-[#0d0620]/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6 text-center"
              >
                <div className="text-4xl font-bold text-cyan-400/30 mb-4">{item.step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/60">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          DEMO SHOWCASE
      ══════════════════════════════════════════════════════════════ */}
      <section id="demos" className="relative py-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${cosmicBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0612] via-transparent to-[#0a0612]" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-white">Beautiful, </span>
              <span className="text-cyan-400">High-Converting Templates</span>
            </h2>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Faith House", type: "Sober Living", path: "/demo/faith-house" },
              { name: "Fade Factory", type: "Barbershop", path: "/demo/barber" },
              { name: "Luxe Locks", type: "Salon", path: "/demo/luxe-locks" },
              { name: "Polished Nails", type: "Nail Salon", path: "/demo/polished-nails" },
            ].map((demo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={demo.path}>
                  <div className="group relative bg-gradient-to-br from-[#1a1040]/80 to-[#0d0620]/80 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 hover:border-cyan-400/50 transition-all cursor-pointer">
                    <TreasureCoastLogo className="w-12 h-12 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-1">{demo.name}</h3>
                    <p className="text-sm text-white/50 mb-4">{demo.type}</p>
                    <span className="text-cyan-400 text-sm font-medium flex items-center">
                      Try the Demo <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PRICING SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-20 bg-[#0a0612]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold">
              <span className="text-white">Simple, </span>
              <span className="text-cyan-400">Affordable Pricing</span>
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Starter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#1a1040]/60 to-[#0d0620]/60 rounded-2xl border border-white/10 p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">Starter Plan</h3>
                  <p className="text-sm text-white/50">Starts at</p>
                </div>
                <div className="text-3xl font-bold text-white">$29<span className="text-lg font-normal text-white/50">/mo</span></div>
              </div>
              
              <ul className="space-y-3 mb-8 text-sm text-white/70">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> 1 AI Assistant</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> 500 conversations/mo</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Lead capture & booking links</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Email support</li>
              </ul>
              
              <Button className="w-full bg-transparent border border-white/30 text-white hover:bg-white/10 rounded-full">
                Start Free <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
            
            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative bg-gradient-to-br from-[#1a1040]/60 to-[#0d0620]/60 rounded-2xl border border-cyan-500/40 p-8"
            >
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-sm -z-10" />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">Pro Plan</h3>
                  <p className="text-sm text-white/50">Starts at</p>
                </div>
                <div className="text-3xl font-bold text-cyan-400">$79<span className="text-lg font-normal text-white/50">/mo</span></div>
              </div>
              
              <ul className="space-y-3 mb-8 text-sm text-white/70">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Unlimited AI Assistants</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Unlimited conversations</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Advanced analytics</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Priority support</li>
              </ul>
              
              <Button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold hover:opacity-90 rounded-full">
                Get Started <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CTA SECTION - Unlock the Future
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${cosmicBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0612] via-[#0a0612]/40 to-[#0a0612]" />
        
        {/* Neon trails */}
        <div className="absolute top-1/2 left-0 right-0 h-32 pointer-events-none -translate-y-1/2">
          <svg className="w-full h-full" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="ctaTrail1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity="0"/>
                <stop offset="50%" stopColor="#00D4FF" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="ctaTrail2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0"/>
                <stop offset="50%" stopColor="#EC4899" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#00D4FF" stopOpacity="0"/>
              </linearGradient>
              <filter id="ctaGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <path d="M0,50 Q300,30 600,50 T1200,40" stroke="url(#ctaTrail1)" strokeWidth="2" fill="none" filter="url(#ctaGlow)" opacity="0.6"/>
            <path d="M0,60 Q400,80 800,50 T1200,70" stroke="url(#ctaTrail2)" strokeWidth="2" fill="none" filter="url(#ctaGlow)" opacity="0.6"/>
          </svg>
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8">
              <span className="text-white">Unlock the </span>
              <span className="font-bold text-white">Future of Sales.</span>
            </h2>
            
            <div className="flex flex-col items-center gap-4">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold px-8 py-6 text-lg hover:opacity-90 rounded-full"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Book a Demo <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="link"
                className="text-white/80 hover:text-white text-base"
                onClick={() => document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Try the Live Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CONTACT FORM
      ══════════════════════════════════════════════════════════════ */}
      <section id="contact" className="py-20 bg-[#0a0612]">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Ready to Get Started?</h2>
            <p className="text-white/60">Book a demo and we'll show you how it works.</p>
          </motion.div>
          
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleContactSubmit}
            className="bg-gradient-to-br from-[#1a1040]/60 to-[#0d0620]/60 rounded-2xl border border-white/10 p-8 space-y-4"
          >
            <Input
              placeholder="Your Name"
              value={contactForm.name}
              onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-400"
              data-testid="input-contact-name"
              required
            />
            <Input
              type="email"
              placeholder="Email Address"
              value={contactForm.email}
              onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-400"
              data-testid="input-contact-email"
              required
            />
            <Input
              type="tel"
              placeholder="Phone Number"
              value={contactForm.phone}
              onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-400"
              data-testid="input-contact-phone"
            />
            <Textarea
              placeholder="Tell us about your business..."
              value={contactForm.message}
              onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-400 min-h-[100px]"
              data-testid="input-contact-message"
            />
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold py-6 hover:opacity-90 rounded-full"
              data-testid="button-contact-submit"
            >
              {isSubmitting ? "Sending..." : "Send Message"} <Send className="w-4 h-4 ml-2" />
            </Button>
          </motion.form>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer className="py-12 border-t border-white/10 bg-[#0a0612]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <TreasureCoastLogo className="w-8 h-8" />
              <span className="font-semibold text-white">TREASURE COAST AI</span>
            </div>
            
            <div className="flex gap-8 text-sm text-white/50">
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
              <Link href="/login" className="hover:text-white">Login</Link>
            </div>
            
            <p className="text-sm text-white/40">© 2025 Treasure Coast AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
