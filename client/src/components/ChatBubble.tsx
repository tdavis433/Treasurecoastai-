import { MessageCircle } from "lucide-react";

interface ChatBubbleProps {
  onClick: () => void;
}

export default function ChatBubble({ onClick }: ChatBubbleProps) {
  return (
    <button
      data-testid="button-chat-bubble"
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '40px',
        right: '100px',
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: '#2563eb',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <MessageCircle size={32} />
    </button>
  );
}
