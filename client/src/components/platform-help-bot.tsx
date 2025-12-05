import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles,
  Bot,
  User,
  Loader2,
  ChevronDown,
  Zap
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PlatformHelpBotProps {
  variant?: 'landing' | 'demo' | 'dashboard';
  className?: string;
}

const PLATFORM_KNOWLEDGE = `You are the Treasure Coast AI Platform Assistant - an incredibly helpful, friendly, and knowledgeable AI that helps users understand and navigate the Treasure Coast AI platform.

## About Treasure Coast AI
Treasure Coast AI is a premium, agency-managed AI assistant platform for local businesses. We BUILD and MANAGE custom AI assistants powered by GPT-4 for businesses - they don't have to do anything technical. It's a fully managed service.

## Core Concept
- Agency-managed service: Tyler (the agency) builds and manages ALL bots
- Clients get VIEW-ONLY dashboards to see their conversations, leads, and bookings
- No self-service bot creation - we handle everything for the client
- Premium experience with white-glove service

## Key Features
1. **Custom AI Assistants**: GPT-4 powered assistants trained on each business's specific info
2. **Lead Capture**: Automatically captures names, emails, and phone numbers
3. **Appointment Booking**: AI handles scheduling and booking requests
4. **24/7 Availability**: Bots work around the clock, never taking breaks
5. **Client Dashboard**: View-only analytics showing conversations, leads, and bookings
6. **Fully Managed**: We handle all setup, training, and ongoing management

## Pricing (Approximate)
- Starter: $297/month - 1 bot, 500 conversations, basic features
- Professional: $497/month - 1 bot, unlimited conversations, advanced features
- Enterprise: Custom pricing - multiple bots, white-label, dedicated support

## How It Works
1. Business shares their info (services, hours, FAQs, etc.)
2. We build and configure their custom AI assistant
3. We deploy the widget on their website
4. They log into their dashboard to see results

## Technical Details (for curious users)
- Powered by OpenAI GPT-4
- Embeddable chat widget for any website
- Real-time conversation analytics
- Secure, encrypted data handling
- Professional glassmorphism design with cyan/purple accents

## Your Personality
- Be incredibly helpful, friendly, and enthusiastic
- Use simple language - no technical jargon unless asked
- Be confident about the platform's capabilities
- If you don't know something, offer to connect them with the team
- Keep responses concise but informative
- Never use emojis in your responses

## Common Questions You Should Handle
- What is Treasure Coast AI?
- How does the AI assistant work?
- What's included in each pricing tier?
- How long does setup take? (48-72 hours typically)
- Can I customize my bot's personality?
- How do I see my leads and conversations?
- What industries do you serve?
- How do I get started?

Always be positive and solution-oriented. If someone wants to get started, direct them to fill out the contact form or mention they can reach out for a consultation.`;

const QUICK_QUESTIONS = [
  "What is Treasure Coast AI?",
  "How much does it cost?",
  "How does the AI work?",
  "How do I get started?"
];

export function PlatformHelpBot({ variant = 'landing', className = '' }: PlatformHelpBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollButton(!isNearBottom && messages.length > 3);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/platform-help/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          history: messages.map(m => ({ role: m.role, content: m.content })),
          context: variant
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment, or feel free to reach out to our team directly through the contact form!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'dashboard':
        return {
          button: 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400',
          header: 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20',
          accent: 'text-cyan-400'
        };
      case 'demo':
        return {
          button: 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400',
          header: 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20',
          accent: 'text-purple-400'
        };
      default:
        return {
          button: 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400',
          header: 'bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10',
          accent: 'text-cyan-400'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`fixed z-50 ${className}`} style={{ bottom: '24px', right: '24px' }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-20 right-0 w-[380px] max-w-[calc(100vw-48px)] rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'rgba(11, 14, 19, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 60px rgba(0, 229, 204, 0.1)'
            }}
          >
            {/* Header */}
            <div className={`px-5 py-4 ${styles.header} border-b border-white/10`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0B0E13]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">Treasure Coast AI</h3>
                    <p className="text-xs text-white/60 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-green-400" />
                      Powered by GPT-4
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                  data-testid="button-close-help-bot"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="relative">
              <ScrollArea 
                className="h-[340px] px-4 py-4" 
                onScrollCapture={handleScroll}
                ref={scrollAreaRef}
              >
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center py-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                        <Bot className="w-8 h-8 text-cyan-400" />
                      </div>
                      <h4 className="text-white font-medium mb-1">Hey there!</h4>
                      <p className="text-white/60 text-sm">
                        I'm here to help you learn about our AI assistant platform. Ask me anything!
                      </p>
                    </div>
                    
                    {/* Quick Questions */}
                    <div className="space-y-2">
                      <p className="text-xs text-white/40 uppercase tracking-wide px-1">Quick questions</p>
                      <div className="grid gap-2">
                        {QUICK_QUESTIONS.map((question, i) => (
                          <button
                            type="button"
                            key={i}
                            onClick={() => sendMessage(question)}
                            className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-white/80 text-sm transition-all duration-200 group"
                            data-testid={`button-quick-question-${i}`}
                          >
                            <span className="group-hover:text-cyan-400 transition-colors">{question}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                              : 'bg-white/10 text-white/90 border border-white/10'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === 'user' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-white/70" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                            <span className="text-sm text-white/60">Thinking...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Scroll to bottom button */}
              <AnimatePresence>
                {showScrollButton && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={scrollToBottom}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 p-2 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/30">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50 transition-all"
                  data-testid="input-help-bot-message"
                />
                <Button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="h-12 w-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-send-help-message"
                >
                  <Send className="w-5 h-5 text-white" />
                </Button>
              </div>
            </div>

            {/* Powered by footer */}
            <div className="px-4 py-2 text-center border-t border-white/5 bg-black/20">
              <span className="text-[10px] text-white/30">
                Powered by <span className="text-white/50 font-medium">Treasure Coast AI</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-14 h-14 rounded-2xl ${styles.button} shadow-lg flex items-center justify-center group`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          boxShadow: isOpen 
            ? '0 0 30px rgba(0, 229, 204, 0.3)' 
            : '0 8px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 229, 204, 0.15)'
        }}
        data-testid="button-toggle-help-bot"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <MessageCircle className="w-6 h-6 text-white" />
              {messages.length === 0 && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Tooltip when closed */}
      <AnimatePresence>
        {!isOpen && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ delay: 1, duration: 0.3 }}
            className="absolute bottom-16 right-0 whitespace-nowrap"
          >
            <div 
              className="px-4 py-2 rounded-xl text-sm font-medium text-white shadow-lg"
              style={{
                background: 'rgba(11, 14, 19, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Questions? I can help!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PlatformHelpBot;
