import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Bot, 
  Sparkles, 
  Globe, 
  MessageSquare, 
  BarChart3, 
  Zap, 
  Shield, 
  ArrowRight,
  Check,
  Users,
  TrendingUp
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
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center hero-mesh">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-cyan">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white" data-testid="text-logo">Treasure Coast AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white/80 hover:text-white" data-testid="link-login">
                  Admin Login
                </Button>
              </Link>
              <Link href="/demos">
                <Button className="btn-gradient-primary rounded-xl px-6 glow-cyan" data-testid="button-get-started-nav">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-white/80">Powered by GPT-4</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight" data-testid="text-hero-title">
              AI Chatbots That
              <span className="text-gradient-cyan-purple block mt-2">Actually Convert</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-10 leading-relaxed">
              World-class AI assistants for your business. 
              Capture leads, book appointments, and delight customers 24/7 — 
              all while you sleep.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/demos">
                <Button 
                  size="lg" 
                  className="btn-gradient-primary rounded-xl px-8 py-6 text-lg group glow-cyan-strong"
                  data-testid="button-get-started-hero"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Contact Us Today
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/demos">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-xl px-8 py-6 text-lg border-white/20 text-white hover:bg-white/10 hover:border-primary/50 transition-all duration-300"
                  data-testid="button-view-demos"
                >
                  <Sparkles className="w-5 h-5 mr-2 text-primary" />
                  See Live Demos
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {[
              { value: "24/7", label: "Availability" },
              { value: "10x", label: "More Leads" },
              { value: "95%", label: "Response Rate" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1" data-testid={`stat-value-${i}`}>{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div 
            className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-1 h-2 rounded-full bg-white/40" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 relative">
        <div className="absolute inset-0 gradient-radial-glow opacity-50" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            className="text-center mb-20"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" data-testid="text-features-title">
              Everything You Need to
              <span className="text-gradient-cyan-purple"> Win</span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Built for agencies who demand the best. Create stunning AI chatbots that work as hard as you do.
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
                icon: Globe,
                title: "Website Scraper",
                description: "Paste a URL and watch AI extract all business info, FAQs, services, and more. Instant bot setup."
              },
              {
                icon: Sparkles,
                title: "GPT-4 Powered",
                description: "World-class AI that handles any question brilliantly. Your customers won't believe it's a bot."
              },
              {
                icon: MessageSquare,
                title: "Lead Capture",
                description: "Automatically detect and save lead information. Never miss a potential customer again."
              },
              {
                icon: BarChart3,
                title: "Rich Analytics",
                description: "See every conversation, lead, and booking. Know exactly how your bot performs."
              },
              {
                icon: Zap,
                title: "Instant Deploy",
                description: "Copy-paste embed code and your bot goes live. Works on any website instantly."
              },
              {
                icon: Shield,
                title: "Enterprise Ready",
                description: "Bank-level security, 99.9% uptime, and dedicated support for your peace of mind."
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

      {/* How It Works */}
      <section className="py-32 px-6 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-20"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" data-testid="text-howitworks-title">
              Live in <span className="text-primary">Minutes</span>, Not Months
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              From zero to deployed AI chatbot in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Paste Website URL",
                description: "Our AI scrapes your client's website and extracts all the business information automatically."
              },
              {
                step: "02",
                title: "Customize & Train",
                description: "Tweak the personality, add FAQs, set up lead capture rules. Make it perfect."
              },
              {
                step: "03",
                title: "Deploy & Profit",
                description: "Copy the embed code, add it to the website, and watch leads roll in 24/7."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative"
                data-testid={`card-step-${i}`}
              >
                <div className="text-8xl font-bold text-white/5 absolute -top-4 left-0">{item.step}</div>
                <div className="relative pt-12 pl-4">
                  <h3 className="text-2xl font-semibold text-white mb-4">{item.title}</h3>
                  <p className="text-white/60 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
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
              <div className="flex items-center justify-center gap-4 mb-8">
                <Users className="w-8 h-8 text-primary" />
                <span className="text-lg text-white/60">Trusted by agencies worldwide</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8" data-testid="text-cta-title">
                Ready to 10x Your Client Results?
              </h2>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
                {[
                  "Unlimited bots",
                  "GPT-4 powered",
                  "White-label ready",
                  "Priority support"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary" />
                    <span className="text-white/80">{item}</span>
                  </div>
                ))}
              </div>

              <Link href="/demos">
                <Button 
                  size="lg" 
                  className="btn-gradient-secondary rounded-xl px-10 py-6 text-lg group glow-purple-strong"
                  data-testid="button-start-free-trial"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Get Your Custom Bot
                  <TrendingUp className="w-5 h-5 ml-2 group-hover:translate-y-[-2px] transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">Treasure Coast AI</span>
          </div>
          
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} Treasure Coast AI. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-white/40 hover:text-white transition-colors text-sm" data-testid="link-privacy">Privacy</a>
            <a href="#" className="text-white/40 hover:text-white transition-colors text-sm" data-testid="link-terms">Terms</a>
            <a href="#" className="text-white/40 hover:text-white transition-colors text-sm" data-testid="link-contact">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
