import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronDown, Check, MessageSquare, Calendar, Users, Zap, Clock, TrendingUp, Shield, RefreshCw } from "lucide-react";

export default function LandingPreview() {
  const [formData, setFormData] = useState({ name: "", businessName: "", email: "", phone: "", message: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const response = await fetch("/api/public/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setFormSubmitted(true);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const faqItems = [
    {
      q: "How long does it take to set up?",
      a: "Most businesses are up and running within 24-48 hours. Our done-for-you setup includes configuring your AI assistant, customizing responses for your industry, and providing the embed code for your website."
    },
    {
      q: "Can I edit what the AI says?",
      a: "Absolutely! You have full control over your AI's responses, personality, and knowledge base. You can add FAQs, update business info, and customize how it handles different scenarios through our easy-to-use dashboard."
    },
    {
      q: "What if the AI gives wrong information?",
      a: "Our AI is trained specifically on your business information and includes built-in safety guardrails. It only answers based on what you've provided and gracefully handles questions it can't answer by offering to connect customers with your team."
    },
    {
      q: "Does it integrate with my booking system?",
      a: "Yes! We integrate with popular booking platforms like Calendly, Acuity, Square, and many others. The AI can direct customers to your booking link or collect their preferred times for you to follow up."
    },
    {
      q: "What kind of support do you offer?",
      a: "We provide email support for Starter plans and priority support for Pro plans. Our team typically responds within 24 hours and can help with setup, customization, and any technical questions."
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes, there are no long-term contracts. You can cancel your subscription at any time, and you'll continue to have access until the end of your billing period."
    },
    {
      q: "How is my data protected?",
      a: "We take security seriously. All data is encrypted in transit and at rest, we're GDPR compliant, and we never sell your customer data. You retain full ownership of all conversation data."
    },
    {
      q: "Will this work for my industry?",
      a: "Our AI assistants are designed to work across many service-based industries including salons, restaurants, healthcare, real estate, fitness, and more. We have industry-specific templates that get you started quickly."
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E13] text-white font-sans relative overflow-x-hidden">
      
      {/* Hero Background - Single image, no repeat */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('/landing/assets/backgrounds/tca-hero-bg-4k.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Bottom Fade to blend skyline into base color */}
      <div 
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(11,14,19,0.6) 65%, rgba(11,14,19,0.85) 80%, #0B0E13 100%)',
        }}
      />
      
      {/* Noise overlay - very subtle */}
      <div 
        className="fixed inset-0 z-[2] pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />
      
      {/* Animated Orb FX - CSS only */}
      <div className="fixed top-[-15%] left-[-10%] w-[500px] h-[500px] z-[3] pointer-events-none opacity-40 animate-pulse" style={{ animationDuration: '8s' }}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-500/50 to-transparent blur-[100px]" />
      </div>
      <div className="fixed top-[15%] right-[-15%] w-[600px] h-[600px] z-[3] pointer-events-none opacity-30 animate-pulse" style={{ animationDuration: '10s' }}>
        <div className="w-full h-full rounded-full bg-gradient-to-bl from-fuchsia-500/40 to-transparent blur-[120px]" />
      </div>
      <div className="fixed bottom-[-10%] left-[25%] w-[450px] h-[450px] z-[3] pointer-events-none opacity-25 animate-pulse" style={{ animationDuration: '12s' }}>
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-violet-500/35 to-transparent blur-[90px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        
        {/* Navigation - Glass with scroll effect */}
        <nav className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 transition-all duration-300 ${scrolled ? 'py-2' : ''}`}>
          <div className={`max-w-7xl mx-auto flex items-center justify-between backdrop-blur-xl rounded-2xl px-4 md:px-6 py-3 border transition-all duration-300 ${
            scrolled 
              ? 'bg-black/50 border-white/15 shadow-lg shadow-black/20' 
              : 'bg-black/30 border-white/10'
          }`}>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 md:gap-3" data-testid="link-logo">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-lg md:text-xl font-bold tracking-wide hidden sm:block">TREASURE COAST AI</span>
            </Link>
            
            {/* Nav Links - Desktop */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              <a href="#how" onClick={(e) => scrollToSection(e, "how")} className="text-white/70 hover:text-white transition-colors text-sm" data-testid="link-how">
                How It Works
              </a>
              <a href="#templates" onClick={(e) => scrollToSection(e, "templates")} className="text-white/70 hover:text-white transition-colors text-sm" data-testid="link-templates">
                Templates
              </a>
              <a href="#pricing" onClick={(e) => scrollToSection(e, "pricing")} className="text-white/70 hover:text-white transition-colors text-sm" data-testid="link-pricing">
                Pricing
              </a>
              <a href="#faq" onClick={(e) => scrollToSection(e, "faq")} className="text-white/70 hover:text-white transition-colors text-sm" data-testid="link-faq">
                FAQ
              </a>
            </div>
            
            {/* Auth Buttons */}
            <div className="flex items-center gap-2 md:gap-3">
              <Link 
                href="/login" 
                className="hidden md:block px-4 py-2 rounded-full border border-white/20 text-white/80 text-sm hover:text-white hover:border-white/40 transition-all"
                data-testid="button-client-login"
              >
                Client Login
              </Link>
              <a
                href="#book"
                onClick={(e) => scrollToSection(e, "book")}
                className="px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/35 hover:scale-105 transition-all"
                data-testid="button-book-demo-nav"
              >
                Book Demo
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section - Two Column Layout */}
        <section className="min-h-screen flex items-center px-4 md:px-6 pt-24 pb-12 md:pt-28 md:pb-16">
          <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Left Column - Text Content */}
            <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[3.5rem] xl:text-7xl font-bold leading-[1.1] mb-5 md:mb-6">
                AI Chatbots that run your front desk{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">24/7.</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-white/70 mb-6 md:mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Answer questions instantly, capture leads, and send customers to booking — without hiring staff.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 md:mb-10 justify-center lg:justify-start">
                <a
                  href="#book"
                  onClick={(e) => scrollToSection(e, "book")}
                  className="inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 text-white font-semibold text-base md:text-lg shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all hover:scale-105 border border-cyan-400/30"
                  data-testid="button-book-demo-hero"
                >
                  Book a Live Demo
                </a>
                <a
                  href="#templates"
                  onClick={(e) => scrollToSection(e, "templates")}
                  className="inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-full bg-white/8 backdrop-blur-sm border border-white/15 text-white font-semibold text-base md:text-lg hover:bg-white/12 transition-all"
                  data-testid="button-see-demos"
                >
                  See Interactive Demos
                </a>
              </div>
              
              {/* Trust Chips */}
              <div className="flex flex-wrap gap-2 md:gap-3 justify-center lg:justify-start mb-6 md:mb-8">
                <TrustChip icon={<Clock className="w-4 h-4" />} text="24/7 AI Replies" />
                <TrustChip icon={<Users className="w-4 h-4" />} text="Lead Capture + Booking" />
                <TrustChip icon={<Zap className="w-4 h-4" />} text="Done-For-You Setup" />
              </div>

              {/* Stats Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatBox value="3×" label="more leads" />
                <StatBox value="50%" label="time saved" />
                <StatBox value="10+" label="industries" />
                <StatBox value="$0" label="new staff" />
              </div>
            </div>
            
            {/* Right Column - Widget Preview */}
            <div className="relative flex justify-center lg:justify-end mt-8 lg:mt-0">
              <WidgetPreviewPoster />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how" className="px-4 md:px-6 py-16 md:py-24 relative">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-3 md:mb-4">
              How It Works
            </h2>
            <p className="text-white/60 text-center mb-12 md:mb-16 max-w-2xl mx-auto text-sm md:text-base">
              Get your AI assistant up and running in minutes, not months.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              <HowItWorksCard 
                step={1} 
                title="Add widget to your site" 
                description="Copy one line of code to your website. Works with any platform — Wix, Squarespace, WordPress, or custom sites."
                color="cyan"
              />
              <HowItWorksCard 
                step={2} 
                title="AI chats + qualifies leads 24/7" 
                description="Your AI assistant answers questions, captures contact info, and determines which leads are ready to book."
                color="purple"
              />
              <HowItWorksCard 
                step={3} 
                title="Send to booking + track in dashboard" 
                description="Hot leads get sent directly to your booking system. Track everything in your real-time dashboard."
                color="pink"
              />
            </div>

            {/* Done-for-you callout */}
            <div className="mt-10 md:mt-12 max-w-xl mx-auto">
              <div className="flex items-center justify-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
                  <Check className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-white/80 text-sm md:text-base font-medium">Done-for-you setup included with every plan</span>
              </div>
            </div>
          </div>
        </section>

        {/* Templates Section */}
        <section id="templates" className="px-4 md:px-6 py-16 md:py-24 relative">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-3 md:mb-4">
              Industry Templates
            </h2>
            <p className="text-white/60 text-center mb-12 md:mb-16 max-w-2xl mx-auto text-sm md:text-base">
              Pre-built for your industry. Customize in minutes.
            </p>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <TemplateCard name="Barbershop" value="Book more appointments automatically" link="/demo/barbershop" icon={<MessageSquare className="w-5 h-5" />} />
              <TemplateCard name="Salon & Spa" value="24/7 booking for beauty services" link="/demo/salon" icon={<Calendar className="w-5 h-5" />} />
              <TemplateCard name="Restaurant" value="Handle reservations & takeout orders" link="/demo/restaurant" icon={<Users className="w-5 h-5" />} />
              <TemplateCard name="Healthcare" value="Patient inquiries answered instantly" link="/demo/dental" icon={<Shield className="w-5 h-5" />} />
              <TemplateCard name="Real Estate" value="Qualify leads and schedule showings" link="/demo/real-estate" icon={<TrendingUp className="w-5 h-5" />} />
              <TemplateCard name="Fitness" value="Sign up new members around the clock" link="/demo/fitness" icon={<Zap className="w-5 h-5" />} />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="px-4 md:px-6 py-16 md:py-24 relative">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-3 md:mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-white/60 text-center mb-12 md:mb-16 max-w-2xl mx-auto text-sm md:text-base">
              No hidden fees. Cancel anytime.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
              {/* Starter Plan */}
              <div className="relative p-6 md:p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-500/30 transition-all group">
                <h3 className="text-xl md:text-2xl font-semibold mb-2">Starter</h3>
                <p className="text-white/50 text-sm mb-4 md:mb-6">Perfect for small businesses</p>
                <div className="text-4xl md:text-5xl font-bold mb-4 md:mb-6">
                  $29<span className="text-base md:text-lg font-normal text-white/50">/mo</span>
                </div>
                <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                  {["1 AI Assistant", "500 conversations/mo", "Basic analytics", "Email support", "Standard templates"].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/70 text-sm md:text-base">
                      <Check className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="#book"
                  onClick={(e) => scrollToSection(e, "book")}
                  className="block w-full text-center py-3 md:py-4 rounded-full border border-cyan-500/50 text-cyan-400 font-semibold hover:bg-cyan-500/10 transition-all text-sm md:text-base"
                  data-testid="button-starter-plan"
                >
                  Start Free
                </a>
              </div>
              
              {/* Pro Plan */}
              <div className="relative p-6 md:p-8 rounded-3xl bg-gradient-to-br from-purple-500/15 to-pink-500/10 backdrop-blur-xl border-2 border-purple-500/40 hover:border-purple-400/60 transition-all shadow-[0_0_60px_rgba(168,85,247,0.15)]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
                <h3 className="text-xl md:text-2xl font-semibold mb-2 mt-2">Pro</h3>
                <p className="text-white/50 text-sm mb-4 md:mb-6">For growing businesses</p>
                <div className="text-4xl md:text-5xl font-bold mb-4 md:mb-6">
                  $79<span className="text-base md:text-lg font-normal text-white/50">/mo</span>
                </div>
                <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                  {["3 AI Assistants", "Unlimited conversations", "Advanced analytics", "Priority support", "Custom branding", "API access"].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/70 text-sm md:text-base">
                      <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="#book"
                  onClick={(e) => scrollToSection(e, "book")}
                  className="block w-full text-center py-3 md:py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all text-sm md:text-base"
                  data-testid="button-pro-plan"
                >
                  Start Free
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="px-4 md:px-6 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-3 md:mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-white/60 text-center mb-10 md:mb-14 text-sm md:text-base">
              Everything you need to know about Treasure Coast AI.
            </p>
            
            <div className="space-y-3 md:space-y-4">
              {faqItems.map((item, i) => (
                <FaqAccordion 
                  key={i}
                  index={i}
                  question={item.q}
                  answer={item.a}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Book Demo Section */}
        <section id="book" className="px-4 md:px-6 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-3 md:mb-4">
              Book Your Demo
            </h2>
            <p className="text-white/60 text-center mb-10 md:mb-12 max-w-xl mx-auto text-sm md:text-base">
              See how Treasure Coast AI can transform your customer experience. Schedule a personalized demo today.
            </p>
            
            <div className="p-6 md:p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10">
              {formSubmitted ? (
                <div className="text-center py-8 md:py-12">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold mb-2">Thank You!</h3>
                  <p className="text-white/60 text-sm md:text-base">We'll be in touch within 24 hours to schedule your demo.</p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-5 md:space-y-6">
                  <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                    <FormInput 
                      label="Your Name" 
                      type="text" 
                      value={formData.name} 
                      onChange={(val) => setFormData({ ...formData, name: val })}
                      placeholder="John Smith"
                      required
                      testId="input-name"
                    />
                    <FormInput 
                      label="Business Name" 
                      type="text" 
                      value={formData.businessName} 
                      onChange={(val) => setFormData({ ...formData, businessName: val })}
                      placeholder="Acme Inc."
                      required
                      testId="input-business-name"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                    <FormInput 
                      label="Email Address" 
                      type="email" 
                      value={formData.email} 
                      onChange={(val) => setFormData({ ...formData, email: val })}
                      placeholder="john@company.com"
                      required
                      testId="input-email"
                    />
                    <FormInput 
                      label="Phone Number" 
                      type="tel" 
                      value={formData.phone} 
                      onChange={(val) => setFormData({ ...formData, phone: val })}
                      placeholder="(555) 123-4567"
                      testId="input-phone"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Message (optional)</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors resize-none text-sm md:text-base"
                      placeholder="Tell us about your business and what you're looking for..."
                      data-testid="input-message"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full py-3 md:py-4 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 text-white font-semibold text-base md:text-lg shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    data-testid="button-submit-demo"
                  >
                    {formLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      "Request Demo"
                    )}
                  </button>
                  <p className="text-center text-white/40 text-xs md:text-sm">
                    We respond within 24 hours. No spam, ever.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-4 md:px-6 py-10 md:py-12 border-t border-white/10 bg-black/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <span className="font-semibold text-sm md:text-base">TREASURE COAST AI</span>
              </div>
              
              <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm text-white/50">
                <Link href="/terms" className="hover:text-white transition-colors" data-testid="link-terms">Terms</Link>
                <Link href="/privacy" className="hover:text-white transition-colors" data-testid="link-privacy">Privacy</Link>
                <Link href="/acceptable-use" className="hover:text-white transition-colors" data-testid="link-acceptable-use">Acceptable Use</Link>
                <Link href="/cookies" className="hover:text-white transition-colors" data-testid="link-cookies">Cookies</Link>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/5 text-center">
              <p className="text-white/40 text-xs md:text-sm">
                © {new Date().getFullYear()} Treasure Coast AI. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ========== SUBCOMPONENTS ========== */

function TrustChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-3 md:px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-xs md:text-sm text-white/80 flex items-center gap-2">
      <span className="text-cyan-400">{icon}</span>
      {text}
    </div>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="p-3 md:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-center" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="text-xl md:text-2xl font-bold text-white" data-testid={`stat-value-${label.toLowerCase().replace(/\s+/g, '-')}`}>{value}</div>
      <div className="text-xs md:text-sm text-white/50">{label}</div>
    </div>
  );
}

function HowItWorksCard({ step, title, description, color }: { step: number; title: string; description: string; color: "cyan" | "purple" | "pink" }) {
  const colorClasses = {
    cyan: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400 group-hover:border-cyan-500/50",
    purple: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400 group-hover:border-purple-500/50",
    pink: "from-pink-500/20 to-orange-500/20 border-pink-500/30 text-pink-400 group-hover:border-pink-500/50",
  };

  return (
    <div className="group p-6 md:p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/8 transition-all" data-testid={`card-how-step-${step}`}>
      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${colorClasses[color].split(' ').slice(0, 2).join(' ')} border ${colorClasses[color].split(' ')[2]} flex items-center justify-center mb-5 md:mb-6`}>
        <span className={`text-xl md:text-2xl font-bold ${colorClasses[color].split(' ')[3]}`} data-testid={`text-step-number-${step}`}>{step}</span>
      </div>
      <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3" data-testid={`text-step-title-${step}`}>{title}</h3>
      <p className="text-white/60 text-sm md:text-base leading-relaxed">{description}</p>
    </div>
  );
}

function TemplateCard({ name, value, link, icon }: { name: string; value: string; link: string; icon: React.ReactNode }) {
  return (
    <Link 
      href={link}
      className="group p-5 md:p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 transition-all hover:bg-white/8 cursor-pointer"
      data-testid={`link-template-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-semibold mb-1">{name}</h3>
          <p className="text-sm text-white/50 truncate">{value}</p>
        </div>
        <svg className="w-5 h-5 text-white/30 group-hover:text-cyan-400 transition-colors flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function FaqAccordion({ question, answer, isOpen, onToggle, index }: { question: string; answer: string; isOpen: boolean; onToggle: () => void; index?: number }) {
  const panelId = `faq-panel-${index ?? 0}`;
  const buttonId = `faq-button-${index ?? 0}`;
  
  return (
    <div className={`rounded-2xl bg-white/5 backdrop-blur-xl border transition-all ${isOpen ? 'border-cyan-500/30' : 'border-white/10'}`}>
      <button
        id={buttonId}
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 md:p-6 text-left"
        aria-expanded={isOpen}
        aria-controls={panelId}
        data-testid={`button-faq-${index ?? 0}`}
      >
        <span className="font-semibold text-sm md:text-base pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-white/50 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <div 
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}
      >
        <p className="px-5 md:px-6 pb-5 md:pb-6 text-white/60 text-sm md:text-base leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

function FormInput({ label, type, value, onChange, placeholder, required, testId }: { 
  label: string; type: string; value: string; onChange: (val: string) => void; placeholder: string; required?: boolean; testId: string 
}) {
  return (
    <div>
      <label className="block text-sm text-white/60 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors text-sm md:text-base"
        placeholder={placeholder}
        required={required}
        data-testid={testId}
      />
    </div>
  );
}

/* ========== WIDGET PREVIEW ========== */

function WidgetPreviewPoster() {
  return (
    <div className="relative mx-auto w-full max-w-[400px] lg:max-w-[480px] z-10">
      <div className="pointer-events-none absolute -inset-8 rounded-[40px] bg-cyan-400/15 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="pointer-events-none absolute -inset-8 rounded-[40px] bg-fuchsia-500/10 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />

      <div className="relative overflow-hidden rounded-[28px] md:rounded-[32px] border border-white/15 bg-gradient-to-b from-white/12 via-white/8 to-white/4 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
        <div className="pointer-events-none absolute inset-0 rounded-[28px] md:rounded-[32px] ring-1 ring-white/10" />
        <div className="pointer-events-none absolute -inset-1 rounded-[30px] md:rounded-[34px] bg-gradient-to-r from-cyan-400/25 via-fuchsia-500/15 to-violet-500/25 blur-xl opacity-60" />

        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent" />

        {/* Header */}
        <div className="relative flex items-center gap-3 px-5 md:px-6 pt-5 md:pt-6">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl border border-white/15 bg-gradient-to-br from-cyan-400/40 to-fuchsia-500/30 shadow-[0_0_24px_rgba(0,255,255,0.18)]" />
          <div className="leading-tight">
            <div className="text-white/95 font-bold text-sm md:text-base tracking-wide">
              TREASURE COAST AI
            </div>
            <div className="text-xs md:text-sm text-white/55">Your Business, Upgraded</div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>
        </div>

        {/* Messages */}
        <div className="relative px-5 md:px-6 pt-4 md:pt-5 pb-5 md:pb-6 space-y-3 md:space-y-4">
          <Bubble side="left">
            Welcome! How can I help you today?
          </Bubble>

          <Bubble side="right">
            I'd like to book an appointment
          </Bubble>

          <Bubble side="left">
            Perfect! I can help with that. When works best for you?
          </Bubble>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <QuickPill tone="cyan" label="Book Now" />
            <QuickPill tone="violet" label="View Services" />
            <QuickPill tone="pink" label="Hours" />
          </div>

          {/* Status pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            <StatusPill label="Lead Captured" />
            <StatusPill label="Booking Link Sent" />
            <StatusPill label="Follow-Up Automated" />
          </div>

          {/* Input */}
          <div className="mt-4 md:mt-5">
            <div className="relative flex items-center gap-3 rounded-xl md:rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl px-4 py-2.5 md:py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="text-white/35 text-sm font-medium">Ask anything...</div>
              <div className="ml-auto h-8 w-8 md:h-10 md:w-10 rounded-xl md:rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/30 to-blue-500/20 shadow-[0_0_18px_rgba(0,255,255,0.2)] flex items-center justify-center">
                <svg className="w-4 h-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
    </div>
  );
}

function Bubble({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  const align = side === "right" ? "justify-end" : "justify-start";
  const bubbleBase = "max-w-[85%] rounded-2xl px-4 py-2.5 md:py-3 text-white/90 text-sm md:text-base font-medium leading-snug border border-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
  const leftStyle = "bg-gradient-to-br from-white/12 via-white/8 to-white/5";
  const rightStyle = "bg-gradient-to-br from-cyan-400/18 via-fuchsia-500/12 to-violet-500/15";

  return (
    <div className={`flex ${align}`}>
      <div className={`${bubbleBase} ${side === "right" ? rightStyle : leftStyle}`}>
        {children}
      </div>
    </div>
  );
}

function QuickPill({ label, tone }: { label: string; tone: "cyan" | "violet" | "pink" }) {
  const toneClass = tone === "cyan"
    ? "shadow-[0_0_16px_rgba(0,255,255,0.12)] hover:shadow-[0_0_20px_rgba(0,255,255,0.2)]"
    : tone === "violet"
    ? "shadow-[0_0_16px_rgba(160,90,255,0.12)] hover:shadow-[0_0_20px_rgba(160,90,255,0.2)]"
    : "shadow-[0_0_16px_rgba(255,90,200,0.10)] hover:shadow-[0_0_20px_rgba(255,90,200,0.18)]";

  return (
    <button
      type="button"
      className={`rounded-full px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-bold border border-white/15 bg-white/8 backdrop-blur-xl text-white/85 hover:bg-white/12 transition-all ${toneClass}`}
    >
      {label}
    </button>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <div className="rounded-full px-2.5 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-bold text-white/70 border border-white/10 bg-black/25 backdrop-blur-xl flex items-center gap-1.5">
      <Check className="w-3 h-3 text-green-400" />
      {label}
    </div>
  );
}
