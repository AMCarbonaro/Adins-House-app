/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface BotControlAPI {
  getState: () => Promise<{
    enabled: boolean;
    selectedChats: { mode: string; from?: number; to?: number };
    newChatReply: string;
    newSnapAction: string;
    selectors: Record<string, string>;
  }>;
  setState: (patch: Record<string, unknown>) => Promise<void>;
  getStatus: () => Promise<{
    connected: boolean;
    lastCycle: string | null;
    error: string | null;
  }>;
}

interface SnapbotAPI {
  show: () => Promise<boolean>;
  hide: () => Promise<boolean>;
  setBounds: (x: number, y: number, width: number, height: number) => Promise<void>;
}

declare global {
  interface Window {
    botControl?: BotControlAPI;
    snapbot?: SnapbotAPI;
  }
}
