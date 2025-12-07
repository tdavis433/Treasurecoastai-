import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TreasureCoastLogo } from "@/components/treasure-coast-logo";
import { 
  MessageCircle, 
  Calendar, 
  BarChart3,
  Sparkles,
  ArrowRight, 
  TestTube2,
  ExternalLink,
  CheckCircle2,
  Zap,
  ClipboardList
} from "lucide-react";

export default function DemoFaithHouse() {
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/widget/embed.js";
    script.async = true;
    script.dataset.clientId = "faith_house_demo";
    script.dataset.botId = "faith_house_demo_main";
    script.dataset.theme = "dark";
    script.dataset.primaryColor = "#06b6d4";
    script.dataset.greeting = "Hi! I'm the Faith House AI assistant. How can I help you today?";
    
    script.onload = () => {
      setWidgetLoaded(true);
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      const widgetBubble = document.getElementById("tcai-bubble");
      const widgetIframe = document.getElementById("tcai-iframe");
      if (widgetBubble) widgetBubble.remove();
      if (widgetIframe) widgetIframe.remove();
      if (window.TreasureCoastAI) {
        window.TreasureCoastAI.initialized = false;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0b0d] via-[#0d0f12] to-[#0a0b0d]">
      <div id="faith-house-demo-widget" data-testid="faith-house-demo-widget" />
      
      <header className="border-b border-white/10 bg-[#0a0b0d]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <TreasureCoastLogo variant="full" size="md" />
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                className="bg-amber-500/20 text-amber-400 border-amber-400/40"
                data-testid="badge-demo-header"
              >
                <TestTube2 className="h-3 w-3 mr-1" />
                LIVE DEMO
              </Badge>
              <Button variant="outline" size="sm" className="border-white/20 text-white/70 hover:text-white hover:bg-white/10" asChild>
                <a href="/login" className="flex items-center gap-2">
                  Staff Login
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-6">
            <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-400/30">
              <Sparkles className="h-3 w-3 mr-1" />
              Treasure Coast AI - Live Demo
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Faith House Sober Living
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mt-2">
                Powered by Treasure Coast AI
              </span>
            </h1>
            
            <p className="text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
              Faith House is a structured men's sober living home in Port St. Lucie.
              This is a <strong className="text-white/80">live AI assistant demo</strong> showing how 
              Treasure Coast AI handles inquiries, tours, and phone call scheduling.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-white/70">24/7 AI assistant</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <CheckCircle2 className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-white/70">Instant tour booking</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-sm text-white/70">Live dashboard</span>
            </div>
          </div>

          <div 
            className="max-w-lg mx-auto p-4 rounded-xl bg-amber-500/10 border border-amber-400/20 backdrop-blur-sm"
            data-testid="demo-info-banner"
          >
            <div className="flex items-start gap-3">
              <TestTube2 className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-amber-400">Demo Environment</p>
                <p className="text-sm text-white/50 mt-1">
                  Click the <span className="text-cyan-400 font-medium">chat bubble</span> in the bottom-right corner to try the AI assistant!
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg shadow-cyan-500/25" asChild>
              <a href="/client/dashboard" className="flex items-center gap-2">
                View Demo Dashboard
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" size="lg" className="border-white/20 text-white/70 hover:text-white hover:bg-white/10" asChild>
              <a href="https://treasurecoastai.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                Learn More
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-24 pt-16 border-t border-white/5">
          <div className="text-center mb-12">
            <Badge className="bg-purple-500/15 text-purple-400 border-purple-400/30 mb-4">
              Platform Features
            </Badge>
            <h2 className="text-3xl font-bold text-white">
              What Treasure Coast AI Delivers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/[0.02] border-white/10 backdrop-blur-sm hover:border-cyan-500/30 transition-colors">
              <CardContent className="pt-8 pb-6 px-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center mb-5 border border-cyan-500/20">
                  <MessageCircle className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">24/7 AI Conversations</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Your AI assistant never sleeps. It answers questions, provides information, and 
                  captures leads around the clock - even when your team is offline.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-white/10 backdrop-blur-sm hover:border-purple-500/30 transition-colors">
              <CardContent className="pt-8 pb-6 px-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center mb-5 border border-purple-500/20">
                  <Calendar className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Instant Tour & Call Bookings</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  The AI collects visitor information naturally and creates structured bookings 
                  for tours or phone calls - no forms needed.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-white/10 backdrop-blur-sm hover:border-green-500/30 transition-colors">
              <CardContent className="pt-8 pb-6 px-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center mb-5 border border-green-500/20">
                  <BarChart3 className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Live Dashboard & Analytics</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Track every conversation, lead, and booking in real-time. Get insights into 
                  what visitors are asking and how your AI is performing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-20 p-8 rounded-2xl bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-cyan-500/5 border border-white/5">
          <div className="text-center mb-8">
            <Badge className="bg-white/5 text-white/60 border-white/10 mb-3">
              <Zap className="h-3 w-3 mr-1" />
              Under the Hood
            </Badge>
            <h3 className="text-xl font-semibold text-white">How It Works</h3>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-white/10">
              <MessageCircle className="h-5 w-5 text-cyan-400" />
              <span className="text-sm text-white/70">Visitor chats with AI</span>
            </div>
            <ArrowRight className="h-5 w-5 text-white/20 rotate-90 md:rotate-0" />
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-white/10">
              <ClipboardList className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-white/70">AI collects booking info</span>
            </div>
            <ArrowRight className="h-5 w-5 text-white/20 rotate-90 md:rotate-0" />
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-white/10">
              <Calendar className="h-5 w-5 text-green-400" />
              <span className="text-sm text-white/70">Booking created (tour/call)</span>
            </div>
            <ArrowRight className="h-5 w-5 text-white/20 rotate-90 md:rotate-0" />
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-white/10">
              <BarChart3 className="h-5 w-5 text-amber-400" />
              <span className="text-sm text-white/70">Appears in dashboard</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TreasureCoastLogo variant="icon" size="sm" />
              <span className="text-sm text-white/40">
                Treasure Coast AI - Empowering Local Businesses
              </span>
            </div>
            <p className="text-xs text-white/30">
              Demo featuring Faith House Sober Living - Port St. Lucie, FL
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

declare global {
  interface Window {
    TreasureCoastAI?: {
      initialized: boolean;
      config: Record<string, unknown>;
      fullConfig: Record<string, unknown> | null;
      iframe: HTMLIFrameElement | null;
      bubble: HTMLDivElement | null;
      isOpen: boolean;
      open: () => void;
      close: () => void;
      toggle: () => void;
    };
  }
}
