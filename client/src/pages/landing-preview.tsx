import bgImage from "@assets/47B289FC-AAF6-4D8F-87ED-62D154B4A2DF_1767530630754.png";
import phoneImage from "@assets/80C6108A-A430-49A8-A44D-F78715AF6CB4_1767530168873.png";

export default function LandingPreview() {
  return (
    <div className="min-h-screen bg-[#05060a] text-white font-sans relative overflow-x-hidden">
      
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      
      {/* Dark Overlay for Readability */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-black/50 via-transparent to-black/60" />
      
      {/* Neon Wave SVG */}
      <svg
        className="fixed left-0 right-0 bottom-[5%] w-full h-[200px] z-[5] pointer-events-none"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="neonGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(57,213,255,0.6)" />
            <stop offset="50%" stopColor="rgba(255,79,216,0.5)" />
            <stop offset="100%" stopColor="rgba(255,122,61,0.4)" />
          </linearGradient>
          <linearGradient id="neonGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,79,216,0.5)" />
            <stop offset="50%" stopColor="rgba(57,213,255,0.6)" />
            <stop offset="100%" stopColor="rgba(49,247,165,0.4)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M0,120 Q360,60 720,100 T1440,80"
          fill="none"
          stroke="url(#neonGrad1)"
          strokeWidth="3"
          filter="url(#glow)"
          opacity="0.7"
        />
        <path
          d="M0,150 Q400,100 800,140 T1440,120"
          fill="none"
          stroke="url(#neonGrad2)"
          strokeWidth="4"
          filter="url(#glow)"
          opacity="0.6"
        />
      </svg>

      {/* Main Content */}
      <div className="relative z-10">
        
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3" data-testid="link-logo">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xl font-bold tracking-wide">TREASURE COAST AI</span>
            </a>
            
            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {/* Products Dropdown */}
              <div className="relative group">
                <button className="text-white/80 hover:text-white transition-colors flex items-center gap-1" data-testid="link-products">
                  Products
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:rotate-180">
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="w-56 p-3 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/30">
                    <a href="#ai-chatbot" className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-testid="link-ai-chatbot">
                      <div className="font-medium text-white">AI Chatbot</div>
                      <div className="text-sm text-white/60">24/7 customer support</div>
                    </a>
                    <a href="#booking" className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-testid="link-booking">
                      <div className="font-medium text-white">Booking System</div>
                      <div className="text-sm text-white/60">Instant appointment links</div>
                    </a>
                    <a href="#lead-capture" className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-testid="link-lead-capture">
                      <div className="font-medium text-white">Lead Capture</div>
                      <div className="text-sm text-white/60">Convert more visitors</div>
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Templates Dropdown */}
              <div className="relative group">
                <button className="text-white/80 hover:text-white transition-colors flex items-center gap-1" data-testid="link-templates-nav">
                  Templates
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:rotate-180">
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="w-56 p-3 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/30">
                    <a href="#restaurant" className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-testid="link-restaurant">
                      <div className="font-medium text-white">Restaurant</div>
                      <div className="text-sm text-white/60">Menus & reservations</div>
                    </a>
                    <a href="#salon" className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-testid="link-salon">
                      <div className="font-medium text-white">Salon & Spa</div>
                      <div className="text-sm text-white/60">Appointment booking</div>
                    </a>
                    <a href="#medical" className="block px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-testid="link-medical">
                      <div className="font-medium text-white">Healthcare</div>
                      <div className="text-sm text-white/60">Patient scheduling</div>
                    </a>
                  </div>
                </div>
              </div>
              
              <a href="#pricing" className="text-white/80 hover:text-white transition-colors" data-testid="link-pricing">
                Pricing
              </a>
            </div>
            
            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <a href="/login" className="hidden md:block text-white/80 hover:text-white transition-colors" data-testid="link-login">
                Login
              </a>
              <a
                href="#get-started"
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/30 transition-all hover:scale-105"
                data-testid="button-get-started-nav"
              >
                Get Started
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center px-6 pt-24 pb-12">
          <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column - Text */}
            <div className="max-w-xl">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6">
                Your Business,<br />
                <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">Upgraded.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/70 mb-8 leading-relaxed">
                24/7 AI Assistant Boosting Sales & Leads
              </p>
              
              {/* CTA Button */}
              <a
                href="#get-started"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 text-white font-semibold text-lg shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all hover:scale-105 border border-cyan-400/50"
                data-testid="button-get-started-hero"
              >
                Get Started
              </a>
            </div>
            
            {/* Right Column - Phone Mockup */}
            <div className="flex justify-center lg:justify-end">
              <img
                src={phoneImage}
                alt="AI Assistant App"
                className="max-w-[320px] md:max-w-[380px] h-auto drop-shadow-2xl animate-float"
                data-testid="img-phone-mockup"
              />
            </div>
          </div>
        </section>

        {/* Feature Pills Section */}
        <section className="px-6 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* 24/7 AI Chatbot */}
              <div className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 transition-all hover:bg-white/10">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-cyan-400">
                      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">24/7 AI Chatbot</h3>
                    <p className="text-sm text-white/60">Answer customers instantly, 24/7</p>
                  </div>
                </div>
              </div>
              
              {/* Instant Booking Links */}
              <div className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-500/50 transition-all hover:bg-white/10">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-purple-400">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Instant Booking Links</h3>
                    <p className="text-sm text-white/60">Send them direct to calendar invites</p>
                  </div>
                </div>
              </div>
              
              {/* Boosted Leads & Sales */}
              <div className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-pink-500/50 transition-all hover:bg-white/10">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-500/20 border border-pink-500/30 flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-pink-400">
                      <path d="M18 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Boosted Leads & Sales</h3>
                    <p className="text-sm text-white/60">Convert more visitors into customers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Templates Section */}
        <section id="templates" className="px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8">
              Beautiful, High-Converting Templates
            </h2>
            
            <a
              href="#get-started"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white font-semibold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all hover:scale-105"
              data-testid="button-get-started-templates"
            >
              Get Started
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Starter Plan */}
              <div className="relative p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 transition-all">
                <h3 className="text-xl font-semibold mb-2">Starter Plan</h3>
                <p className="text-white/60 text-sm mb-4">Starts at</p>
                <div className="text-4xl font-bold mb-6">
                  $29<span className="text-lg font-normal text-white/60">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-white/80">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-cyan-400">
                      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    1 AI Assistant
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-cyan-400">
                      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    500 conversations/mo
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-cyan-400">
                      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Basic analytics
                  </li>
                </ul>
                <a
                  href="#get-started"
                  className="block w-full text-center py-3 rounded-full border border-cyan-500/50 text-cyan-400 font-semibold hover:bg-cyan-500/10 transition-all"
                  data-testid="button-starter-plan"
                >
                  Get Started
                </a>
              </div>
              
              {/* Pro Plan */}
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 hover:border-purple-400/50 transition-all">
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                  POPULAR
                </div>
                <h3 className="text-xl font-semibold mb-2">Pro</h3>
                <p className="text-white/60 text-sm mb-4">Starts at</p>
                <div className="text-4xl font-bold mb-6">
                  $79<span className="text-lg font-normal text-white/60">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-white/80">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-purple-400">
                      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    3 AI Assistants
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-purple-400">
                      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Unlimited conversations
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-purple-400">
                      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Advanced analytics
                  </li>
                </ul>
                <a
                  href="#get-started"
                  className="block w-full text-center py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                  data-testid="button-pro-plan"
                >
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-12 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-semibold">TREASURE COAST AI</span>
            </div>
            <p className="text-white/50 text-sm">
              © 2025 Treasure Coast AI. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
