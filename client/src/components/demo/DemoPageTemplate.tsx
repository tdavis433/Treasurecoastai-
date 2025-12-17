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
    particleRgb?: string;
    secondaryRgb?: string;
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
  heroVariant?: "default" | "premium";
  BackgroundFX?: React.ComponentType<{ primaryRgb?: string; secondaryRgb?: string }>;
}

// Quick Book state type
type QuickBookWidgetState = 
  | "SELECT_SERVICE"   // Initial: Show service buttons
  | "COLLECT_CONTACT"  // Show contact form
  | "READY_TO_BOOK"    // Show "Book Now" button
  | "DONE";            // Completed

interface QuickBookData {
  intentId: string | null;
  selectedService: { name: string; price: string; duration?: string } | null;
  contact: { name: string; phone: string; email: string } | null;
  leadId: string | null;
  providerName: string | null;
}

// Detect booking intent from user message
function hasBookingIntent(message: string): boolean {
  const bookingKeywords = [
    "book", "booking", "schedule", "appointment", "reserve", "reservation",
    "haircut", "cut", "trim", "shave", "fade", "service", "services",
    "grooming", "treatment", "massage", "facial", "wax", "manicure", "pedicure"
  ];
  const lowerMessage = message.toLowerCase();
  return bookingKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Floating Chat Widget Component
function FloatingChatWidget({ config }: { config: DemoPageConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingDismissed, setGreetingDismissed] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [serviceSelected, setServiceSelected] = useState(false);
  const [showServicesAfterMessage, setShowServicesAfterMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Quick Book v1 state
  const [quickBookState, setQuickBookState] = useState<QuickBookWidgetState>("SELECT_SERVICE");
  const [quickBookData, setQuickBookData] = useState<QuickBookData>({
    intentId: null,
    selectedService: null,
    contact: null,
    leadId: null,
    providerName: null,
  });
  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "" });
  const [quickBookLoading, setQuickBookLoading] = useState(false);
  const [quickBookError, setQuickBookError] = useState<string | null>(null);

  // Simple welcome message - services will be shown as buttons
  const initialGreeting = `Welcome to ${config.business.name}! What service would you like to book today?`;

  const { 
    messages, 
    isLoading, 
    sendMessage, 
    handleBookingClick,
    resetChat,
    sessionId,
  } = useChatAssistant({
    clientId: config.clientId,
    botId: config.botId,
    source: "demo_page",
    initialGreeting,
  });

  // Quick Book: Handle service button click
  const handleServiceClick = async (serviceName: string, price: string, duration?: string) => {
    setServiceSelected(true);
    setQuickBookLoading(true);
    setQuickBookError(null);
    
    try {
      // Call Quick Book API to create intent
      const response = await fetch(`/api/quickbook/intent/start/${config.clientId}/${config.botId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName,
          priceCents: price ? parseInt(price.replace(/[^0-9]/g, "")) * 100 : undefined,
          sessionId,
          botId: config.botId,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to start booking");
      }
      
      const data = await response.json();
      
      setQuickBookData(prev => ({
        ...prev,
        intentId: data.intentId,
        selectedService: { name: serviceName, price, duration },
      }));
      
      setQuickBookState("COLLECT_CONTACT");
      
      // Note: We do NOT send a message to the AI here.
      // Quick Book UI controls the entire flow deterministically.
    } catch (err) {
      console.error("[QuickBook] Error starting intent:", err);
      setQuickBookError("Unable to start booking. Please try again.");
      // Reset to allow retry
      setServiceSelected(false);
    } finally {
      setQuickBookLoading(false);
    }
  };

  // Quick Book: Submit contact form
  const handleContactSubmit = async () => {
    if (!contactForm.name.trim() || (!contactForm.phone.trim() && !contactForm.email.trim())) {
      setQuickBookError("Please provide your name and at least a phone or email.");
      return;
    }
    
    if (!quickBookData.intentId) {
      setQuickBookError("Booking session expired. Please select a service again.");
      return;
    }
    
    setQuickBookLoading(true);
    setQuickBookError(null);
    
    try {
      const response = await fetch(`/api/quickbook/intent/lead/${config.clientId}/${config.botId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentId: quickBookData.intentId,
          name: contactForm.name.trim(),
          phone: contactForm.phone.trim() || undefined,
          email: contactForm.email.trim() || undefined,
        }),
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to save contact");
      }
      
      const data = await response.json();
      
      setQuickBookData(prev => ({
        ...prev,
        contact: { ...contactForm },
        leadId: data.leadId,
      }));
      
      setQuickBookState("READY_TO_BOOK");
    } catch (err: any) {
      console.error("[QuickBook] Error saving contact:", err);
      setQuickBookError(err.message || "Unable to save contact. Please try again.");
    } finally {
      setQuickBookLoading(false);
    }
  };

  // Quick Book: Click "Book Now" button
  const handleQuickBookNow = async () => {
    if (!quickBookData.intentId) return;
    
    setQuickBookLoading(true);
    setQuickBookError(null);
    
    try {
      const response = await fetch(`/api/quickbook/intent/click/${config.clientId}/${config.botId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentId: quickBookData.intentId }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to process booking");
      }
      
      const data = await response.json();
      
      // Store providerName from response
      setQuickBookData(prev => ({
        ...prev,
        providerName: data.providerName || null,
      }));
      
      setQuickBookState("DONE");
      
      // Redirect to external booking or demo confirmation
      if (data.redirectType === "demo") {
        // Open demo confirmation in new tab with intentId so it fetches correct business name from API
        const params = new URLSearchParams({
          intentId: quickBookData.intentId || "",
        });
        window.open(`/demo-booking-confirmation?${params.toString()}`, "_blank");
      } else {
        // Open external booking URL
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("[QuickBook] Error processing book now:", err);
      setQuickBookError("Unable to proceed. Please try again.");
    } finally {
      setQuickBookLoading(false);
    }
  };

  // Reset service selection and Quick Book state when chat is reset
  const handleResetChat = () => {
    setServiceSelected(false);
    setQuickBookState("SELECT_SERVICE");
    setQuickBookData({
      intentId: null,
      selectedService: null,
      contact: null,
      leadId: null,
      providerName: null,
    });
    setContactForm({ name: "", phone: "", email: "" });
    setQuickBookError(null);
    resetChat();
  };

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
      const message = inputValue.trim();
      
      // Detect booking intent and show service buttons after AI responds
      if (hasBookingIntent(message) && quickBookState !== "COLLECT_CONTACT" && quickBookState !== "READY_TO_BOOK") {
        setShowServicesAfterMessage(true);
        setQuickBookState("SELECT_SERVICE");
      }
      
      sendMessage(message);
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
                  onClick={handleResetChat}
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
          <ScrollArea className="h-96 p-4 bg-[#0B0E13]">
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
                  
                  {/* Service Selection Buttons - show after first assistant message OR last assistant message when booking intent detected */}
                  {message.role === "assistant" && quickBookState === "SELECT_SERVICE" && !isLoading && !quickBookLoading && (
                    // Show on first message OR on last assistant message when showServicesAfterMessage is true
                    (index === 0 || (showServicesAfterMessage && index === messages.length - 1)) && (
                    <div className="mt-3 w-full space-y-2" data-testid="service-buttons-container">
                      <p className="text-xs text-white/50 mb-2">Select a service:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {config.services.slice(0, 6).map((service, sIndex) => (
                          <button
                            key={service.name}
                            onClick={() => {
                              setShowServicesAfterMessage(false);
                              handleServiceClick(service.name, service.price || '', service.duration);
                            }}
                            className="w-full text-left px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 transition-all group"
                            data-testid={`button-service-${sIndex}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white/90 group-hover:text-white">{service.name}</span>
                              {service.price && (
                                <span className="text-sm font-medium text-cyan-400">{service.price}</span>
                              )}
                            </div>
                            {service.duration && (
                              <span className="text-xs text-white/40">{service.duration}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  
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
              
              {(isLoading || quickBookLoading) && (
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
              
              {/* Quick Book: Contact Collection Form */}
              {quickBookState === "COLLECT_CONTACT" && !quickBookLoading && (
                <div className="mt-3 p-4 bg-[#1A1D24] rounded-2xl border border-white/10" data-testid="quickbook-contact-form">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-cyan-400" />
                    <span className="text-sm font-medium text-white">
                      {quickBookData.selectedService?.name}
                      {quickBookData.selectedService?.price && (
                        <span className="text-cyan-400 ml-2">{quickBookData.selectedService.price}</span>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mb-3">Enter your contact details to continue:</p>
                  <div className="space-y-2">
                    <Input
                      data-testid="input-quickbook-name"
                      placeholder="Your Name *"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(f => ({ ...f, name: e.target.value }))}
                      className="bg-[#0B0E13] border-white/10 text-white text-sm placeholder:text-white/40"
                    />
                    <Input
                      data-testid="input-quickbook-phone"
                      type="tel"
                      placeholder="Phone Number"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(f => ({ ...f, phone: e.target.value }))}
                      className="bg-[#0B0E13] border-white/10 text-white text-sm placeholder:text-white/40"
                    />
                    <Input
                      data-testid="input-quickbook-email"
                      type="email"
                      placeholder="Email Address"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(f => ({ ...f, email: e.target.value }))}
                      className="bg-[#0B0E13] border-white/10 text-white text-sm placeholder:text-white/40"
                    />
                  </div>
                  {quickBookError && (
                    <p className="text-xs text-red-400 mt-2" data-testid="quickbook-error">{quickBookError}</p>
                  )}
                  <Button
                    data-testid="button-quickbook-continue"
                    onClick={handleContactSubmit}
                    disabled={!contactForm.name.trim() || (!contactForm.phone.trim() && !contactForm.email.trim())}
                    className={cn(
                      "w-full mt-3 text-white transition-all",
                      `bg-gradient-to-r ${config.colors.primary} hover:opacity-90`
                    )}
                  >
                    Continue to Book
                  </Button>
                </div>
              )}
              
              {/* Quick Book: Ready to Book Button */}
              {quickBookState === "READY_TO_BOOK" && !quickBookLoading && (() => {
                const displayProviderName = quickBookData.providerName || "our booking provider";
                return (
                  <div className="mt-3 p-4 bg-[#1A1D24] rounded-2xl border border-cyan-500/30" data-testid="quickbook-ready">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <span className="text-sm font-medium text-white">Contact saved!</span>
                    </div>
                    <p className="text-xs text-white/60 mb-3">
                      Perfect — you're all set. Tap <span className="font-semibold text-white">Book Now</span> to finish on our secure scheduling page.
                    </p>
                    {quickBookError && (
                      <p className="text-xs text-red-400 mb-2" data-testid="quickbook-error">{quickBookError}</p>
                    )}
                    <Button
                      data-testid="button-quickbook-book-now"
                      onClick={handleQuickBookNow}
                      className={cn(
                        "w-full text-white transition-all",
                        `bg-gradient-to-r ${config.colors.primary} hover:opacity-90 shadow-lg`
                      )}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Now
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </Button>
                    <p className="mt-3 text-[11px] leading-snug text-white/50">
                      You'll finish on <span className="text-white/70 font-medium">{displayProviderName}</span>. If you get interrupted, we'll still have your request.
                    </p>
                  </div>
                );
              })()}
              
              {/* Quick Book: Completed State */}
              {quickBookState === "DONE" && (
                <div className="mt-3 p-4 bg-[#1A1D24] rounded-2xl border border-green-500/30" data-testid="quickbook-done">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Booking in Progress!</span>
                  </div>
                  <p className="text-xs text-white/60">
                    A new tab has opened for you to complete your booking. If nothing happened, 
                    <button 
                      onClick={handleQuickBookNow} 
                      className="text-cyan-400 underline ml-1"
                      data-testid="button-quickbook-retry"
                    >
                      click here
                    </button>.
                  </p>
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

// Premium Hero Section for flagship demos
function PremiumHero({ config }: { config: DemoPageConfig }) {
  const primaryHex = config.colors.gradient.includes('#') ? config.colors.gradient.split(' ')[0] : '#00E5CC';
  
  return (
    <section className="relative text-white pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-8">
          <div 
            className="relative p-8 rounded-2xl mx-auto max-w-3xl overflow-visible"
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div 
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, transparent 50%)'
              }}
            />
            
            <div className="space-y-6 relative">
              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-400/25 shadow-[0_0_20px_rgba(0,229,204,0.1)]">
                <Sparkles className="h-3 w-3 mr-1" style={{ filter: 'drop-shadow(0 0 4px rgba(0,229,204,0.5))' }} />
                Treasure Coast AI - Live Demo
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold" style={{ lineHeight: 1.2 }} data-testid="hero-title">
                <span 
                  className="block text-transparent bg-clip-text pb-1"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${primaryHex} 0%, ${primaryHex}dd 25%, ${primaryHex}88 50%, #A78BFA 75%, #C4B5FD 100%)`,
                    filter: `drop-shadow(0 0 30px ${primaryHex}4d)`,
                    WebkitBackgroundClip: 'text'
                  }}
                >
                  {config.business.name}
                </span>
                <span 
                  className="block text-transparent bg-clip-text mt-2"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.6) 100%)',
                    fontSize: '0.45em',
                    fontWeight: 500,
                    letterSpacing: '0.05em'
                  }}
                >
                  {config.business.tagline}
                </span>
              </h1>
              
              <div 
                className="h-[2px] w-64 mx-auto mt-4 rounded-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${primaryHex}, #A855F7, ${primaryHex}, transparent)`,
                  backgroundSize: '200% 100%',
                  animation: 'gradientSlide 20s linear infinite',
                  opacity: 0.2
                }}
              />
              
              <p className="text-base text-white/55 leading-relaxed max-w-2xl mx-auto" style={{ letterSpacing: '0.01em' }} data-testid="hero-tagline">
                {config.business.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {[
              { icon: CheckCircle2, color: primaryHex, text: '24/7 AI assistant' },
              { icon: CheckCircle2, color: '#A855F7', text: config.bookingLabel },
              { icon: CheckCircle2, color: '#22C55E', text: 'Live dashboard' }
            ].map((item, i) => (
              <div 
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  boxShadow: `0 0 20px ${item.color}08`
                }}
              >
                <item.icon 
                  className="h-4 w-4" 
                  style={{ 
                    color: item.color,
                    filter: `drop-shadow(0 0 6px ${item.color}50)`
                  }} 
                />
                <span className="text-sm text-white/65">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes gradientSlide {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </section>
  );
}

// Default Hero Section
function DefaultHero({ config }: { config: DemoPageConfig }) {
  return (
    <section className="relative bg-gradient-to-br from-[#0A0A0F] via-[#0F1520] to-[#0A0A0F] text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
      <div className="absolute inset-0 cyber-grid opacity-20" />
      
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
  );
}

// Main Demo Page Template
export default function DemoPageTemplate({ config }: { config: DemoPageConfig }) {
  const BackgroundFX = config.BackgroundFX;
  const isPremium = config.heroVariant === "premium";
  
  return (
    <div className={cn("min-h-screen relative", isPremium ? "bg-[#050608]" : "bg-[#0A0A0F]")}>
      {BackgroundFX && (
        <BackgroundFX 
          primaryRgb={config.colors.particleRgb} 
          secondaryRgb={config.colors.secondaryRgb} 
        />
      )}
      
      {/* Demo Banner */}
      <nav className={cn(
        "text-white py-3 px-4 text-center text-sm border-b border-white/5 sticky top-0 z-40 backdrop-blur-xl",
        isPremium ? "bg-black/60 border-white/10" : "bg-gradient-to-r from-cyan-900/30 via-[#0A0A0F] to-purple-900/30"
      )}>
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
      </nav>

      {/* Hero Section - choose based on variant */}
      {isPremium ? <PremiumHero config={config} /> : <DefaultHero config={config} />}

      {/* Niche Stats Section */}
      <section className={cn(
        "py-12 border-y border-white/5 relative z-10",
        isPremium ? "bg-transparent" : "bg-gradient-to-b from-[#0F1520] to-[#0A0A0F]"
      )}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {config.nicheStats.map((stat, index) => (
              <div 
                key={index}
                className={cn(
                  "rounded-xl p-6 text-center border transition-all duration-300 hover:scale-[1.02]",
                  isPremium 
                    ? "bg-black/25 backdrop-blur-sm border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.2)]" 
                    : "glass-card-glow border-white/5"
                )}
                data-testid={`stat-${index}`}
              >
                <p className={cn(
                  "text-3xl md:text-4xl font-bold mb-1",
                  isPremium ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400" : "text-glow-gradient"
                )}>{stat.value}</p>
                <p className="text-sm font-medium text-white/80">{stat.label}</p>
                <p className="text-xs text-white/50 mt-1">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={cn(
        "py-16 relative z-10",
        isPremium ? "bg-transparent" : "bg-[#0A0A0F]"
      )}>
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
                className={cn(
                  "rounded-2xl p-6 text-center transition-all duration-300 hover:scale-[1.02]",
                  isPremium 
                    ? "bg-black/25 backdrop-blur-sm border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.2)]" 
                    : "glass-card-glow hover-elevate"
                )}
                data-testid={`feature-${index}`}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4",
                  isPremium 
                    ? "bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-cyan-500/20" 
                    : "bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20"
                )}>
                  <CheckCircle2 className="h-6 w-6 text-cyan-400" style={isPremium ? { filter: 'drop-shadow(0 0 6px rgba(0,229,204,0.4))' } : undefined} />
                </div>
                <h3 className="font-semibold text-white">{feature}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className={cn(
        "py-16 relative z-10",
        isPremium ? "bg-transparent" : "bg-gradient-to-b from-[#0A0A0F] to-[#0F1520]"
      )}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className={cn(
              "mb-4",
              isPremium ? "bg-purple-500/10 text-purple-400 border-purple-400/25 shadow-[0_0_20px_rgba(168,85,247,0.1)]" : "bg-purple-500/10 text-purple-400 border-purple-500/30"
            )}>OUR SERVICES</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What We Offer</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Comprehensive services tailored to meet your needs with excellence and care.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {config.services.slice(0, 6).map((service, index) => (
              <Card 
                key={index}
                className={cn(
                  "p-6 transition-all duration-300 bg-transparent",
                  isPremium 
                    ? "bg-black/25 backdrop-blur-sm border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:scale-[1.02] hover:-translate-y-1" 
                    : "glass-card-glow hover-elevate border-white/10"
                )}
                data-testid={`service-${index}`}
              >
                {service.popular && (
                  <Badge className={cn(
                    "mb-3",
                    isPremium ? "bg-cyan-500/10 text-cyan-400 border-cyan-400/25 shadow-[0_0_15px_rgba(0,229,204,0.1)]" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                  )}>POPULAR</Badge>
                )}
                <h3 className="text-lg font-semibold text-white mb-2">{service.name}</h3>
                <p className="text-white/60 text-sm mb-4">{service.description}</p>
                <div className="flex items-center justify-between text-sm">
                  {service.price && (
                    <span className={cn(
                      "font-medium",
                      isPremium ? "text-cyan-400" : "text-cyan-400"
                    )} style={isPremium ? { textShadow: '0 0 10px rgba(0,229,204,0.3)' } : undefined}>{service.price}</span>
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
        <section className={cn(
          "py-16 relative z-10",
          isPremium ? "bg-transparent" : "bg-[#0A0A0F]"
        )}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className={cn(
                "mb-4",
                isPremium ? "bg-cyan-500/10 text-cyan-400 border-cyan-400/25 shadow-[0_0_20px_rgba(0,229,204,0.1)]" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
              )}>OUR TEAM</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Meet Our Experts</h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Dedicated professionals committed to providing you with exceptional service.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {config.team.map((member, index) => (
                <div 
                  key={index}
                  className={cn(
                    "rounded-2xl p-6 text-center transition-all duration-300",
                    isPremium 
                      ? "bg-black/25 backdrop-blur-sm border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:scale-[1.02] hover:-translate-y-1" 
                      : "glass-card-glow hover-elevate"
                  )}
                  data-testid={`team-${index}`}
                >
                  <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
                    isPremium 
                      ? "bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10" 
                      : "bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-white/10"
                  )}>
                    <Users className="h-10 w-10 text-white/60" />
                  </div>
                  <h3 className="font-semibold text-white">{member.name}</h3>
                  <p className="text-cyan-400 text-sm mb-2" style={isPremium ? { textShadow: '0 0 8px rgba(0,229,204,0.2)' } : undefined}>{member.role}</p>
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
      <section className={cn(
        "py-16 relative overflow-hidden z-10",
        isPremium ? "bg-transparent" : "bg-gradient-to-b from-[#0F1520] to-[#0A0A0F]"
      )}>
        {!isPremium && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
            <div className="glow-orb glow-orb-cyan w-[300px] h-[300px] top-0 right-0 opacity-30" />
          </>
        )}
        
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className={cn(
              "mb-4",
              isPremium 
                ? "bg-gradient-to-r from-cyan-500/15 to-purple-500/15 text-white border-cyan-400/25 shadow-[0_0_20px_rgba(0,229,204,0.1)]" 
                : "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border-cyan-500/30"
            )}>
              <Sparkles className="h-3 w-3 mr-1" style={isPremium ? { filter: 'drop-shadow(0 0 4px rgba(0,229,204,0.5))' } : undefined} />
              POWERED BY AI
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How <span className={isPremium ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400" : "text-glow-gradient"}>Treasure Coast AI</span> Helps {config.business.type.replace(/_/g, ' ')} Businesses
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Our AI assistant provides 24/7 customer support, captures leads, and books appointments automatically.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {config.aiBenefits.map((benefit, index) => (
              <Card 
                key={index}
                className={cn(
                  "p-6 transition-all duration-300 bg-transparent group",
                  isPremium 
                    ? "bg-black/25 backdrop-blur-sm border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:scale-[1.02] hover:-translate-y-1" 
                    : "glass-card-glow hover-elevate border-white/10"
                )}
                data-testid={`ai-benefit-${index}`}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
                  isPremium 
                    ? "bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-cyan-500/20 group-hover:border-cyan-500/40" 
                    : "bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20 group-hover:border-cyan-500/40"
                )}>
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-white/60 text-sm mb-3">{benefit.description}</p>
                {benefit.stat && (
                  <p className="text-cyan-400 text-sm font-medium" style={isPremium ? { textShadow: '0 0 10px rgba(0,229,204,0.3)' } : undefined}>{benefit.stat}</p>
                )}
              </Card>
            ))}
          </div>
          
          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-white/60 mb-4">Want this AI assistant for your business?</p>
            <Link href="/">
              <Button 
                size="lg" 
                className={cn(
                  isPremium 
                    ? "relative overflow-hidden text-[#0A0A0F] font-semibold shadow-[0_0_30px_rgba(0,229,204,0.35)] hover:shadow-[0_0_40px_rgba(0,229,204,0.5)] transition-all duration-300 hover:-translate-y-0.5" 
                    : "btn-gradient-primary glow-cyan-strong"
                )}
                style={isPremium ? {
                  background: 'linear-gradient(135deg, #00E5CC 0%, #00D4BD 50%, #00C2B3 100%)',
                  border: '1px solid rgba(255,255,255,0.2)'
                } : undefined}
              >
                Get Treasure Coast AI
                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {config.testimonials.length > 0 && (
        <section className={cn(
          "py-16 relative z-10",
          isPremium ? "bg-transparent" : "bg-[#0A0A0F]"
        )}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className={cn(
                "mb-4",
                isPremium ? "bg-amber-500/10 text-amber-400 border-amber-400/25 shadow-[0_0_20px_rgba(245,158,11,0.1)]" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
              )}>TESTIMONIALS</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What Our Clients Say</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {config.testimonials.map((testimonial, index) => (
                <Card 
                  key={index}
                  className={cn(
                    "p-6 bg-transparent",
                    isPremium 
                      ? "bg-black/25 backdrop-blur-sm border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.2)]" 
                      : "glass-card-glow border-white/10"
                  )}
                  data-testid={`testimonial-${index}`}
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" style={isPremium ? { filter: 'drop-shadow(0 0 4px rgba(250,204,21,0.4))' } : undefined} />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-white/10 mb-2" />
                  <p className="text-white/80 text-sm mb-4 italic">{testimonial.content}</p>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      isPremium ? "bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10" : "bg-gradient-to-br from-cyan-500/30 to-purple-500/30"
                    )}>
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
      <section className={cn(
        "py-16 relative z-10",
        isPremium ? "bg-transparent" : "bg-gradient-to-b from-[#0A0A0F] to-[#0F1520]"
      )}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <Card className={cn(
              "p-8 bg-transparent",
              isPremium 
                ? "bg-black/25 backdrop-blur-sm border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.2)]" 
                : "glass-card-glow border-white/10"
            )}>
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
            <Card className={cn(
              "p-8 bg-transparent",
              isPremium 
                ? "bg-black/25 backdrop-blur-sm border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.2)]" 
                : "glass-card-glow border-white/10"
            )}>
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
      <section className={cn(
        "py-16 relative overflow-hidden z-10",
        isPremium ? "bg-transparent" : "bg-[#0A0A0F]"
      )}>
        {!isPremium && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10" />
            <div className="glow-orb glow-orb-purple w-[400px] h-[400px] -bottom-40 left-1/2 -translate-x-1/2 opacity-30" />
          </>
        )}
        
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {config.ctaText}
          </h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            Try our AI assistant below or contact us to learn more about our services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className={cn(
                isPremium 
                  ? "relative overflow-hidden text-[#0A0A0F] font-semibold shadow-[0_0_30px_rgba(0,229,204,0.35)] hover:shadow-[0_0_40px_rgba(0,229,204,0.5)] transition-all duration-300 hover:-translate-y-0.5" 
                  : "btn-gradient-primary glow-cyan-strong"
              )}
              style={isPremium ? {
                background: 'linear-gradient(135deg, #00E5CC 0%, #00D4BD 50%, #00C2B3 100%)',
                border: '1px solid rgba(255,255,255,0.2)'
              } : undefined}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Chat With Us Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className={cn(
                "text-white",
                isPremium 
                  ? "border-white/15 bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.08] hover:border-white/25" 
                  : "border-white/20 hover:bg-white/10"
              )}
            >
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
