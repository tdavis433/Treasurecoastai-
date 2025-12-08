export interface WidgetEmbedOptions {
  workspaceSlug: string;
  botId: string;
  primaryColor?: string;
  businessName?: string;
  businessSubtitle?: string;
  showGreetingPopup?: boolean;
  greetingTitle?: string;
  greetingMessage?: string;
  greetingDelay?: number;
  bubbleIcon?: string;
}

export function getWidgetEmbedCode(options: WidgetEmbedOptions): string {
  const {
    workspaceSlug,
    botId,
    primaryColor = "#00E5CC",
    businessName = "AI Assistant",
    businessSubtitle = "Powered by TCAI",
    showGreetingPopup = false,
    greetingTitle = "",
    greetingMessage = "",
    greetingDelay = 3,
    bubbleIcon = "message-circle",
  } = options;

  const scriptUrl = "/widget/embed.js";
  
  let embedCode = `<script
  src="${scriptUrl}"
  data-client-id="${workspaceSlug}"
  data-bot-id="${botId}"
  data-primary-color="${primaryColor}"
  data-business-name="${businessName}"
  data-business-subtitle="${businessSubtitle}"`;

  if (showGreetingPopup) {
    embedCode += `
  data-show-greeting-popup="true"
  data-greeting-title="${greetingTitle || businessName}"
  data-greeting-message="${greetingMessage}"
  data-greeting-delay="${greetingDelay}"`;
  }

  if (bubbleIcon !== "message-circle") {
    embedCode += `
  data-bubble-icon="${bubbleIcon}"`;
  }

  embedCode += `
></script>`;

  return embedCode;
}

export function getMinimalEmbedCode(workspaceSlug: string, botId: string): string {
  return `<script src="/widget/embed.js" data-client-id="${workspaceSlug}" data-bot-id="${botId}"></script>`;
}

export function getEmbedInstructions(): string {
  return `To install your AI assistant widget:
1. Copy the embed code above
2. Paste it just before the closing </body> tag on your website
3. The widget will appear as a floating chat bubble in the bottom-right corner

For advanced customization, you can modify the data attributes:
- data-primary-color: Change the accent color (hex format, e.g., "#00E5CC")
- data-business-name: Set the header title
- data-business-subtitle: Set the subtitle text
- data-show-greeting-popup: Enable proactive greeting ("true" or "false")
- data-greeting-message: Message shown in greeting popup
- data-greeting-delay: Seconds before popup appears (default: 3)
- data-bubble-icon: Icon for the chat bubble (message-circle, house-plus, etc.)`;
}
