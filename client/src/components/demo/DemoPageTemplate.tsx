import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Send, 
  Phone,
  Mail,
  Globe,
  Clock,
  MapPin,
  Star,
  MessageCircle,
  X,
  ChevronDown,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Users,
  Zap,
  Shield,
  TrendingUp,
  Bot,
  Sparkles,
  Award,
  Heart,
  Quote,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatAssistant, Message } from "@/hooks/useChatAssistant";

// Types
export interface BusinessInfo {
  name: string;
  tagline: string;
  description: string;
  type: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  hours: Record<string, string>;
}

export interface ServiceItem {
  name: string;
  description: string;
  price?: string;
  duration?: string;
  popular?: boolean;
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  specialty?: string;
}

export interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
}

export interface AIBenefit {
  title: string;
  description: string;
  icon: React.ReactNode;
  stat?: string;
}

export interface DemoPageConfig {
  business: BusinessInfo;
  heroImage?: string;
  icon: React.ReactNode;
  colors: {
    primary: string;
    accent: string;
    gradient: string;
  };
  features: string[];
  services: ServiceItem[];
  team: TeamMember[];
  testimonials: Testimonial[];
  aiBenefits: AIBenefit[];
  nicheStats: {
    label: string;
    value: string;
    description: string;
  }[];
  faqs: { question: string; answer: string }[];
  bookingLabel: string;
  ctaText: string;
  clientId: string;
  botId: string;
}

// Floating Chat Widget Component
function FloatingChatWidget({ config }: { config: DemoPageConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingDismissed, setGreetingDismissed] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate welcome message with services list
  const servicesList = config.services
    .slice(0, 6)
    .map(s => `• ${s.name} - ${s.price}`)
    .join('\n');
  
  const initialGreeting = `Welcome to ${config.business.name}! Here are our services:\n\n${servicesList}\n\nWhich service would you like to book?`;

  const { 
    messages, 
    isLoading, 
    sendMessage, 
    handleBookingClick,
    resetChat 
  } = useChatAssistant({
    clientId: config.clientId,
    botId: config.botId,
    source: "demo_page",
    initialGreeting,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen && !greetingDismissed) {
        setShowGreeting(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isOpen, greetingDismissed]);

  const handleOpenChat = () => {
    setIsOpen(true);
    setShowGreeting(false);
    setGreetingDismissed(true);
  };

  const dismissGreeting = () => {
    setShowGreeting(false);
    setGreetingDismissed(true);
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue.trim());
      setInputValue("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50" data-testid="floating-chat-widget">
      {/* Chat Window */}
      {isOpen && (
        <div 
          className="absolute bottom-16 right-0 w-80 sm:w-96 bg-[#0A0A0F] rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300"
          data-testid="chat-window"
        >
          {/* Header - Dark with icon container */}
          <div className="bg-[#12151A] p-4 text-white border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-700/80 rounded-xl flex items-center justify-center">
                  {config.icon}
                </div>
                <p className="font-semibold text-base">{config.business.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={resetChat}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                  data-testid="button-reset-chat"
                  aria-label="Reset chat"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                  data-testid="button-close-chat"
                  aria-label="Close chat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Status Bar - Online & Secured by TCAI */}
          <div className="bg-[#0B0E13] px-4 py-2 flex items-center justify-center gap-2 border-b border-white/5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-white/70">Online</span>
            <span className="text-xs text-white/30">•</span>
            <span className="text-xs text-white/70">Secured by TCAI</span>
          </div>

          {/* Messages */}
          <ScrollArea className="h-64 p-4 bg-[#0B0E13]">
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex flex-col",
                    message.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    data-testid={`widget-message-${message.role}-${index}`}
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                      message.role === "user"
                        ? "bg-white/10 text-white border border-white/10"
                        : "bg-[#1A1D24] text-white/90 border border-white/5"
                    )}
                  >
                    {message.content}
                  </div>
                  
                  {/* Booking Button */}
                  {message.role === "assistant" && message.bookingUrl && (
                    <button
                      onClick={() => handleBookingClick(message.bookingUrl!)}
                      className={cn(
                        "mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 shadow-lg cursor-pointer",
                        `bg-gradient-to-r ${config.colors.primary}`
                      )}
                      data-testid="button-book-appointment"
                    >
                      <Calendar className="h-4 w-4" />
                      {message.bookingMode === 'external' && message.bookingProviderName
                        ? `Continue to book on ${message.bookingProviderName}`
                        : config.bookingLabel}
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#1A1D24] rounded-2xl px-4 py-3 text-sm border border-white/5">
                    <span className="inline-flex gap-1 text-cyan-400">
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>.</span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-white/10 bg-[#0A0A0F]">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                data-testid="widget-input-message"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 rounded-full bg-[#1A1D24] border-white/10 focus:border-cyan-500/50 text-sm text-white placeholder:text-white/40"
              />
              <Button
                data-testid="widget-button-send"
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[10px] text-white/40">
                Powered by <span className="text-cyan-400">Treasure Coast AI</span>
              </p>
              <button
                onClick={() => window.open('mailto:support@treasurecoastai.com?subject=Human%20Support%20Request', '_blank')}
                className="text-[10px] text-white/50 hover:text-white/70 flex items-center gap-1"
                data-testid="button-talk-to-human"
              >
                <Users className="h-3 w-3" />
                Talk to a person
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proactive Greeting Bubble */}
      {showGreeting && !isOpen && (
        <div 
          className="absolute bottom-16 right-0 w-72 bg-[#0B0E13] rounded-2xl shadow-xl border border-white/10 p-4 animate-in slide-in-from-bottom-4 fade-in duration-300"
          data-testid="proactive-greeting"
        >
          <button 
            onClick={dismissGreeting}
            className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-full text-white/40"
            data-testid="button-dismiss-greeting"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-700/80 text-white">
              {config.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Hi there!</p>
              <p className="text-xs text-white/60 mt-1">
                Have questions about {config.business.name}? I'm here to help!
              </p>
              <Button 
                size="sm" 
                onClick={handleOpenChat}
                className="mt-3 w-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs"
                data-testid="button-greeting-chat"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Start Chat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            handleOpenChat();
          }
        }}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105",
          `bg-gradient-to-r ${config.colors.primary} text-white`,
          "glow-cyan-strong",
          showGreeting && !isOpen && "animate-bounce"
        )}
        data-testid="button-toggle-chat"
        aria-label={isOpen ? "Minimize chat" : "Open chat"}
      >
        {isOpen ? (
          <ChevronDown className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}

// Main Demo Page Template
export default function DemoPageTemplate({ config }: { config: DemoPageConfig }) {
  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-cyan-900/30 via-[#0A0A0F] to-purple-900/30 text-white py-3 px-4 text-center text-sm border-b border-white/5 sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">DEMO</Badge>
          <span className="text-white/80">Experience the AI assistant for <span className="text-cyan-400 font-medium">{config.business.name}</span></span>
          <Link href="/demos">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-cyan-400 transition-colors" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-1" />
              All Demos
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0A0A0F] via-[#0F1520] to-[#0A0A0F] text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
        <div className="absolute inset-0 cyber-grid opacity-20" />
        
        {/* Animated glow orbs */}
        <div className="glow-orb glow-orb-cyan w-[400px] h-[400px] top-0 left-0" style={{ animationDelay: '0s' }} />
        <div className="glow-orb glow-orb-purple w-[300px] h-[300px] bottom-0 right-0" style={{ animationDelay: '2s' }} />
        
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 glass-card-glow rounded-full px-5 py-2.5 mb-6 border border-cyan-500/20">
                <div className="text-cyan-400">
                  {config.icon}
                </div>
                <span className="text-sm font-medium capitalize text-white/90">{config.business.type.replace(/_/g, ' ')}</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4" data-testid="hero-title">
                <span className="text-glow-gradient">{config.business.name}</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/70 mb-4" data-testid="hero-tagline">
                {config.business.tagline}
              </p>
              
              <p className="text-base text-white/50 mb-8 max-w-xl">
                {config.business.description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="btn-gradient-primary glow-cyan-strong font-semibold" data-testid="button-contact">
                  <Phone className="h-5 w-5 mr-2" />
                  {config.business.phone}
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:border-cyan-500/40 transition-all" data-testid="button-book">
                  <Calendar className="h-5 w-5 mr-2" />
                  {config.bookingLabel}
                </Button>
              </div>
              
              {/* Quick Info */}
              <div className="flex flex-wrap gap-6 mt-8 justify-center lg:justify-start text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cyan-400" />
                  <span>{config.business.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span>Open Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span>5.0 Rating</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 hidden lg:flex justify-center">
              <div className="relative">
                <div className="w-72 h-72 glass-card-glow rounded-3xl flex items-center justify-center border border-cyan-500/20 breathe-glow">
                  <div className="w-36 h-36 text-cyan-400">
                    {config.icon}
                  </div>
                </div>
                {/* Floating Stats */}
                <div className="absolute -top-4 -right-4 bg-[#0B0E13] border border-white/10 rounded-xl p-3 shadow-xl">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs text-white/80">AI Powered</span>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-[#0B0E13] border border-white/10 rounded-xl p-3 shadow-xl">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-400" />
                    <span className="text-xs text-white/80">24/7 Available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Niche Stats Section */}
      <section className="py-12 bg-gradient-to-b from-[#0F1520] to-[#0A0A0F] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {config.nicheStats.map((stat, index) => (
              <div 
                key={index}
                className="glass-card-glow rounded-xl p-6 text-center border border-white/5"
                data-testid={`stat-${index}`}
              >
                <p className="text-3xl md:text-4xl font-bold text-glow-gradient mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-white/80">{stat.label}</p>
                <p className="text-xs text-white/50 mt-1">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-[#0A0A0F]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 mb-4">WHY CHOOSE US</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What Sets Us Apart</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Experience excellence with our commitment to quality, service, and customer satisfaction.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {config.features.map((feature, index) => (
              <div 
                key={index}
                className="glass-card-glow rounded-2xl p-6 text-center hover-elevate transition-all duration-300"
                data-testid={`feature-${index}`}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
                  <CheckCircle2 className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white">{feature}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gradient-to-b from-[#0A0A0F] to-[#0F1520]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 mb-4">OUR SERVICES</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What We Offer</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Comprehensive services tailored to meet your needs with excellence and care.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {config.services.slice(0, 6).map((service, index) => (
              <Card 
                key={index}
                className="glass-card-glow p-6 hover-elevate transition-all duration-300 bg-transparent border-white/10"
                data-testid={`service-${index}`}
              >
                {service.popular && (
                  <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 mb-3">POPULAR</Badge>
                )}
                <h3 className="text-lg font-semibold text-white mb-2">{service.name}</h3>
                <p className="text-white/60 text-sm mb-4">{service.description}</p>
                <div className="flex items-center justify-between text-sm">
                  {service.price && (
                    <span className="text-cyan-400 font-medium">{service.price}</span>
                  )}
                  {service.duration && (
                    <span className="text-white/40">{service.duration}</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      {config.team.length > 0 && (
        <section className="py-16 bg-[#0A0A0F]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 mb-4">OUR TEAM</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Meet Our Experts</h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Dedicated professionals committed to providing you with exceptional service.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {config.team.map((member, index) => (
                <div 
                  key={index}
                  className="glass-card-glow rounded-2xl p-6 text-center hover-elevate transition-all duration-300"
                  data-testid={`team-${index}`}
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <Users className="h-10 w-10 text-white/60" />
                  </div>
                  <h3 className="font-semibold text-white">{member.name}</h3>
                  <p className="text-cyan-400 text-sm mb-2">{member.role}</p>
                  {member.specialty && (
                    <Badge variant="outline" className="text-xs border-white/10 text-white/60 mb-2">{member.specialty}</Badge>
                  )}
                  <p className="text-white/50 text-xs">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI Benefits Section - TCAI Value Prop */}
      <section className="py-16 bg-gradient-to-b from-[#0F1520] to-[#0A0A0F] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
        <div className="glow-orb glow-orb-cyan w-[300px] h-[300px] top-0 right-0 opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border-cyan-500/30 mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              POWERED BY AI
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How <span className="text-glow-gradient">Treasure Coast AI</span> Helps {config.business.type.replace(/_/g, ' ')} Businesses
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Our AI assistant provides 24/7 customer support, captures leads, and books appointments automatically.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {config.aiBenefits.map((benefit, index) => (
              <Card 
                key={index}
                className="glass-card-glow p-6 hover-elevate transition-all duration-300 bg-transparent border-white/10 group"
                data-testid={`ai-benefit-${index}`}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4 border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-white/60 text-sm mb-3">{benefit.description}</p>
                {benefit.stat && (
                  <p className="text-cyan-400 text-sm font-medium">{benefit.stat}</p>
                )}
              </Card>
            ))}
          </div>
          
          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-white/60 mb-4">Want this AI assistant for your business?</p>
            <Link href="/">
              <Button size="lg" className="btn-gradient-primary glow-cyan-strong">
                Get Treasure Coast AI
                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {config.testimonials.length > 0 && (
        <section className="py-16 bg-[#0A0A0F]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 mb-4">TESTIMONIALS</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What Our Clients Say</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {config.testimonials.map((testimonial, index) => (
                <Card 
                  key={index}
                  className="glass-card-glow p-6 bg-transparent border-white/10"
                  data-testid={`testimonial-${index}`}
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-white/10 mb-2" />
                  <p className="text-white/80 text-sm mb-4 italic">{testimonial.content}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">{testimonial.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{testimonial.name}</p>
                      <p className="text-white/50 text-xs">{testimonial.role}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact & Hours Section */}
      <section className="py-16 bg-gradient-to-b from-[#0A0A0F] to-[#0F1520]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <Card className="glass-card-glow p-8 bg-transparent border-white/10">
              <h3 className="text-2xl font-bold text-white mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Phone</p>
                    <p className="text-white font-medium">{config.business.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Email</p>
                    <p className="text-white font-medium">{config.business.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Address</p>
                    <p className="text-white font-medium">{config.business.address}</p>
                    <p className="text-white/60 text-sm">{config.business.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Website</p>
                    <p className="text-cyan-400 font-medium">{config.business.website}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Hours */}
            <Card className="glass-card-glow p-8 bg-transparent border-white/10">
              <h3 className="text-2xl font-bold text-white mb-6">Business Hours</h3>
              <div className="space-y-3">
                {Object.entries(config.business.hours).map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-white/80 capitalize">{day}</span>
                    <span className="text-white font-medium">{hours}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#0A0A0F] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10" />
        <div className="glow-orb glow-orb-purple w-[400px] h-[400px] -bottom-40 left-1/2 -translate-x-1/2 opacity-30" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {config.ctaText}
          </h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            Try our AI assistant below or contact us to learn more about our services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="btn-gradient-primary glow-cyan-strong">
              <MessageCircle className="h-5 w-5 mr-2" />
              Chat With Us Now
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Phone className="h-5 w-5 mr-2" />
              Call {config.business.phone}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#050508] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r ${config.colors.primary}`}>
                {config.icon}
              </div>
              <span className="text-white font-semibold">{config.business.name}</span>
            </div>
            
            <p className="text-white/40 text-sm">
              Demo powered by <span className="text-cyan-400">Treasure Coast AI</span>
            </p>
            
            <div className="flex items-center gap-4">
              <Link href="/demos">
                <span className="text-white/60 hover:text-cyan-400 text-sm transition-colors cursor-pointer">View All Demos</span>
              </Link>
              <Link href="/">
                <span className="text-white/60 hover:text-cyan-400 text-sm transition-colors cursor-pointer">Get Started</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Chat Widget */}
      <FloatingChatWidget config={config} />
    </div>
  );
}
