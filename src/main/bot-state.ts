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
  /** Friends Feed container (Snapchat); used to find virtualized list */
  friendsFeed?: string;
  /** Virtualized list (Snapchat); scrollable list of chats */
  virtualList?: string;
  /** Search input (e.g. for finding a user) */
  searchInput?: string;
  /** Message list container (e.g. ul holding chat messages) */
  messageList?: string;
  /** Selectors for message text inside a list item (comma-separated) */
  messageBubble?: string;
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
  groqApiKey: '' as string,
  selectedChats: { mode: 'range' as const, from: 1, to: 100 } as SelectedChats,
  newChatReply: 'hey',
  newSnapAction: 'view',
  characterConfig: null as CharacterConfig | null,
  characterEnabled: false,
  selectors: {
    chatList: 'div[aria-label="Friends Feed"], [role="list"]',
    chatItem: '[role="listitem"]',
    inputBox:
      '[role="textbox"][contenteditable="true"], .euyIb, .kS3a, [contenteditable="true"]',
    sendButton:
      'div.qfM button, div.shMO3 button, div.shMO3 [role="button"], .fCmUn button, button[aria-label*="Send" i], [aria-label="Send"], button[type="submit"]',
    messageContent: 'div[dir="auto"]',
    portal: '#portal-container',
    friendsFeed: 'div[aria-label="Friends Feed"]',
    virtualList: '.ReactVirtualized__Grid.ReactVirtualized__List, .ReactVirtualized_Grid.ReactVirtualized_List, [role="list"]',
    searchInput: 'input[role="search"], input[aria-label="Search"], input.kS3a',
    messageList: 'ul.ujRzj',
    messageBubble: 'span[dir="auto"], span.ogn1z, .p8r1z span, div[dir="auto"]',
  } as BotSelectors,
  lastStatus: {
    connected: false,
    lastCycle: null as string | null,
    error: null as string | null,
  } as LastStatus,
};
