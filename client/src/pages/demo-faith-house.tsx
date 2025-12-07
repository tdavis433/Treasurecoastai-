import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  MessageCircle, 
  Calendar, 
  Phone, 
  Shield, 
  Users, 
  ArrowRight, 
  TestTube2,
  ExternalLink 
} from "lucide-react";

export default function DemoFaithHouse() {
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/widget/embed.js";
    script.async = true;
    script.dataset.clientId = "faith_house_demo";
    script.dataset.botId = "faith_house_demo_main";
    script.dataset.theme = "dark";
    script.dataset.position = "inline";
    script.dataset.containerId = "widget-container";
    
    script.onload = () => {
      setWidgetLoaded(true);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      const widgetElement = document.getElementById("tc-ai-widget");
      if (widgetElement) {
        widgetElement.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0b0d]">
      <header className="border-b border-white/10 bg-[#0a0b0d]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Faith House</h1>
                <p className="text-xs text-white/50">Sober Living Residence</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                className="bg-amber-500/20 text-amber-400 border-amber-400/40"
                data-testid="badge-demo-header"
              >
                <TestTube2 className="h-3 w-3 mr-1" />
                DEMO MODE
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <a href="/login" className="flex items-center gap-2">
                  Staff Login
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-400/40">
                FARR Certified Recovery Residence
              </Badge>
              
              <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
                Your Journey to Recovery Starts Here
              </h2>
              
              <p className="text-lg text-white/60">
                The Faith House is a structured sober living environment designed to support 
                men in their recovery journey. Our 24/7 AI assistant is here to answer your 
                questions and help you take the next step.
              </p>
            </div>

            <div 
              className="p-4 rounded-lg bg-amber-500/10 border border-amber-400/30"
              data-testid="demo-info-banner"
            >
              <div className="flex items-start gap-3">
                <TestTube2 className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-400">Demo Environment</p>
                  <p className="text-xs text-white/60 mt-1">
                    This is a demonstration of the Faith House AI assistant. Try chatting to 
                    see how it helps potential residents learn about the program, book tours, 
                    and schedule phone calls. All data here is for demo purposes only.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-6">
                  <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-3">
                    <Calendar className="h-5 w-5 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Book a Tour</h3>
                  <p className="text-sm text-white/50">
                    Schedule an in-person visit to see our facility
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-6">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                    <Phone className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Phone Call</h3>
                  <p className="text-sm text-white/50">
                    Request a call with our team to discuss options
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-6">
                  <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
                    <Shield className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">24/7 Support</h3>
                  <p className="text-sm text-white/50">
                    AI assistant available around the clock
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-6">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
                    <Users className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Community</h3>
                  <p className="text-sm text-white/50">
                    Join a supportive recovery community
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white">
                <a href="https://www.thefaithhouse.net" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  Visit Website
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="lg">
                <a href="tel:7727220008" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  (772) 722-0008
                </a>
              </Button>
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#1a1d23] shadow-2xl">
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-b border-white/10">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">Faith House Assistant</h3>
                  <p className="text-xs text-white/50">Online • Demo Mode</p>
                </div>
                <Badge 
                  className="ml-auto bg-amber-500/20 text-amber-400 border-amber-400/40"
                  data-testid="badge-demo-widget"
                >
                  DEMO
                </Badge>
              </div>
              
              <div 
                id="widget-container" 
                ref={widgetRef}
                className="h-[500px] bg-[#0f1115]"
                data-testid="widget-container-demo"
              >
                {!widgetLoaded && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto mb-3" />
                      <p className="text-sm text-white/50">Loading chat assistant...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-white/40 text-center mt-4">
              Powered by Treasure Coast AI • Demo conversations are not saved
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              The Faith House • Port St. Lucie, Florida • FARR Certified
            </p>
            <div className="flex items-center gap-4">
              <a href="mailto:thefaithhouse.info@gmail.com" className="text-sm text-white/40 hover:text-white/60">
                thefaithhouse.info@gmail.com
              </a>
              <span className="text-white/20">•</span>
              <a href="tel:7727220008" className="text-sm text-white/40 hover:text-white/60">
                (772) 722-0008
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
