import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Send, 
  Building2, 
  Scissors, 
  Home, 
  Car, 
  Dumbbell, 
  Heart,
  Phone,
  Mail,
  Globe,
  Clock,
  MapPin,
  Star,
  MessageCircle,
  X,
  ChevronDown,
  Utensils,
  Sparkles,
  Users,
  CheckCircle2,
  Calendar,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatAssistant, Message } from "@/hooks/useChatAssistant";

interface BotConfig {
  botId: string;
  clientId: string;
  name: string;
  description?: string;
  businessProfile?: {
    businessName?: string;
    type?: string;
    location?: string;
    phone?: string;
    email?: string;
    website?: string;
    hours?: Record<string, string>;
    services?: string[];
    amenities?: string[];
  };
  faqs?: Array<{ question: string; answer: string }>;
  isDemo?: boolean;
}

// Message interface is imported from useChatAssistant hook

const businessTypeIcons: Record<string, React.ReactNode> = {
  sober_living: <Heart className="h-6 w-6" />,
  restaurant: <Utensils className="h-6 w-6" />,
  barber_salon: <Scissors className="h-6 w-6" />,
  barber: <Scissors className="h-6 w-6" />,
  home_services: <Home className="h-6 w-6" />,
  auto_shop: <Car className="h-6 w-6" />,
  gym: <Dumbbell className="h-6 w-6" />,
  gym_fitness: <Dumbbell className="h-6 w-6" />,
  med_spa: <Sparkles className="h-6 w-6" />,
  real_estate: <Building2 className="h-6 w-6" />,
  tattoo: <Heart className="h-6 w-6" />,
};

const businessTypeColors: Record<string, { primary: string; accent: string; gradient: string }> = {
  sober_living: { primary: "from-teal-600 to-cyan-600", accent: "bg-teal-500", gradient: "from-teal-900/90 to-cyan-900/90" },
  restaurant: { primary: "from-orange-600 to-red-600", accent: "bg-orange-500", gradient: "from-orange-900/90 to-red-900/90" },
  barber_salon: { primary: "from-slate-700 to-zinc-800", accent: "bg-amber-500", gradient: "from-slate-900/90 to-zinc-900/90" },
  barber: { primary: "from-slate-700 to-zinc-800", accent: "bg-amber-500", gradient: "from-slate-900/90 to-zinc-900/90" },
  home_services: { primary: "from-blue-600 to-indigo-600", accent: "bg-blue-500", gradient: "from-blue-900/90 to-indigo-900/90" },
  auto_shop: { primary: "from-red-600 to-orange-600", accent: "bg-red-500", gradient: "from-red-900/90 to-orange-900/90" },
  gym: { primary: "from-green-600 to-emerald-600", accent: "bg-green-500", gradient: "from-green-900/90 to-emerald-900/90" },
  gym_fitness: { primary: "from-green-600 to-emerald-600", accent: "bg-green-500", gradient: "from-green-900/90 to-emerald-900/90" },
  med_spa: { primary: "from-pink-500 to-purple-600", accent: "bg-pink-500", gradient: "from-pink-900/90 to-purple-900/90" },
  real_estate: { primary: "from-sky-600 to-blue-700", accent: "bg-sky-500", gradient: "from-sky-900/90 to-blue-900/90" },
  tattoo: { primary: "from-purple-700 to-pink-700", accent: "bg-purple-500", gradient: "from-purple-900/90 to-pink-900/90" },
};

const businessTypeTaglines: Record<string, string> = {
  sober_living: "Your Journey to Recovery Starts Here",
  restaurant: "Delicious Food, Unforgettable Experience",
  barber_salon: "Where Style Meets Precision",
  barber: "Where Style Meets Precision",
  home_services: "Professional Home Solutions You Can Trust",
  auto_shop: "Expert Auto Care for Your Vehicle",
  gym: "Transform Your Body, Transform Your Life",
  gym_fitness: "Transform Your Body, Transform Your Life",
  med_spa: "Rejuvenate Your Body and Mind",
  real_estate: "Find Your Dream Home Today",
  tattoo: "Your Vision, Our Artistry",
};

const businessTypeFeatures: Record<string, string[]> = {
  sober_living: ["24/7 Support Staff", "Structured Programs", "Safe Environment", "Community Living"],
  restaurant: ["Fresh Ingredients", "Expert Chefs", "Cozy Atmosphere", "Online Ordering"],
  barber_salon: ["Expert Stylists", "Premium Products", "Walk-ins Welcome", "Online Booking"],
  barber: ["Expert Stylists", "Premium Products", "Walk-ins Welcome", "Online Booking"],
  home_services: ["Licensed & Insured", "Free Estimates", "Quality Guaranteed", "Same-Day Service"],
  auto_shop: ["ASE Certified", "All Makes & Models", "Fair Pricing", "Warranty Included"],
  gym: ["State-of-Art Equipment", "Personal Training", "Group Classes", "Flexible Hours"],
  gym_fitness: ["State-of-Art Equipment", "Personal Training", "Group Classes", "Flexible Hours"],
  med_spa: ["Board Certified", "Latest Technology", "Custom Treatments", "Relaxing Environment"],
  real_estate: ["Local Expertise", "Virtual Tours", "Personalized Service", "Market Analysis"],
  tattoo: ["Custom Designs", "Sterile Environment", "Experienced Artists", "Aftercare Support"],
};

// Industry-specific booking button labels
const businessTypeBookingLabels: Record<string, string> = {
  sober_living: "Book a Tour",
  restaurant: "Make a Reservation",
  barber_salon: "Book Appointment",
  barber: "Book Appointment",
  home_services: "Schedule Service",
  auto_shop: "Schedule Service",
  gym: "Book a Tour",
  gym_fitness: "Book a Tour",
  med_spa: "Book Consultation",
  real_estate: "Schedule Viewing",
  tattoo: "Book Consultation",
};

/**
 * FloatingChatWidget - Uses the shared useChatAssistant hook
 * 
 * This ensures consistent behavior across all chat surfaces:
 * - booking button display
 * - lead capture
 * - analytics tracking
 */
function FloatingChatWidget({ botConfig }: { botConfig: BotConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingDismissed, setGreetingDismissed] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Safe fallbacks for optional businessProfile fields
  const bp = botConfig.businessProfile || {};
  const businessType = bp.type || 'generic';
  const businessName = bp.businessName || botConfig.name || 'Our Business';
  const colors = businessTypeColors[businessType] || businessTypeColors.restaurant;

  const initialGreeting = `Hi! Welcome to ${businessName}. I'm here to help answer your questions. What can I help you with today?`;

  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    handleBookingClick 
  } = useChatAssistant({
    clientId: botConfig.clientId,
    botId: botConfig.botId,
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
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter allows line breaks naturally
  };

  return (
    <div className="fixed bottom-4 right-4 z-50" data-testid="floating-chat-widget">
      {/* Chat Window */}
      {isOpen && (
        <div 
          className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300"
          data-testid="chat-window"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${colors.primary} p-4 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  {businessTypeIcons[businessType] || <MessageCircle className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-semibold text-sm">{businessName}</p>
                  <p className="text-xs text-white/80">Virtual Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                data-testid="button-close-chat"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="h-72 p-4">
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
                      "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                      message.role === "user"
                        ? `bg-gradient-to-r ${colors.primary} text-white`
                        : "bg-gray-100 text-gray-800"
                    )}
                  >
                    {message.content}
                  </div>
                  
                  {/* Booking Button - Show when assistant message has booking URL */}
                  {message.role === "assistant" && message.bookingUrl && (
                    <button
                      onClick={() => handleBookingClick(message.bookingUrl!)}
                      className={cn(
                        "mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 shadow-lg cursor-pointer",
                        `bg-gradient-to-r ${colors.primary}`
                      )}
                      data-testid={`button-book-appointment-${index}`}
                    >
                      <Calendar className="h-4 w-4" />
                      {message.bookingType === 'call' 
                        ? "Schedule a Phone Call"
                        : message.bookingType === 'tour'
                          ? "Book a Tour"
                          : (businessTypeBookingLabels[businessType] || "Book Appointment")}
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm">
                    <span className="inline-flex gap-1">
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
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <div className="flex gap-2">
              <Input
                data-testid="widget-input-message"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send)"
                disabled={isLoading}
                className="flex-1 rounded-full border-gray-200 focus:border-gray-300 text-sm"
              />
              <Button
                data-testid="widget-button-send"
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className={`rounded-full bg-gradient-to-r ${colors.primary} hover:opacity-90`}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[10px] text-gray-400">
                Powered by Treasure Coast AI
              </p>
              <button
                onClick={() => window.open('mailto:support@treasurecoastai.com?subject=Human%20Support%20Request', '_blank')}
                className="text-[10px] text-blue-500 hover:text-blue-600 flex items-center gap-1"
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
          className="absolute bottom-16 right-0 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 animate-in slide-in-from-bottom-4 fade-in duration-300"
          data-testid="proactive-greeting"
        >
          <button 
            onClick={dismissGreeting}
            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full text-gray-400"
            data-testid="button-dismiss-greeting"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r ${colors.primary}`}>
              {businessTypeIcons[businessType] || <MessageCircle className="h-5 w-5 text-white" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Hi there!</p>
              <p className="text-xs text-gray-600 mt-1">
                Have questions about {businessName}? I'm here to help!
              </p>
              <Button 
                size="sm" 
                onClick={handleOpenChat}
                className={`mt-3 w-full bg-gradient-to-r ${colors.primary} hover:opacity-90 text-white text-xs`}
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
          `bg-gradient-to-r ${colors.primary} text-white`,
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

export default function DemoBotPage() {
  const params = useParams<{ botId: string }>();
  const botId = params.botId;

  const { data: botConfig, isLoading: isBotLoading, error } = useQuery<BotConfig>({
    queryKey: ['/api/demo', botId],
  });

  if (isBotLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-96 bg-gray-200 animate-pulse" />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !botConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Bot Not Found</h2>
          <p className="text-gray-600 mb-6">
            The requested demo bot could not be found.
          </p>
          <Link href="/demos">
            <Button data-testid="button-back-to-demos" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Demos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Safe fallbacks for optional businessProfile fields
  const bp = botConfig.businessProfile || {};
  const businessType = bp.type || 'generic';
  const businessName = bp.businessName || botConfig.name || 'Our Business';
  const colors = businessTypeColors[businessType] || businessTypeColors.restaurant;
  const tagline = businessTypeTaglines[businessType] || "Welcome to Our Business";
  const features = businessTypeFeatures[businessType] || ["Quality Service", "Expert Team", "Customer First", "Best Prices"];
  const hasHours = bp.hours && Object.keys(bp.hours).length > 0;

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-cyan-900/30 via-[#0A0A0F] to-purple-900/30 text-white py-3 px-4 text-center text-sm border-b border-white/5 premium-blur">
        <div className="flex items-center justify-center gap-4">
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 neon-pulse">DEMO</Badge>
          <span className="text-white/80">This is a demo landing page for <span className="text-cyan-400 font-medium">{businessName}</span></span>
          <Link href="/demos">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-cyan-400 transition-colors" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-1" />
              All Demos
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className={`relative bg-gradient-to-br from-[#0A0A0F] via-[#0F1520] to-[#0A0A0F] text-white overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
        <div className="absolute inset-0 cyber-grid opacity-20" />
        
        {/* Animated glow orbs */}
        <div className="glow-orb glow-orb-cyan w-[400px] h-[400px] top-0 left-0" style={{ animationDelay: '0s' }} />
        <div className="glow-orb glow-orb-purple w-[300px] h-[300px] bottom-0 right-0" style={{ animationDelay: '2s' }} />
        
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 glass-card-glow rounded-full px-5 py-2.5 mb-6 border border-cyan-500/20">
                <div className="text-cyan-400">
                  {businessTypeIcons[businessType] || <Building2 className="h-5 w-5" />}
                </div>
                <span className="text-sm font-medium capitalize text-white/90">{businessType.replace(/_/g, ' ')}</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 slide-in-bottom" data-testid="hero-title">
                <span className="text-glow-gradient">{businessName}</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/70 mb-8" data-testid="hero-tagline">
                {tagline}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button size="lg" className="btn-gradient-primary glow-cyan-strong font-semibold" data-testid="button-contact">
                  <Phone className="h-5 w-5 mr-2" />
                  Contact Us
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:border-cyan-500/40 transition-all" data-testid="button-learn-more">
                  Learn More
                </Button>
              </div>
            </div>
            
            <div className="flex-1 hidden md:flex justify-center">
              <div className="w-64 h-64 glass-card-glow rounded-3xl flex items-center justify-center border border-cyan-500/20 breathe-glow">
                <div className="w-32 h-32 text-cyan-400">
                  {businessTypeIcons[businessType] || <Building2 className="w-full h-full" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-[#0A0A0F]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Why Choose Us</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass-card-glow rounded-2xl p-6 text-center card-tilt"
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
      {bp.services && bp.services.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-[#0A0A0F] to-[#0F1520]">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-white mb-4">Our Services</h2>
            <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
              We offer a wide range of services to meet your needs
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              {bp.services.slice(0, 6).map((service, index) => (
                <div 
                  key={index}
                  className="glass-card-glow rounded-2xl p-6 card-tilt border border-white/5"
                  data-testid={`service-${index}`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center mb-4 border border-cyan-500/20">
                    <Star className="h-5 w-5 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{service}</h3>
                  <p className="text-sm text-white/60">
                    Professional {service.toLowerCase()} services tailored to your needs.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-16 bg-[#0A0A0F]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Get In Touch</h2>
              <p className="text-white/60 mb-8">
                Have questions? We'd love to hear from you. Reach out to us and we'll respond as soon as we can.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 glass-card-glow p-4 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-500/20">
                    <Phone className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white/50">Phone</p>
                    <p className="font-semibold text-white" data-testid="contact-phone">{bp.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 glass-card-glow p-4 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-500/20">
                    <Mail className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white/50">Email</p>
                    <p className="font-semibold text-white" data-testid="contact-email">{bp.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 glass-card-glow p-4 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-500/20">
                    <MapPin className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white/50">Location</p>
                    <p className="font-semibold text-white" data-testid="contact-location">{bp.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 glass-card-glow p-4 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-500/20">
                    <Globe className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white/50">Website</p>
                    <p className="font-semibold text-white" data-testid="contact-website">{bp.website}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Business Hours</h3>
              <div className="glass-card-glow rounded-2xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Clock className="h-5 w-5 text-cyan-400 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    {hasHours ? (
                      Object.entries(bp.hours!).map(([day, hours]) => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="text-white/60 capitalize">{day}</span>
                          <span className="font-medium text-white">{hours}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-white/60 text-sm">Contact us for hours of operation</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-6 bg-gradient-to-br from-cyan-500/10 via-[#0F1520] to-purple-500/10 rounded-2xl border border-cyan-500/20 neon-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <MessageCircle className="h-6 w-6 text-cyan-400" />
                  <h4 className="font-semibold text-white">Need Quick Answers?</h4>
                </div>
                <p className="text-sm text-white/70 mb-4">
                  Chat with our AI assistant 24/7 for instant responses to your questions.
                </p>
                <p className="text-xs text-white/50">
                  Click the chat button in the bottom right corner to get started!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Get This For Your Business CTA Section */}
      <section className="py-16 bg-gradient-to-br from-[#0A0A0F] via-cyan-900/20 to-[#0A0A0F] border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-4 py-1" data-testid="badge-cta">
            Ready to Get Started?
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" data-testid="text-cta-title">
            Want This For{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Your Business?
            </span>
          </h2>
          <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
            We'll build and manage a custom AI assistant just like this one for your business. 
            Capture leads, book appointments, and answer customer questions 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#contact">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-8 py-6 text-lg gap-2 shadow-lg shadow-cyan-500/25 glow-cyan-strong"
                data-testid="button-get-this-for-business"
              >
                <Sparkles className="h-5 w-5" />
                Get This For My Business
              </Button>
            </Link>
            <Link href="/demos">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg gap-2"
                data-testid="button-see-more-demos"
              >
                See More Demos
              </Button>
            </Link>
          </div>
          <p className="text-sm text-white/40 mt-6">
            No tech skills required — we handle everything for you.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {businessTypeIcons[businessType] || <Building2 className="h-5 w-5" />}
              <span className="font-semibold">{businessName}</span>
            </div>
            <p className="text-sm text-gray-400">
              © 2024 {businessName}. All rights reserved. | Demo powered by Treasure Coast AI
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Chat Widget - Uses unified useChatAssistant hook */}
      <FloatingChatWidget botConfig={botConfig} />
    </div>
  );
}
