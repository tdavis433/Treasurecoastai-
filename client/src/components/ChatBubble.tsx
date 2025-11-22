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
      className="fixed h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-110 transition-all duration-300 z-[9999]"
      style={{ bottom: '40px', right: '100px' }}
    >
      <MessageCircle className="h-8 w-8" />
    </Button>
  );
}
