import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TreasureCoastLogo } from "@/components/treasure-coast-logo";
import { 
  MessageCircle, 
  Clock, 
  AlertCircle,
  Sparkles,
  ExternalLink,
  Bot,
  Send
} from "lucide-react";

interface PreviewData {
  success: boolean;
  preview: {
    workspaceSlug: string;
    workspaceName: string;
    botId: string;
    botName: string;
    businessName: string;
    businessType: string;
    logo: string | null;
    primaryColor: string;
    tagline: string;
  };
  widget: {
    clientId: string;
    botId: string;
    token: string;
    quickActions: Array<{ id: string; label: string }>;
  };
  wowButtons: Array<{ label: string; message: string }>;
  expiry: {
    expiresAt: string;
    timeRemaining: string;
    hoursRemaining: number;
    secondsRemaining: number;
  };
}

function ParticleField({ accentColor }: { accentColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.3 + 0.1
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${accentColor}${Math.round(p.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      });
      
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [accentColor]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

function ExpiryBanner({ expiry }: { expiry: PreviewData['expiry'] }) {
  const [timeRemaining, setTimeRemaining] = useState(expiry.timeRemaining);
  
  useEffect(() => {
    const expiresAt = new Date(expiry.expiresAt).getTime();
    
    const updateTime = () => {
      const now = Date.now();
      const secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
      const hours = Math.floor(secondsLeft / 3600);
      const minutes = Math.floor((secondsLeft % 3600) / 60);
      
      if (secondsLeft <= 0) {
        setTimeRemaining('Expired');
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m remaining`);
      } else {
        setTimeRemaining(`${secondsLeft}s remaining`);
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [expiry.expiresAt]);

  const isExpiringSoon = expiry.hoursRemaining < 2;
  
  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium ${
        isExpiringSoon 
          ? 'bg-amber-500/90 text-black' 
          : 'bg-gradient-to-r from-cyan-500/80 to-purple-500/80 text-white'
      } backdrop-blur-sm`}
      data-testid="preview-expiry-banner"
    >
      <div className="flex items-center justify-center gap-2">
        <Clock className="h-4 w-4" />
        <span>
          PREVIEW LINK — {timeRemaining} — not live yet
        </span>
      </div>
    </div>
  );
}

function WowButtons({ 
  buttons, 
  onSend, 
  primaryColor 
}: { 
  buttons: PreviewData['wowButtons']; 
  onSend: (message: string) => void;
  primaryColor: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="preview-wow-buttons">
      {buttons.map((btn, idx) => (
        <Button
          key={idx}
          variant="outline"
          className="h-auto py-3 px-4 text-left justify-start gap-2 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
          onClick={() => onSend(btn.message)}
          style={{ 
            borderColor: `${primaryColor}30`,
          }}
          data-testid={`wow-button-${idx}`}
        >
          <Send className="h-4 w-4 flex-shrink-0" style={{ color: primaryColor }} />
          <span className="text-sm text-white/90">{btn.label}</span>
        </Button>
      ))}
    </div>
  );
}

export default function PreviewPage() {
  const [, params] = useRoute("/preview/:workspaceSlug");
  const workspaceSlug = params?.workspaceSlug;
  const token = new URLSearchParams(window.location.search).get('t');
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<PreviewData>({
    queryKey: ['/api/preview', workspaceSlug, token],
    queryFn: async () => {
      const res = await fetch(`/api/preview/${workspaceSlug}?t=${token}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load preview');
      }
      return res.json();
    },
    enabled: !!workspaceSlug && !!token,
    retry: false,
  });

  useEffect(() => {
    if (!data?.widget) return;

    const script = document.createElement('script');
    script.src = '/widget/tcai-widget.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).TCAIWidget) {
        (window as any).TCAIWidget.init({
          clientId: data.widget.clientId,
          botId: data.widget.botId,
          token: data.widget.token,
          primaryColor: data.preview.primaryColor,
          position: 'bottom-right',
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      if ((window as any).TCAIWidget) {
        (window as any).TCAIWidget.destroy?.();
      }
      document.body.removeChild(script);
    };
  }, [data]);

  useEffect(() => {
    if (pendingMessage && widgetOpen && (window as any).TCAIWidget) {
      setTimeout(() => {
        (window as any).TCAIWidget.sendMessage?.(pendingMessage);
        setPendingMessage(null);
      }, 500);
    }
  }, [pendingMessage, widgetOpen]);

  const handleWowButtonClick = (message: string) => {
    if ((window as any).TCAIWidget) {
      (window as any).TCAIWidget.open?.();
      setWidgetOpen(true);
      setPendingMessage(message);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-6 flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <div>
              <h2 className="text-white font-medium">Invalid Preview Link</h2>
              <p className="text-white/60 text-sm">This preview link is missing the required token.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load preview';
    const isExpired = errorMessage.toLowerCase().includes('expired');
    
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className={`max-w-md ${isExpired ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              {isExpired ? (
                <Clock className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h2 className="text-white font-medium">
                  {isExpired ? 'Preview Link Expired' : 'Preview Unavailable'}
                </h2>
                <p className="text-white/60 text-sm mt-1">
                  {isExpired 
                    ? 'This preview link has expired. Please request a new link from your agency.'
                    : errorMessage
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { preview, wowButtons, expiry } = data;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <ParticleField accentColor={preview.primaryColor} />
      
      <ExpiryBanner expiry={expiry} />
      
      <div className="relative z-10 pt-16">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${preview.primaryColor}40, ${preview.primaryColor}20)`,
                  border: `1px solid ${preview.primaryColor}50`
                }}
              >
                {preview.logo ? (
                  <img 
                    src={preview.logo} 
                    alt={preview.businessName} 
                    className="w-16 h-16 object-contain rounded-xl"
                  />
                ) : (
                  <Bot className="w-10 h-10" style={{ color: preview.primaryColor }} />
                )}
              </div>
            </div>
            
            <h1 
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ 
                background: `linear-gradient(135deg, ${preview.primaryColor}, white)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
              data-testid="preview-business-name"
            >
              {preview.businessName}
            </h1>
            
            <p className="text-xl text-white/60 mb-2" data-testid="preview-tagline">
              {preview.tagline}
            </p>
            
            <Badge 
              variant="outline" 
              className="border-cyan-500/30 text-cyan-400"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered Assistant Preview
            </Badge>
          </div>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="h-5 w-5" style={{ color: preview.primaryColor }} />
                <h2 className="text-lg font-semibold text-white">Try It Out</h2>
              </div>
              
              <p className="text-white/60 text-sm mb-6">
                Click any button below to start a conversation with the AI assistant, 
                or click the chat icon in the bottom-right corner.
              </p>
              
              <WowButtons 
                buttons={wowButtons} 
                onSend={handleWowButtonClick}
                primaryColor={preview.primaryColor}
              />
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-white/40 text-xs mb-4">
              This is a preview of the AI assistant. Conversations are saved for demo purposes.
            </p>
            
            <div className="flex items-center justify-center gap-2">
              <span className="text-white/30 text-xs">Powered by</span>
              <TreasureCoastLogo className="h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
