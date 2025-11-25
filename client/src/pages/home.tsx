import { useState, useEffect } from "react";
import ChatBubble from "@/components/ChatBubble";
import ChatWindow from "@/components/ChatWindow";
import AppointmentFlow from "@/components/AppointmentFlow";
import PreIntakeFlow, { PreIntakeData } from "@/components/PreIntakeFlow";
import CrisisSupport from "@/components/CrisisSupport";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface AppointmentData {
  name: string;
  contact: string;
  preferredTime: string;
  notes: string;
  appointmentType?: string;
  lookingFor?: string;
  sobrietyStatus?: string;
  hasSupport?: string;
  timeline?: string;
}

const WELCOME_MESSAGES = {
  en: "Hi, I'm HopeLine Assistant for The Faith House. I can help you with:\n- Basic questions about the program\n- Requirements, pricing, and availability\n- Seeing if you might qualify\n- Requesting a phone call or tour\n\nHow can I help you today?",
  es: "Hola, soy HopeLine Assistant de The Faith House. Puedo ayudarte con:\n- Preguntas básicas sobre el programa\n- Requisitos, precios y disponibilidad\n- Ver si podrías calificar\n- Pedir una llamada o un tour\n\n¿En qué puedo ayudarte hoy?"
};

const MENU_RESPONSES: Record<string, string> = {
  about: "The Faith House is a structured sober-living environment designed to support individuals in their recovery journey. We provide:\n\n• Safe, structured housing with accountability\n• Mandatory attendance at recovery meetings\n• Supportive community environment\n• Job search assistance\n• Clear expectations and house rules\n\nWould you like to know more about our requirements or pricing?",
  
  requirements: "To live at The Faith House, residents must:\n\n• Maintain complete sobriety (no alcohol or drugs)\n• Attend required recovery meetings regularly\n• Respect curfew times\n• Respect all staff and fellow residents\n• Maintain cleanliness in personal and common areas\n• Work or actively seek employment\n• Follow all house rules and guidelines\n\nWould you like information about pricing or how to apply?",
  
  availability: "Availability varies depending on current openings. The best way to check current availability is to contact our staff directly. Would you like to request a tour or call to discuss availability?",
  
  pricing: "Our pricing covers housing, utilities, and support services. Exact pricing can vary based on individual circumstances and current availability. For specific pricing details, please contact our staff or request a call. Would you like to schedule a tour or call?",
  
  apply: "Our application process typically involves:\n\n• Providing personal information\n• Background details\n• Emergency contact information\n• Agreement to follow all house rules\n\nWould you like to request a tour or call to begin the application process?",
  
  contact: "You can reach The Faith House staff:\n\n• Phone: Contact us to get current phone number\n• Request a tour or call through this assistant\n• Visit our facility (address available during tour scheduling)\n\nWould you like to request a tour or call?"
};

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [sessionId, setSessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME_MESSAGES.en }
  ]);
  const [showMenu, setShowMenu] = useState(true);
  const [showAppointmentFlow, setShowAppointmentFlow] = useState(false);
  const [showPreIntakeFlow, setShowPreIntakeFlow] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [preIntakeData, setPreIntakeData] = useState<PreIntakeData | null>(null);
  const { toast } = useToast();
  
  const handleResetChat = () => {
    setSessionId(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    setMessages([{ role: "assistant", content: WELCOME_MESSAGES[language as keyof typeof WELCOME_MESSAGES] }]);
    setShowMenu(true);
    setShowAppointmentFlow(false);
    setShowPreIntakeFlow(false);
    setShowCrisis(false);
    setPreIntakeData(null);
  };
  
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === "assistant") {
      setMessages([{ role: "assistant", content: WELCOME_MESSAGES[language as keyof typeof WELCOME_MESSAGES] }]);
    }
  }, [language]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest("POST", "/api/chat", {
        messages: [
          ...messages.filter(m => !showCrisis && !showAppointmentFlow),
          { role: "user", content: userMessage }
        ],
        sessionId,
        language
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      setShowMenu(true);
      
      if (data.showAppointmentFlow) {
        setTimeout(() => {
          setShowAppointmentFlow(true);
          setShowMenu(false);
        }, 500);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const appointmentMutation = useMutation({
    mutationFn: async (appointmentData: AppointmentData) => {
      const response = await apiRequest("POST", "/api/appointment", {
        ...appointmentData,
        sessionId
      });
      return response.json();
    },
    onSuccess: () => {
      setMessages(prev => [
        ...prev.filter(m => m.role !== "user" || !m.content.includes("appointment")),
        {
          role: "assistant",
          content: "Thank you! Your tour/call request has been submitted. Our staff will contact you soon at the information you provided. Is there anything else I can help you with?"
        }
      ]);
      setShowAppointmentFlow(false);
      setShowMenu(true);
      toast({
        title: "Request Submitted",
        description: "We'll be in touch soon!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = (message: string) => {
    if (showAppointmentFlow || showCrisis || showPreIntakeFlow) return;
    
    setMessages(prev => [...prev, { role: "user", content: message }]);
    setShowMenu(false);
    chatMutation.mutate(message);
  };

  const handleMenuClick = (option: string) => {
    setShowMenu(false);
    setShowCrisis(false);
    setShowAppointmentFlow(false);
    setShowPreIntakeFlow(false);

    if (option === "crisis") {
      setShowCrisis(true);
      return;
    }

    if (option === "tour") {
      setMessages(prev => [
        ...prev,
        { role: "user", content: language === "es" ? "Me gustaría solicitar un tour o llamada" : "I'd like to request a tour or call" },
        { role: "assistant", content: language === "es" 
          ? "¡Genial! Te ayudaré a programar un tour o llamada. Déjame recopilar información." 
          : "Great! I'll help you schedule a tour or call. Let me gather some information." }
      ]);
      setShowAppointmentFlow(true);
      return;
    }

    if (option === "qualify") {
      setMessages(prev => [
        ...prev,
        { role: "user", content: language === "es" ? "Me gustaría ver si podría calificar" : "I'd like to see if I might qualify" },
        { role: "assistant", content: language === "es"
          ? "¡Perfecto! Déjame hacerte algunas preguntas breves para entender mejor tu situación. Esto nos ayudará a determinar si The Faith House podría ser adecuado para ti."
          : "Perfect! Let me ask you a few quick questions to better understand your situation. This will help us determine if The Faith House might be a good fit for you." }
      ]);
      setShowPreIntakeFlow(true);
      return;
    }

    if (option === "question") {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: language === "es"
          ? "Por supuesto, estoy aquí para responder tus preguntas. ¿Qué te gustaría saber sobre The Faith House?"
          : "Of course, I'm here to answer your questions. What would you like to know about The Faith House?" }
      ]);
      setShowMenu(true);
      return;
    }

    const response = MENU_RESPONSES[option];
    if (response) {
      setMessages(prev => [
        ...prev,
        { role: "user", content: menuOptionToText(option) },
        { role: "assistant", content: response }
      ]);
      setShowMenu(true);
    }
  };

  const menuOptionToText = (option: string): string => {
    const mapping: Record<string, string> = {
      about: "Tell me about The Faith House",
      requirements: "What are the requirements?",
      availability: "What's the availability?",
      pricing: "What's the pricing?",
      apply: "How do I apply?",
      contact: "How can I contact you?"
    };
    return mapping[option] || option;
  };

  const handlePreIntakeComplete = (data: PreIntakeData) => {
    setPreIntakeData(data);
    setShowPreIntakeFlow(false);
    setMessages(prev => [
      ...prev,
      { role: "assistant", content: language === "es"
        ? "Gracias por compartir esta información. Basándome en lo que me has contado, The Faith House podría ser una buena opción. ¿Te gustaría programar un tour o llamada para hablar con nuestro personal y obtener más detalles?"
        : "Thank you for sharing this information. Based on what you've told me, The Faith House could be a good fit. Would you like to schedule a tour or call to speak with our staff and get more details?" }
    ]);
    setShowMenu(true);
  };

  const handlePreIntakeCancel = () => {
    setShowPreIntakeFlow(false);
    setMessages(prev => [
      ...prev,
      { role: "assistant", content: language === "es"
        ? "No hay problema. Si tienes alguna otra pregunta, estoy aquí para ayudarte."
        : "No problem. If you have any other questions, I'm here to help." }
    ]);
    setShowMenu(true);
  };

  const handleAppointmentComplete = (data: AppointmentData) => {
    const fullData = {
      ...data,
      ...(preIntakeData || {})
    };
    appointmentMutation.mutate(fullData);
  };

  const handleAppointmentCancel = () => {
    setShowAppointmentFlow(false);
    setMessages(prev => [
      ...prev.filter(m => !m.content.includes("schedule a tour")),
      { role: "assistant", content: "No problem! Is there anything else I can help you with?" }
    ]);
    setShowMenu(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl font-bold text-foreground">
            Welcome to The Faith House
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A structured, supportive environment for individuals on their recovery journey. 
            We provide the foundation, accountability, and community to help you build a better future.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 bg-card rounded-xl border border-card-border">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Structured Support</h3>
              <p className="text-sm text-muted-foreground">
                Clear expectations, accountability, and guidance throughout your recovery
              </p>
            </div>
            <div className="p-6 bg-card rounded-xl border border-card-border">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Safe Environment</h3>
              <p className="text-sm text-muted-foreground">
                Sober living space with supportive peers who understand your journey
              </p>
            </div>
            <div className="p-6 bg-card rounded-xl border border-card-border">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Community Focus</h3>
              <p className="text-sm text-muted-foreground">
                Build meaningful connections and develop life skills for lasting success
              </p>
            </div>
          </div>

          <div className="mt-12 p-6 bg-accent/20 rounded-xl border border-accent/30">
            <p className="text-lg text-foreground mb-2">
              Have questions? Need support?
            </p>
            <p className="text-muted-foreground">
              Click the chat button in the bottom right to connect with our HopeLine Assistant
            </p>
          </div>
        </div>
      </div>

      <ChatBubble onClick={() => setIsChatOpen(true)} />
      
      <ChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        onMenuClick={handleMenuClick}
        isLoading={chatMutation.isPending || appointmentMutation.isPending}
        showMenu={showMenu && !showAppointmentFlow && !showCrisis && !showPreIntakeFlow}
        language={language}
        onLanguageToggle={() => setLanguage(lang => lang === "en" ? "es" : "en")}
        onResetChat={handleResetChat}
        flowContent={
          showCrisis ? (
            <CrisisSupport />
          ) : showPreIntakeFlow ? (
            <PreIntakeFlow
              onComplete={handlePreIntakeComplete}
              onCancel={handlePreIntakeCancel}
              language={language}
            />
          ) : showAppointmentFlow ? (
            <AppointmentFlow
              onComplete={handleAppointmentComplete}
              onCancel={handleAppointmentCancel}
              language={language}
            />
          ) : null
        }
      />
    </div>
  );
}
