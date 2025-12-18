import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TreasureCoastLogo } from "@/components/treasure-coast-logo";
import { useToast } from "@/hooks/use-toast";
import { PlatformHelpBot } from "@/components/platform-help-bot";
import { 
  Sparkles, 
  Globe, 
  MessageSquare, 
  BarChart3, 
  Zap, 
  Shield, 
  ArrowRight,
  Check,
  X,
  Users,
  TrendingUp,
  Mail,
  Phone,
  Star,
  ChevronDown,
  ChevronUp,
  Send,
  Calendar,
  Code,
  Building2,
  Home as HomeIcon,
  Heart,
  Scissors,
  Car,
  Dumbbell,
  Utensils,
  Palette,
  Syringe,
  Wrench,
  Clock,
  LayoutDashboard,
  Bot,
  Settings,
  UserCheck,
  Target,
  Headphones,
  FileText,
  Lock
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '', honeypot: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/bot-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Request received!",
          description: "We'll be in touch within 24 hours to discuss your AI assistant.",
        });
        setContactForm({ name: '', email: '', phone: '', message: '', honeypot: '' });
      } else {
        toast({
          title: "Something went wrong",
          description: data.error || "Please try again or contact us directly.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Contact form error:", error);
      toast({
        title: "Connection error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const demos = [
    {
      name: "Faith House",
      type: "Sober Living Home",
      description: "AI assistant for recovery housing: answers intake questions, explains program rules, and books facility tours or intake calls.",
      icon: Heart,
      color: "from-cyan-500 to-teal-500",
      href: "/demo/faith-house"
    },
    {
      name: "Fade Factory",
      type: "Barbershop",
      description: "AI scheduler for barbershops: books appointments, explains service options, and manages walk-in wait time questions.",
      icon: Scissors,
      color: "from-purple-500 to-pink-500",
      href: "/demo/barbershop"
    },
    {
      name: "Luxe Locks Salon",
      type: "Hair Salon",
      description: "AI receptionist for salons: handles appointment bookings, explains services and pricing, and answers styling questions.",
      icon: Scissors,
      color: "from-rose-500 to-pink-500",
      href: "/demo/salon"
    },
    {
      name: "Polished Nails Studio",
      type: "Nail Salon",
      description: "AI assistant for nail salons: books manicures and pedicures, explains nail art options, and manages appointment scheduling.",
      icon: Sparkles,
      color: "from-fuchsia-500 to-purple-500",
      href: "/demo/nails"
    }
  ];

  const faqs = [
    {
      question: "Do I need to be technical to use this?",
      answer: "Not at all. We (the agency) configure everything for you. Your clients just log in to see their leads and bookings — no prompt engineering or tech skills required."
    },
    {
      question: "Who writes all the questions and answers?",
      answer: "We do. Each assistant comes pre-loaded with a deep knowledge base tailored to the business type. We then customize it with your client's specific services, hours, pricing, and FAQs."
    },
    {
      question: "Will this replace my staff?",
      answer: "It's designed to complement your team, not replace them. The AI handles repetitive questions and after-hours inquiries, so your team can focus on higher-value work during business hours."
    },
    {
      question: "Can I see and review every conversation?",
      answer: "Yes. Every message is stored and visible in both your agency dashboard and each client's simplified dashboard. You can review conversations, track leads, and monitor booking activity."
    },
    {
      question: "What happens if the AI doesn't know the answer?",
      answer: "The AI gracefully acknowledges when it's unsure and offers to capture the visitor's contact info so a team member can follow up. No hallucinating fake answers."
    },
    {
      question: "How hard is it to add to my website?",
      answer: "Usually just one script tag. We provide the embed code, and if needed, we can handle the installation ourselves. Most sites are live within minutes."
    },
    {
      question: "What about my data and privacy?",
      answer: "All conversations are securely stored and only accessible by authorized users. We don't sell or share your data. Your business information stays private and protected."
    },
    {
      question: "How fast can I get started?",
      answer: "Most businesses are up and running within 48-72 hours. We handle all the configuration, training, and deployment — you just share your business info."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0E13] overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════════════
          1. HERO SECTION - Sharper Positioning & Stronger CTAs
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Ambient background */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 229, 204, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 20%, rgba(168, 85, 247, 0.05) 0%, transparent 40%),
              radial-gradient(ellipse 60% 40% at 20% 80%, rgba(0, 229, 204, 0.04) 0%, transparent 40%)
            `
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#050608]/80 backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
            <div className="flex items-center flex-shrink-0" data-testid="text-logo">
              <TreasureCoastLogo size="md" />
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white/80 hover:text-white text-sm sm:text-base px-2 sm:px-4" data-testid="link-login">
                  <span className="hidden sm:inline">Client Login</span>
                  <span className="sm:hidden">Login</span>
                </Button>
              </Link>
              <Button 
                className="btn-gradient-primary rounded-xl px-3 sm:px-6 text-sm sm:text-base glow-cyan" 
                data-testid="button-get-started-nav"
                onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                aria-label="Book a Live Demo"
              >
                <Calendar className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="sm:hidden">Demo</span>
                <span className="hidden sm:inline">Book Demo</span>
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6 sm:mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-white/80">Powered by GPT-4</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 tracking-tight leading-normal" data-testid="text-hero-title">
              AI Assistants that
              <span className="text-gradient-cyan-purple block mt-2 pb-2">work for your business 24/7.</span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed">
              Your AI-powered front desk that <strong className="text-white">never sleeps</strong>. 
              Engage every visitor, capture every lead, and book appointments around the clock.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button 
                size="lg" 
                className="btn-gradient-primary rounded-xl px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg group glow-cyan-strong w-full sm:w-auto"
                data-testid="button-book-demo-hero"
                onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book a Live Demo
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link href="/demos" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-xl px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg border-white/20 text-white hover:bg-white/10 hover:border-primary/50 transition-all duration-300 w-full"
                  data-testid="button-view-demos"
                >
                  <Sparkles className="w-5 h-5 mr-2 text-primary" />
                  See Interactive Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mt-16 sm:mt-20 max-w-3xl mx-auto px-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {[
              { value: "3x", label: "More Leads" },
              { value: "50%", label: "Time Saved" },
              { value: "10+", label: "Industries" },
              { value: "Zero", label: "Staff Needed" }
            ].map((stat, i) => (
              <div key={i} className="text-center glass-card p-4 sm:p-6">
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2 text-glow-cyan" data-testid={`stat-value-${i}`}>{stat.value}</div>
                <div className="text-sm text-white/60 font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          2. SOCIAL PROOF / "WHO IT'S FOR" STRIP
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-6 bg-[#080A0E] border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-white/60 text-sm font-semibold uppercase tracking-wider">Built for</span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { icon: Building2, label: "Small Businesses" },
                { icon: Wrench, label: "Service Providers" },
                { icon: Users, label: "Local Operators" }
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 hover:border-primary/30 transition-colors"
                  data-testid={`badge-audience-${i}`}
                >
                  <item.icon className="w-4 h-4 text-primary" />
                  <span className="text-white/80 text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.p 
            className="text-center text-white/50 text-sm mt-4 font-medium"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Trusted by businesses across all industries
          </motion.p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          3. "HOW IT WORKS" - Simple 3-Step Section
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-6 bg-[#0B0E13] relative">
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent 0%, rgba(0, 229, 204, 0.03) 50%, transparent 100%)`
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" data-testid="text-howitworks-title">
              How Treasure Coast AI <span className="text-primary">Works</span>
            </h2>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto">
              Get your 24/7 AI front desk up and running in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Code,
                title: "Add the widget to your site",
                description: "Drop a single script on your website or landing page. That's it — no complex integrations required."
              },
              {
                step: "02",
                icon: MessageSquare,
                title: "AI chats and books 24/7",
                description: "Visitors get instant answers and can book appointments or calls in a natural conversation."
              },
              {
                step: "03",
                icon: LayoutDashboard,
                title: "You manage everything in one dashboard",
                description: "See every conversation, lead, and booking. Update statuses, add notes, and we'll tweak the assistant for you."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="glass-card p-8 text-center relative group"
                data-testid={`card-step-${i}`}
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary to-secondary px-4 py-1 rounded-full text-sm font-bold text-black">
                    Step {item.step}
                  </span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mt-4 mb-6 group-hover:glow-cyan transition-all duration-300">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-white/60 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Done-for-you setup callout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 max-w-2xl mx-auto"
          >
            <div className="glass-card p-6 md:p-8 border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-1">Done-for-you setup</h4>
                  <p className="text-white/60 text-sm leading-relaxed">
                    We configure your assistant, knowledge base, and booking flows for you — so you never have to touch prompts, flows, or settings screens.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          4. FEATURE GRID - Focused on Their Pain Points
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-6 relative bg-[#0B0E13]">
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 50% 30% at 50% 50%, rgba(0, 229, 204, 0.05) 0%, transparent 70%)`
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" data-testid="text-features-title">
              Not just another chatbot.
              <span className="text-gradient-cyan-purple block mt-2">Built for local businesses.</span>
            </h2>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto">
              Generic chat widgets don't understand your business. Treasure Coast AI is built to actually convert visitors into customers.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Clock,
                title: "24/7 front desk for your website",
                description: "Never miss another inquiry, even at 2am. Your AI assistant is always ready to engage and convert."
              },
              {
                icon: Target,
                title: "Leads → pipeline → bookings",
                description: "Every conversation turns into a tracked lead or appointment in your dashboard. No leads slip through the cracks."
              },
              {
                icon: Calendar,
                title: "Tours, calls, consults — any appointment type",
                description: "Configure appointment types that match your business: facility tours, phone calls, grooming sessions, consults, and more."
              },
              {
                icon: Users,
                title: "Client dashboard + agency view",
                description: "Your clients get a simple dashboard. You get an agency command center to manage every workspace and assistant."
              },
              {
                icon: Settings,
                title: "Deep assistant configuration",
                description: "Persona, FAQs, hours, booking logic, and widget branding — all controllable from the editor. We handle it for you."
              },
              {
                icon: Code,
                title: "Easy website embed",
                description: "Drop one script tag and you're live. We provide the code and can even install it for you if needed."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="glass-card glass-card-hover p-8 group cursor-default"
                data-testid={`card-feature-${i}`}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6 group-hover:glow-cyan transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          5. DEMO SHOWROOM SECTION
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-6 bg-[#080A0E] relative">
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 50% 30%, rgba(168, 85, 247, 0.04) 0%, transparent 60%)`
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" data-testid="text-demos-title">
              See it working for <span className="text-primary">businesses like yours</span>
            </h2>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto">
              Each demo shows a fully configured AI assistant with real lead capture and booking flows.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demos.map((demo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link href={demo.href}>
                  <div 
                    className="glass-card glass-card-hover p-6 h-full cursor-pointer group hover:border-primary/30 hover:glow-cyan transition-all duration-300"
                    data-testid={`card-demo-${i}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${demo.color} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300`}>
                      <demo.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-white group-hover:text-primary transition-colors">{demo.name}</h3>
                      <p className="text-primary/80 text-sm font-medium">{demo.type}</p>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed mb-5">{demo.description}</p>
                    <div className="flex items-center text-primary text-sm font-semibold group-hover:gap-3 transition-all">
                      <span>Try Demo</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/demos">
              <Button variant="outline" className="rounded-xl px-8 py-6 text-lg border-white/20 text-white hover:bg-white/10 hover:border-primary/50">
                <Sparkles className="w-5 h-5 mr-2 text-primary" />
                View All Demos
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          6. "WHY TREASURE COAST AI" VS GENERIC TOOLS
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-6 bg-[#0B0E13] relative">
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent 0%, rgba(0, 229, 204, 0.02) 50%, transparent 100%)`
          }}
        />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" data-testid="text-comparison-title">
              Why Treasure Coast AI <span className="text-primary">beats generic chatbots</span>
            </h2>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-4">
              Purpose-built for real local businesses, not developers
            </p>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 glow-cyan">
              <Bot className="w-5 h-5 text-primary" />
              <span className="text-sm text-white/80 font-medium">Powered by GPT-4 — we handle all the prompts for you</span>
            </div>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                feature: "Purpose-built for tours & appointments",
                generic: "Generic Q&A with no booking capability",
                ours: "Specifically built to drive bookings, tours, consultations, and phone calls"
              },
              {
                feature: "End-to-end pipeline, not just chat",
                generic: "No tracking of leads or follow-up",
                ours: "Leads, bookings, and conversations all show up in dashboards for both admin and clients"
              },
              {
                feature: "Agency & multi-tenant friendly",
                generic: "One-off installs with no central management",
                ours: "Multi-tenant architecture so an agency can manage many landlords/clients from one place"
              },
              {
                feature: "Done-for-you configuration",
                generic: "Expect you to be a prompt engineer",
                ours: "We set up personas, FAQs, and flows so your clients don't have to touch anything"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card p-6"
                data-testid={`comparison-row-${i}`}
              >
                <h4 className="text-lg font-semibold text-white mb-4">{item.feature}</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/15">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <X className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <div>
                      <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Generic chatbots</span>
                      <p className="text-white/60 mt-1 text-sm leading-relaxed">{item.generic}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <span className="text-primary text-xs font-medium uppercase tracking-wider">Treasure Coast AI</span>
                      <p className="text-white/80 mt-1 text-sm leading-relaxed">{item.ours}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          7. FAQ SECTION - Answer Real Owner Objections
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-6 bg-[#0B0E13] relative" id="faq">
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 50% 40% at 50% 50%, rgba(168, 85, 247, 0.03) 0%, transparent 60%)`
          }}
        />
        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" data-testid="text-faq-title">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
            <p className="text-lg sm:text-xl text-white/60">
              Everything you need to know about getting started
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="glass-card overflow-hidden"
                data-testid={`faq-item-${i}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                  data-testid={`button-faq-${i}`}
                >
                  <span className="text-white font-medium text-lg pr-4">{faq.question}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/50 flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <motion.div 
                    className="px-6 pb-6"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-white/60 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          8. CONTACT FORM / BOOK A DEMO SECTION
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-6 bg-[#0B0E13]" id="contact-form">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card p-8 md:p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" data-testid="text-contact-title">
                  Book a Live Demo
                </h2>
                <p className="text-white/60 text-lg">
                  See exactly how Treasure Coast AI works for your business — we'll walk you through everything.
                </p>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-6" data-testid="form-contact">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Your Name</label>
                    <Input
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Smith"
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      data-testid="input-contact-name"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Email Address</label>
                    <Input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@business.com"
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      data-testid="input-contact-email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-2">Phone Number (optional)</label>
                  <Input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    data-testid="input-contact-phone"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-2">Tell us about your business</label>
                  <Textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="What type of business do you run? What do you want the AI to help with?"
                    rows={4}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
                    data-testid="input-contact-message"
                  />
                </div>
                {/* Honeypot field - hidden from users, traps bots */}
                <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
                  <Input
                    type="text"
                    name="honeypot"
                    value={contactForm.honeypot}
                    onChange={(e) => setContactForm(prev => ({ ...prev, honeypot: e.target.value }))}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full btn-gradient-primary rounded-xl py-6 text-lg glow-cyan"
                  data-testid="button-contact-submit"
                >
                  {isSubmitting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5 mr-2" />
                      Book My Demo
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-white/50">
                <a 
                  href="mailto:hello@treasurecoastai.com" 
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                  data-testid="link-contact-email"
                >
                  <Mail className="w-4 h-4" />
                  hello@treasurecoastai.com
                </a>
                <a 
                  href="tel:+17725551234" 
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                  data-testid="link-contact-phone"
                >
                  <Phone className="w-4 h-4" />
                  (772) 555-1234
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          9. WHAT YOU GET SECTION
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-6 bg-[#080A0E] relative">
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 50% 40% at 50% 50%, rgba(0, 229, 204, 0.03) 0%, transparent 60%)`
          }}
        />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div 
            className="text-center mb-12"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" data-testid="text-whatyouget-title">
              What you get with <span className="text-primary">Treasure Coast AI</span>
            </h2>
            <p className="text-lg sm:text-xl text-white/60">
              Everything you need to start converting visitors into customers
            </p>
          </motion.div>

          <motion.div 
            className="glass-card p-8 md:p-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Bot, text: "One fully configured AI assistant tailored to your business" },
                { icon: Palette, text: "Website chat widget with your branding, colors, and logo" },
                { icon: LayoutDashboard, text: "Client dashboard to view leads, bookings, and conversations" },
                { icon: Settings, text: "Agency control panel so we can fine-tune everything for you" },
                { icon: FileText, text: "Ongoing updates to FAQs and flows as your business changes" },
                { icon: Headphones, text: "Support from our team when you need adjustments" }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-white/80 text-sm leading-relaxed pt-1">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          10. FINAL CTA SECTION
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-6 bg-[#0B0E13]">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            className="glass-card p-12 md:p-20 text-center relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Background accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6" data-testid="text-cta-title">
                Ready to stop losing leads after hours?
              </h2>
              <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10">
                Let an AI front desk greet every visitor, answer their questions, and book their next step — while you focus on running the business.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  className="btn-gradient-primary rounded-xl px-8 py-6 text-lg group glow-cyan-strong w-full sm:w-auto"
                  data-testid="button-final-demo"
                  onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book a Live Demo
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Link href="/demo/faith-house" className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="rounded-xl px-8 py-6 text-lg border-white/20 text-white hover:bg-white/10 hover:border-primary/50 transition-all duration-300 w-full"
                    data-testid="button-final-watch-demo"
                  >
                    <Sparkles className="w-5 h-5 mr-2 text-primary" />
                    Watch the Faith House Demo
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/[0.08] bg-[#050608]" data-testid="footer">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div data-testid="footer-logo" className="mb-4">
                <TreasureCoastLogo size="md" />
              </div>
              <p className="text-white/50 text-sm max-w-md leading-relaxed mb-6">
                AI-powered front desk assistants for local businesses. We build and manage custom chatbots that capture leads, answer questions, and book appointments 24/7.
              </p>
              <div className="flex items-center gap-4">
                <a 
                  href="mailto:hello@treasurecoastai.com" 
                  className="flex items-center gap-2 text-white/50 hover:text-primary transition-colors text-sm"
                  data-testid="footer-email"
                >
                  <Mail className="w-4 h-4" />
                  hello@treasurecoastai.com
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <div className="flex flex-col gap-3">
                <a href="#faq" className="text-white/50 hover:text-primary transition-colors text-sm">FAQ</a>
                <Link href="/demos" className="text-white/50 hover:text-primary transition-colors text-sm">View Demos</Link>
                <a href="#contact-form" className="text-white/50 hover:text-primary transition-colors text-sm">Book Demo</a>
                <Link href="/login" className="text-white/50 hover:text-primary transition-colors text-sm">Client Login</Link>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Industries</h4>
              <div className="flex flex-col gap-3">
                <span className="text-white/50 text-sm">Medical & Wellness</span>
                <span className="text-white/50 text-sm">Home Services</span>
                <span className="text-white/50 text-sm">Hospitality</span>
                <span className="text-white/50 text-sm">Professional Services</span>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm" data-testid="footer-copyright">
              &copy; {new Date().getFullYear()} Treasure Coast AI. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-white/40 hover:text-primary transition-colors text-sm" data-testid="link-privacy">Privacy Policy</a>
              <a href="#" className="text-white/40 hover:text-primary transition-colors text-sm" data-testid="link-terms">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Platform Help Bot */}
      <PlatformHelpBot variant="landing" />
    </div>
  );
}
