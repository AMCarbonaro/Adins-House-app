import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const isElectron = typeof window !== 'undefined' && !!(window as Window & { snapbot?: unknown }).snapbot;

export function SnapBotPage() {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<{
    connected: boolean;
    lastCycle: string | null;
    error: string | null;
  }>({ connected: false, lastCycle: null, error: null });
  const [enabled, setEnabled] = useState(false);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(100);
  const [archetypes, setArchetypes] = useState<{ id: string; name: string; description: string }[]>([]);
  const [aesthetics, setAesthetics] = useState<{ id: string; name: string; description: string }[]>([]);
  const [examples, setExamples] = useState<{ name: string; description: string; archetypeId: string; aestheticId: string }[]>([]);
  const [archetypeId, setArchetypeId] = useState<string>('');
  const [aestheticId, setAestheticId] = useState<string>('');
  const [characterEnabled, setCharacterEnabled] = useState(false);
  const [characterUpdated, setCharacterUpdated] = useState(false);

  useEffect(() => {
    if (!isElectron || !window.snapbot) return;
    window.snapbot.show();

    const updateBounds = () => {
      const el = containerRef.current;
      if (!el || !window.snapbot) return;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        window.snapbot.setBounds(
          rect.left,
          rect.top,
          rect.width,
          rect.height
        );
      }
    };

    // Defer first bounds so layout is complete
    let ro: ResizeObserver | null = null;
    const id = requestAnimationFrame(() => {
      updateBounds();
      ro = new ResizeObserver(updateBounds);
      if (containerRef.current) ro.observe(containerRef.current);
    });

    return () => {
      cancelAnimationFrame(id);
      ro?.disconnect();
      window.snapbot?.hide();
    };
  }, []);

  useEffect(() => {
    if (!isElectron || !window.botControl) return;

    const loadState = async () => {
      const s = await window.botControl!.getState();
      setEnabled(s.enabled);
      if (s.selectedChats?.mode === 'range') {
        setFrom(s.selectedChats.from ?? 1);
        setTo(s.selectedChats.to ?? 100);
      }
      if (s.characterConfig) {
        setArchetypeId(s.characterConfig.archetypeId);
        setAestheticId(s.characterConfig.aestheticId);
      }
      if (s.characterEnabled !== undefined) setCharacterEnabled(s.characterEnabled);
    };

    const loadCharacterOptions = async () => {
      const [arch, aest, ex] = await Promise.all([
        window.botControl!.getArchetypes(),
        window.botControl!.getAesthetics(),
        window.botControl!.getExampleCharacters(),
      ]);
      setArchetypes(arch);
      setAesthetics(aest);
      setExamples(ex);
    };

    const loadCharacterConfig = async () => {
      const { config: cfg, enabled } = await window.botControl!.getCharacterConfig(user?.id ?? null);
      if (cfg) {
        setArchetypeId(cfg.archetypeId);
        setAestheticId(cfg.aestheticId);
      }
      setCharacterEnabled(enabled ?? false);
      if (cfg || enabled !== undefined) {
        await window.botControl!.setCharacterConfig(user?.id ?? null, cfg ?? null, enabled);
      }
    };

    const refreshStatus = async () => {
      const st = await window.botControl!.getStatus();
      setStatus(st);
    };

    loadState();
    loadCharacterOptions();
    loadCharacterConfig();
    refreshStatus();
    const interval = setInterval(refreshStatus, 3000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleToggle = async () => {
    if (!window.botControl) return;
    const next = !enabled;
    await window.botControl.setState({ enabled: next });
    setEnabled(next);
  };

  const handleSaveRange = async () => {
    if (!window.botControl) return;
    await window.botControl.setState({
      selectedChats: { mode: 'range', from, to },
    });
  };

  const showCharacterUpdated = () => {
    setCharacterUpdated(true);
    setTimeout(() => setCharacterUpdated(false), 2000);
  };

  const handleCharacterToggle = async () => {
    if (!window.botControl) return;
    const next = !characterEnabled;
    const config = archetypeId && aestheticId ? { archetypeId, aestheticId } : null;
    await window.botControl.setState({ characterEnabled: next });
    await window.botControl.setCharacterConfig(user?.id ?? null, next ? config : null, next);
    setCharacterEnabled(next);
    showCharacterUpdated();
  };

  const handleArchetypeOrAestheticChange = async (newArchetypeId?: string, newAestheticId?: string) => {
    if (!window.botControl || !characterEnabled) return;
    const arch = newArchetypeId !== undefined ? newArchetypeId : archetypeId;
    const aest = newAestheticId !== undefined ? newAestheticId : aestheticId;
    const config = arch && aest ? { archetypeId: arch, aestheticId: aest } : null;
    await window.botControl.setCharacterConfig(user?.id ?? null, config, true);
    await window.botControl.setState({ characterConfig: config, characterEnabled: true });
    showCharacterUpdated();
  };

  const handlePickExample = async (ex: { archetypeId: string; aestheticId: string }) => {
    setArchetypeId(ex.archetypeId);
    setAestheticId(ex.aestheticId);
    if (window.botControl) {
      await window.botControl.setCharacterConfig(user?.id ?? null, {
        archetypeId: ex.archetypeId,
        aestheticId: ex.aestheticId,
      }, true);
      await window.botControl.setState({ characterConfig: { archetypeId: ex.archetypeId, aestheticId: ex.aestheticId }, characterEnabled: true });
      setCharacterEnabled(true);
      showCharacterUpdated();
    }
  };

  const hasCharacterSelection = archetypeId && aestheticId;

  if (!isElectron) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <p className="text-gray-400 mb-4">
            SnapBot runs in the Step Bro desktop app. Build and open the app to use it.
          </p>
          <p className="text-sm text-gray-500">
            Run <code className="bg-surface-800 px-2 py-1 rounded">npx electron .</code> after
            starting the dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="w-[340px] flex-shrink-0 flex flex-col p-6 border-r border-white/5 bg-surface-900/30 overflow-y-auto">
        <h2 className="text-lg font-bold text-white mb-6">SnapBot Controls</h2>

        <div
          className={`flex items-center justify-between p-4 rounded-xl mb-5 transition ${
            enabled
              ? 'bg-green-500/10 border border-green-500/30'
              : 'bg-surface-800 border border-white/5'
          }`}
        >
          <span
            className={`font-semibold ${enabled ? 'text-green-400' : 'text-gray-400'}`}
          >
            {enabled ? 'Bot ON' : 'Bot OFF'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={handleToggle}
            className={`relative w-14 h-7 rounded-full transition ${
              enabled ? 'bg-green-500' : 'bg-surface-600'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Chats to respond to
          </label>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <input
              type="number"
              min={1}
              value={from}
              onChange={(e) => setFrom(parseInt(e.target.value, 10) || 1)}
              className="px-4 py-3 rounded-lg bg-surface-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              placeholder="From"
            />
            <input
              type="number"
              min={1}
              value={to}
              onChange={(e) => setTo(parseInt(e.target.value, 10) || 100)}
              className="px-4 py-3 rounded-lg bg-surface-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              placeholder="To"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveRange}
            className="w-full py-2.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-gray-300 text-sm font-medium transition"
          >
            Save range
          </button>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Character & aesthetic
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Pick an archetype and aesthetic. Toggle on to use your character. Either way, replies stay reserved and brief.
          </p>
          {examples.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {examples.map((ex) => (
                <button
                  key={ex.name}
                  type="button"
                  onClick={() => handlePickExample(ex)}
                  title={ex.description}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-gray-300 text-xs font-medium transition"
                >
                  {ex.name}
                </button>
              ))}
            </div>
          )}
          <select
            value={archetypeId}
            onChange={(e) => {
              const v = e.target.value;
              setArchetypeId(v);
              handleArchetypeOrAestheticChange(v, undefined);
            }}
            className="w-full px-4 py-3 rounded-lg mb-2 bg-surface-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
          >
            <option value="">— Archetype —</option>
            {archetypes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            value={aestheticId}
            onChange={(e) => {
              const v = e.target.value;
              setAestheticId(v);
              handleArchetypeOrAestheticChange(undefined, v);
            }}
            className="w-full px-4 py-3 rounded-lg mb-3 bg-surface-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
          >
            <option value="">— Aesthetic —</option>
            {aesthetics.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <div
            className={`flex items-center justify-between p-4 rounded-xl mb-2 transition ${
              characterEnabled
                ? 'bg-brand-500/10 border border-brand-500/30'
                : 'bg-surface-800 border border-white/5'
            }`}
          >
            <span
              className={`font-semibold text-sm ${
                characterEnabled ? 'text-brand-400' : 'text-gray-400'
              }`}
            >
              {characterEnabled ? 'Character ON' : 'Character OFF'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={characterEnabled}
              onClick={handleCharacterToggle}
              className={`relative w-14 h-7 rounded-full transition ${
                characterEnabled ? 'bg-brand-500' : 'bg-surface-600'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  characterEnabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {characterUpdated && (
            <p className="text-xs text-green-400 font-medium animate-pulse">Updated</p>
          )}
          {hasCharacterSelection && characterEnabled && (
            <p className="mt-1 text-xs text-gray-500">
              {archetypes.find((a) => a.id === archetypeId)?.name} + {aesthetics.find((a) => a.id === aestheticId)?.name}
            </p>
          )}
        </div>

        <div className="mb-5 p-3 rounded-xl bg-surface-800/50 border border-white/5 text-xs text-gray-500 leading-relaxed">
          <strong className="text-gray-400">Tip:</strong> The bot only sees chats
          that are currently loaded. Scroll down your chat list so those
          conversations load—then the bot can recognize and reply to them.
        </div>

        <div
          className={`p-4 rounded-xl text-sm border-l-4 ${
            status.error
              ? 'bg-red-500/10 border-red-500 text-red-300'
              : status.connected
                ? 'bg-surface-800 border-green-500/50 text-gray-300'
                : 'bg-surface-800 border-gray-500 text-gray-500'
          }`}
        >
          <span
            className={`inline-block w-2 h-2 rounded-full mr-2 ${
              status.error ? 'bg-red-500' : status.connected ? 'bg-green-500' : 'bg-gray-500'
            }`}
          />
          {status.error
            ? status.error
            : status.connected
              ? status.lastCycle || 'Connected · Scanning chats'
              : 'Waiting for Snapchat…'}
        </div>
      </aside>

      <div
        ref={containerRef}
        className="flex-1 min-w-0 bg-surface-950 relative"
        style={{ minHeight: 400 }}
      />
    </div>
  );
}
