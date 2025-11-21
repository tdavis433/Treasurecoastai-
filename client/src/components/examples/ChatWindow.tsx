import ChatWindow from '../ChatWindow';
import { useState } from 'react';

export default function ChatWindowExample() {
  const [messages] = useState([
    { role: 'assistant' as const, content: "Hi, I'm HopeLine Assistant. I'm here to support your journey to recovery. How can I help you today?" },
    { role: 'user' as const, content: 'Tell me about the program' },
    { role: 'assistant' as const, content: 'The Faith House is a structured sober-living environment designed to support individuals in their recovery journey. We provide safe housing, accountability, and a supportive community.' },
  ]);

  return (
    <ChatWindow
      isOpen={true}
      onClose={() => console.log('Close clicked')}
      messages={messages}
      onSendMessage={(msg) => console.log('Send message:', msg)}
      onMenuClick={(option) => console.log('Menu clicked:', option)}
      isLoading={false}
      showMenu={true}
    />
  );
}
