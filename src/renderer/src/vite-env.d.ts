/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ArchetypeOption {
  id: string;
  name: string;
  description: string;
  personalityTraits: string[];
  exampleDialogueStyle: string;
}

interface AestheticOption {
  id: string;
  name: string;
  description: string;
  toneWords: string[];
}

interface CharacterConfig {
  archetypeId: string;
  aestheticId: string;
}

interface BotControlAPI {
  getState: () => Promise<{
    enabled: boolean;
    selectedChats: { mode: string; from?: number; to?: number };
    newChatReply: string;
    newSnapAction: string;
    characterConfig: CharacterConfig | null;
    characterEnabled: boolean;
    selectors: Record<string, string>;
  }>;
  setState: (patch: Record<string, unknown>) => Promise<void>;
  getStatus: () => Promise<{
    connected: boolean;
    lastCycle: string | null;
    error: string | null;
  }>;
  getArchetypes: () => Promise<ArchetypeOption[]>;
  getAesthetics: () => Promise<AestheticOption[]>;
  getExampleCharacters: () => Promise<{ name: string; description: string; archetypeId: string; aestheticId: string }[]>;
  getCharacterConfig: (userId: string | null) => Promise<{ config: CharacterConfig | null; enabled: boolean }>;
  setCharacterConfig: (
    userId: string | null,
    config: CharacterConfig | null,
    enabled?: boolean
  ) => Promise<void>;
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
