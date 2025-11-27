import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BotConfig {
  botId: string;
  clientId: string;
  name: string;
  description: string;
  businessProfile: {
    businessName: string;
    type: string;
    location: string;
    phone: string;
    email: string;
    website: string;
    hours: Record<string, string>;
    services?: string[];
    amenities?: string[];
  };
  faqs: Array<{ question: string; answer: string }>;
  isDemo: boolean;
}

interface Message {
  role: "assistant" | "user";
  content: string;
}

const businessTypeIcons: Record<string, React.ReactNode> = {
  sober_living: <Heart className="h-5 w-5" />,
  restaurant: <Building2 className="h-5 w-5" />,
  barber_salon: <Scissors className="h-5 w-5" />,
  home_services: <Home className="h-5 w-5" />,
  auto_shop: <Car className="h-5 w-5" />,
  gym_fitness: <Dumbbell className="h-5 w-5" />,
};

export default function DemoBotPage() {
  const params = useParams<{ botId: string }>();
  const botId = params.botId;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sessionId] = useState(() => `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: botConfig, isLoading, error } = useQuery<BotConfig>({
    queryKey: ['/api/demo', botId],
  });

  useEffect(() => {
    if (botConfig && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Hi! I'm the virtual assistant for ${botConfig.businessProfile.businessName}. How can I help you today?`
      }]);
    }
  }, [botConfig, messages.length]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest("POST", `/api/chat/${botConfig?.clientId}/${botId}`, {
        messages: [
          ...messages,
          { role: "user", content: userMessage }
        ],
        sessionId,
        language: "en"
      });
      return response.json();
    },
    onSuccess: (data: { reply: string }) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    },
    onError: () => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm sorry, I encountered an error. Please try again." 
      }]);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !chatMutation.isPending) {
      const userMessage = inputValue.trim();
      setMessages(prev => [...prev, { role: "user", content: userMessage }]);
      setInputValue("");
      chatMutation.mutate(userMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFaqClick = (question: string) => {
    setMessages(prev => [...prev, { role: "user", content: question }]);
    chatMutation.mutate(question);
  };

  const handleReset = () => {
    if (botConfig) {
      setMessages([{
        role: "assistant",
        content: `Hi! I'm the virtual assistant for ${botConfig.businessProfile.businessName}. How can I help you today?`
      }]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-96" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-96 w-full" />
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !botConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Bot Not Found</CardTitle>
            <CardDescription>
              The requested demo bot could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/demos">
              <Button data-testid="button-back-to-demos">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Demos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bp = botConfig.businessProfile;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/demos">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Demos
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {businessTypeIcons[bp.type]}
            <span className="font-medium text-foreground">{bp.businessName}</span>
            <Badge variant={botConfig.isDemo ? "secondary" : "default"}>
              {botConfig.isDemo ? "Demo" : "Live"}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-180px)] flex flex-col">
              <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between gap-4 pb-4">
                <div>
                  <CardTitle data-testid="text-bot-title">{botConfig.name}</CardTitle>
                  <CardDescription>{botConfig.description}</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleReset}
                  title="Reset conversation"
                  data-testid="button-reset-chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex",
                          message.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          data-testid={`message-${message.role}-${index}`}
                          className={cn(
                            "max-w-[80%] rounded-xl p-3 text-sm whitespace-pre-wrap",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          )}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    
                    {chatMutation.isPending && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-xl p-3 text-sm">
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

                <div className="flex-shrink-0 pt-4 border-t mt-4">
                  <div className="flex gap-2">
                    <Input
                      data-testid="input-chat-message"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={chatMutation.isPending}
                    />
                    <Button
                      data-testid="button-send-message"
                      onClick={handleSend}
                      disabled={!inputValue.trim() || chatMutation.isPending}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    This is a demo. Not an emergency service.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Business Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{bp.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{bp.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{bp.website}</span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    {Object.entries(bp.hours).map(([day, hours]) => (
                      <div key={day} className="capitalize">
                        {day}: {hours}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {bp.services && bp.services.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {bp.services.map((service, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary">*</span>
                        {service}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {botConfig.faqs && botConfig.faqs.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Quick Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {botConfig.faqs.slice(0, 5).map((faq, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start h-auto py-2 text-xs"
                      onClick={() => handleFaqClick(faq.question)}
                      disabled={chatMutation.isPending}
                      data-testid={`button-faq-${i}`}
                    >
                      {faq.question}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
