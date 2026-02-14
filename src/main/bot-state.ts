// Shared state for the bot — control panel reads/writes, bot reads only.

export interface SelectedChats {
  mode: 'all' | 'range';
  from?: number;
  to?: number;
}

export interface BotSelectors {
  chatList?: string;
  chatItem?: string;
  inputBox?: string;
  sendButton?: string;
  messageContent?: string;
  portal?: string;
}

export interface LastStatus {
  connected: boolean;
  lastCycle: string | null;
  error: string | null;
}

export interface CharacterConfig {
  archetypeId: string;
  aestheticId: string;
}

export const botState = {
  enabled: false,
  selectedChats: { mode: 'range' as const, from: 1, to: 100 } as SelectedChats,
  newChatReply: 'hey',
  newSnapAction: 'view',
  characterConfig: null as CharacterConfig | null,
  characterEnabled: false,
  selectors: {
    chatList: '[role="list"]',
    chatItem: '[role="listitem"]',
    inputBox:
      '[role="textbox"][contenteditable="true"], .euyIb, [contenteditable="true"]',
    sendButton:
      'div.shMO3 button, div.shMO3 [role="button"], .fCmUn button, button[aria-label*="Send" i], [aria-label="Send"], button[type="submit"]',
    messageContent: 'div[dir="auto"]',
    portal: '#portal-container',
  } as BotSelectors,
  lastStatus: {
    connected: false,
    lastCycle: null as string | null,
    error: null as string | null,
  } as LastStatus,
};
