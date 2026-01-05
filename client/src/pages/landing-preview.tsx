import { useState, useEffect } from "react";
import { Link } from "wouter";

export default function LandingPreview() {
  const [formData, setFormData] = useState({ name: "", email: "", business: "", message: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0B0E13] text-white font-sans relative overflow-x-hidden">
      
      {/* Hero Background - Single image, no repeat */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('/landing/assets/backgrounds/tca-hero-bg-4k.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Bottom Fade to blend skyline into base color */}
      <div 
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(11,14,19,0.7) 75%, #0B0E13 95%)',
        }}
      />
      
      {/* Noise overlay - very subtle */}
      <div 
        className="fixed inset-0 z-[2] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url('/landing/assets/fx/noise-overlay-4k.png')`,
          backgroundRepeat: 'repeat',
          mixBlendMode: 'overlay',
        }}
      />
      
      {/* Orb FX - Ambient glow effects */}
      <div 
        className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] z-[3] pointer-events-none opacity-30"
        style={{
          backgroundImage: `url('/landing/assets/fx/orb-cyan-2048.png')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(80px)',
          mixBlendMode: 'screen',
        }}
      />
      <div 
        className="fixed top-[20%] right-[-15%] w-[700px] h-[700px] z-[3] pointer-events-none opacity-25"
        style={{
          backgroundImage: `url('/landing/assets/fx/orb-magenta-2048.png')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(100px)',
          mixBlendMode: 'screen',
        }}
      />
      <div 
        className="fixed bottom-[-10%] left-[30%] w-[500px] h-[500px] z-[3] pointer-events-none opacity-20"
        style={{
          backgroundImage: `url('/landing/assets/fx/orb-violet-2048.png')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(90px)',
          mixBlendMode: 'screen',
        }}
      />

      {/* Main Content */}
      <div className="relative z-10">
        
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between backdrop-blur-md bg-black/30 rounded-2xl px-6 py-3 border border-white/10">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3" data-testid="link-logo">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xl font-bold tracking-wide">TREASURE COAST AI</span>
            </Link>
            
            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a 
                href="#how" 
                onClick={(e) => scrollToSection(e, "how")}
                className="text-white/70 hover:text-white transition-colors"
                data-testid="link-how"
              >
                How It Works
              </a>
              <a 
                href="#templates" 
                onClick={(e) => scrollToSection(e, "templates")}
                className="text-white/70 hover:text-white transition-colors"
                data-testid="link-templates"
              >
                Templates
              </a>
              <a 
                href="#pricing" 
                onClick={(e) => scrollToSection(e, "pricing")}
                className="text-white/70 hover:text-white transition-colors"
                data-testid="link-pricing"
              >
                Pricing
              </a>
            </div>
            
            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="hidden md:block px-5 py-2.5 rounded-full border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-all"
                data-testid="button-client-login"
              >
                Client Login
              </Link>
              <a
                href="#book"
                onClick={(e) => scrollToSection(e, "book")}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all hover:scale-105"
                data-testid="button-book-demo-nav"
              >
                Book Demo
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section - Two Column Layout */}
        <section className="min-h-screen flex items-center px-6 pt-28 pb-16">
          <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column - Text Content */}
            <div className="max-w-xl">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6">
                Your Business,<br />
                <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">Upgraded.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/70 mb-8 leading-relaxed">
                24/7 AI Assistant that captures leads, books appointments, and answers questions — so you never miss an opportunity.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-10">
                <a
                  href="#book"
                  onClick={(e) => scrollToSection(e, "book")}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 text-white font-semibold text-lg shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all hover:scale-105 border border-cyan-400/50"
                  data-testid="button-book-demo-hero"
                >
                  Book Demo
                </a>
                <a
                  href="#templates"
                  onClick={(e) => scrollToSection(e, "templates")}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-lg hover:bg-white/15 transition-all"
                  data-testid="button-see-demos"
                >
                  See Interactive Demos
                </a>
              </div>
              
              {/* Feature Chips */}
              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-sm text-white/80 flex items-center gap-2">
                  <img src="/landing/assets/icons/icon-chatbot.png" alt="" className="w-5 h-5 opacity-80" />
                  24/7 AI Chatbot
                </div>
                <div className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-sm text-white/80 flex items-center gap-2">
                  <img src="/landing/assets/icons/icon-calendar.png" alt="" className="w-5 h-5 opacity-80" />
                  Instant Booking
                </div>
                <div className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-sm text-white/80 flex items-center gap-2">
                  <img src="/landing/assets/icons/icon-leads.png" alt="" className="w-5 h-5 opacity-80" />
                  Lead Capture
                </div>
              </div>
            </div>
            
            {/* Right Column - Widget Preview */}
            <div className="relative flex justify-center lg:justify-end">
              {/* Neon Wave Overlay */}
              <img 
                src="/landing/assets/decor/neon-wave-4096x1024.png" 
                alt="" 
                className="absolute bottom-[-20%] left-[-30%] w-[150%] h-auto opacity-60 pointer-events-none z-0"
                style={{ mixBlendMode: 'screen' }}
              />
              
              <WidgetPreviewPoster />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how" className="px-6 py-24 relative">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
              How It Works
            </h2>
            <p className="text-white/60 text-center mb-16 max-w-2xl mx-auto">
              Get your AI assistant up and running in minutes, not months.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="group p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 transition-all hover:bg-white/10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-cyan-400">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Choose Your Template</h3>
                <p className="text-white/60">Pick from our industry-specific templates designed for your business type.</p>
              </div>
              
              {/* Step 2 */}
              <div className="group p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-500/50 transition-all hover:bg-white/10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-purple-400">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Customize & Train</h3>
                <p className="text-white/60">Add your business info, services, and FAQs. Our AI learns your brand instantly.</p>
              </div>
              
              {/* Step 3 */}
              <div className="group p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-pink-500/50 transition-all hover:bg-white/10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-orange-500/20 border border-pink-500/30 flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-pink-400">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Embed & Go Live</h3>
                <p className="text-white/60">Copy one line of code to your website. Start capturing leads 24/7.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Templates Section */}
        <section id="templates" className="px-6 py-24 relative">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
              Beautiful, High-Converting Templates
            </h2>
            <p className="text-white/60 text-center mb-16 max-w-2xl mx-auto">
              Pre-built for your industry. Customize in minutes.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Template Cards */}
              {[
                { name: "Barbershop", icon: "icon-customization", color: "cyan", link: "/demo-barbershop" },
                { name: "Salon & Spa", icon: "icon-calendar", color: "purple", link: "/demo-salon" },
                { name: "Restaurant", icon: "icon-booking-link", color: "pink", link: "/demo-restaurant" },
                { name: "Healthcare", icon: "icon-support", color: "cyan", link: "/demo-dental" },
                { name: "Real Estate", icon: "icon-analytics", color: "purple", link: "/demo-real-estate" },
                { name: "Fitness", icon: "icon-leads", color: "pink", link: "/demo-fitness" },
              ].map((template, i) => (
                <Link 
                  key={i} 
                  href={template.link}
                  className={`group p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-${template.color}-500/50 transition-all hover:bg-white/10 cursor-pointer`}
                  data-testid={`link-template-${template.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${template.color}-500/20 to-${template.color}-600/20 border border-${template.color}-500/30 flex items-center justify-center`}>
                      <img src={`/landing/assets/icons/${template.icon}.png`} alt="" className="w-6 h-6 opacity-80" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{template.name}</h3>
                      <p className="text-sm text-white/50">Try interactive demo</p>
                    </div>
                    <svg className="w-5 h-5 ml-auto text-white/30 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="px-6 py-24 relative">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-white/60 text-center mb-16 max-w-2xl mx-auto">
              No hidden fees. Cancel anytime.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Starter Plan */}
              <div className="relative p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-500/30 transition-all">
                <h3 className="text-2xl font-semibold mb-2">Starter</h3>
                <p className="text-white/50 text-sm mb-6">Perfect for small businesses</p>
                <div className="text-5xl font-bold mb-6">
                  $29<span className="text-lg font-normal text-white/50">/mo</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {["1 AI Assistant", "500 conversations/mo", "Basic analytics", "Email support", "Standard templates"].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/70">
                      <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="#book"
                  onClick={(e) => scrollToSection(e, "book")}
                  className="block w-full text-center py-4 rounded-full border border-cyan-500/50 text-cyan-400 font-semibold hover:bg-cyan-500/10 transition-all"
                  data-testid="button-starter-plan"
                >
                  Get Started
                </a>
              </div>
              
              {/* Pro Plan */}
              <div className="relative p-8 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 hover:border-purple-400/50 transition-all">
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-3xl">
                  POPULAR
                </div>
                <h3 className="text-2xl font-semibold mb-2">Pro</h3>
                <p className="text-white/50 text-sm mb-6">For growing businesses</p>
                <div className="text-5xl font-bold mb-6">
                  $79<span className="text-lg font-normal text-white/50">/mo</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {["3 AI Assistants", "Unlimited conversations", "Advanced analytics", "Priority support", "Custom branding", "API access"].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/70">
                      <svg className="w-5 h-5 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="#book"
                  onClick={(e) => scrollToSection(e, "book")}
                  className="block w-full text-center py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                  data-testid="button-pro-plan"
                >
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Book Demo Section */}
        <section id="book" className="px-6 py-24 relative">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
              Book Your Demo
            </h2>
            <p className="text-white/60 text-center mb-12 max-w-xl mx-auto">
              See how Treasure Coast AI can transform your customer experience. Schedule a personalized demo today.
            </p>
            
            <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10">
              {formSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">Thank You!</h3>
                  <p className="text-white/60">We'll be in touch within 24 hours to schedule your demo.</p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Your Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
                        placeholder="John Smith"
                        required
                        data-testid="input-name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
                        placeholder="john@company.com"
                        required
                        data-testid="input-email"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Business Type</label>
                    <input
                      type="text"
                      value={formData.business}
                      onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
                      placeholder="e.g. Barbershop, Restaurant, Salon..."
                      data-testid="input-business"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Tell us about your needs</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors resize-none"
                      placeholder="What challenges are you looking to solve?"
                      data-testid="input-message"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 text-white font-semibold text-lg shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all hover:scale-[1.02]"
                    data-testid="button-submit-demo"
                  >
                    Request Demo
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-12 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <span className="font-semibold">TREASURE COAST AI</span>
            </div>
            <p className="text-white/40 text-sm">
              © 2025 Treasure Coast AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-white/50">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function WidgetPreviewPoster() {
  const frame = "/landing/assets/widget/widget-frame.png";
  const bubbleL = "/landing/assets/widget/message-bubble-left.png";
  const bubbleR = "/landing/assets/widget/message-bubble-right.png";
  const input = "/landing/assets/widget/input-bar.png";
  const pill = "/landing/assets/widget/status-pill.png";

  useEffect(() => { console.log("WidgetPreviewPoster mounted"); }, []);

  return (
    <div className="relative mx-auto w-[min(380px,90vw)] aspect-[2/3] z-10">
      <div className="absolute left-3 top-3 z-[9999] rounded-full bg-lime-400 px-3 py-1 text-xs font-black text-black">
        WIDGET_POSTER_ACTIVE
      </div>
      <div className="absolute -inset-10 rounded-[48px] bg-cyan-400/10 blur-3xl" />
      <div className="absolute -inset-10 rounded-[48px] bg-fuchsia-500/10 blur-3xl" />

      <img
        src={frame}
        alt="Widget frame"
        className="absolute inset-0 h-full w-full select-none pointer-events-none drop-shadow-[0_28px_70px_rgba(0,0,0,0.55)]"
        draggable={false}
      />

      <div className="absolute inset-[7%] flex flex-col">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-400/30 to-fuchsia-500/25 border border-white/15 shadow-[0_0_22px_rgba(0,255,255,0.18)]" />
          <div className="leading-tight">
            <div className="font-extrabold tracking-wide text-white/90">TREASURE COAST AI</div>
            <div className="text-sm text-white/55">Your Business, Upgraded</div>
          </div>
        </div>

        <div className="mt-5 flex-1 space-y-4">
          <Bubble img={bubbleL}>Welcome! How can I help you today?</Bubble>
          <Bubble img={bubbleR} align="right">I'd like to book an appointment</Bubble>
          <Bubble img={bubbleL}>Perfect! I can help with that. When works best for you?</Bubble>

          <div className="mt-2 flex gap-2 flex-wrap">
            <QuickPill label="Book Now" />
            <QuickPill label="View Services" />
            <QuickPill label="Hours" />
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <StatusPill img={pill} label="Lead Captured" />
            <StatusPill img={pill} label="Booking Link Sent" />
            <StatusPill img={pill} label="Follow-Up Automated" />
          </div>
        </div>

        <div className="relative mt-4">
          <img
            src={input}
            alt="Input bar"
            className="w-full select-none pointer-events-none opacity-95"
            draggable={false}
          />
          <div className="absolute inset-0 flex items-center px-5 text-white/35 font-semibold">Ask anything...</div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-2xl bg-cyan-400/25 border border-white/15 shadow-[0_0_18px_rgba(0,255,255,0.18)]" />
        </div>
      </div>
    </div>
  );
}

function Bubble({ img, align, children }: { img: string; align?: "right"; children: React.ReactNode }) {
  return (
    <div className={align === "right" ? "flex justify-end" : "flex justify-start"}>
      <div
        className="relative w-[88%] max-w-[420px] px-5 py-4 text-white/85 font-medium leading-snug"
        style={{
          backgroundImage: `url('${img}')`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function QuickPill({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="rounded-full px-4 py-2 text-sm font-extrabold border border-white/12 bg-white/5 backdrop-blur-xl text-white/80 shadow-[0_0_18px_rgba(140,80,255,0.12),inset_0_1px_0_rgba(255,255,255,0.10)] hover:bg-white/10 transition"
    >
      {label}
    </button>
  );
}

function StatusPill({ img, label }: { img: string; label: string }) {
  return (
    <div
      className="px-3 py-1.5 text-xs font-extrabold text-white/75"
      style={{
        backgroundImage: `url('${img}')`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
      }}
    >
      {label}
    </div>
  );
}
