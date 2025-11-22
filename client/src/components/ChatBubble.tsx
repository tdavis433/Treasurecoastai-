import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatBubbleProps {
  onClick: () => void;
}

export default function ChatBubble({ onClick }: ChatBubbleProps) {
  return (
    <Button
      data-testid="button-chat-bubble"
      onClick={onClick}
      size="icon"
      className="fixed bottom-8 right-12 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 z-50 md:bottom-10 md:right-16"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
}
