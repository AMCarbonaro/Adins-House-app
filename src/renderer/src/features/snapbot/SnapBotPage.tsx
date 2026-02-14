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
  const [archetypeId, setArchetypeId] = useState<string>('');
  const [characterEnabled, setCharacterEnabled] = useState(false);
  const [characterUpdated, setCharacterUpdated] = useState(false);
  const [rangeSaved, setRangeSaved] = useState(false);
  const [selectorCheck, setSelectorCheck] = useState<{
    chatList: boolean;
    chatItemCount: number;
    input: boolean;
    send: boolean;
    search: boolean;
    messageList: boolean;
  } | null>(null);

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
      if (s.characterConfig) setArchetypeId(s.characterConfig.archetypeId);
      if (s.characterEnabled !== undefined) setCharacterEnabled(s.characterEnabled);
    };

    const loadCharacterOptions = async () => {
      const arch = await window.botControl!.getArchetypes();
      setArchetypes(arch);
    };

    const refreshStatus = async () => {
      const st = await window.botControl!.getStatus();
      setStatus(st);
    };

    loadState();
    loadCharacterOptions();
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
    setRangeSaved(true);
    setTimeout(() => setRangeSaved(false), 2000);
  };

  const handleCharacterToggle = async () => {
    if (!window.botControl) return;
    const next = !characterEnabled;
    const config = archetypeId ? { archetypeId, aestheticId: '' } : null;
    await window.botControl.setState({ characterEnabled: next, characterConfig: next ? config : null });
    setCharacterEnabled(next);
    setCharacterUpdated(true);
    setTimeout(() => setCharacterUpdated(false), 2000);
  };

  const handleArchetypeChange = async (newId: string) => {
    setArchetypeId(newId);
    if (!window.botControl || !characterEnabled) return;
    const config = newId ? { archetypeId: newId, aestheticId: '' } : null;
    await window.botControl.setState({ characterConfig: config, characterEnabled: true });
    setCharacterUpdated(true);
    setTimeout(() => setCharacterUpdated(false), 2000);
  };

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
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition ${
              rangeSaved
                ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                : 'bg-brand-500/20 border border-brand-500/30 hover:bg-brand-500/30 text-brand-300'
            }`}
          >
            {rangeSaved ? '✓ Updated' : 'Update Range'}
          </button>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Character
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Pick a character for the bot's personality. Replies always stay reserved and brief.
          </p>
          <select
            value={archetypeId}
            onChange={(e) => handleArchetypeChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg mb-3 bg-surface-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
          >
            <option value="">— Select Character —</option>
            {archetypes.map((a) => (
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
          {archetypeId && characterEnabled && (
            <p className="mt-1 text-xs text-gray-500">
              {archetypes.find((a) => a.id === archetypeId)?.name}
            </p>
          )}
        </div>

        <div className="mb-5 p-3 rounded-xl bg-surface-800/50 border border-white/5 text-xs text-gray-500 leading-relaxed">
          <strong className="text-gray-400">Tip:</strong> The bot only sees chats
          that are currently loaded. Scroll down your chat list so those
          conversations load—then the bot can recognize and reply to them.
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Selector check
          </label>
          <p className="text-xs text-gray-500 mb-2">
            See if the bot can find chat list, input, and send button on the current page.
          </p>
          <button
            type="button"
            onClick={async () => {
              const result = await window.botControl?.checkSelectors?.();
              if (result && 'ok' in result && result.ok) {
                setSelectorCheck({
                  chatList: result.chatList,
                  chatItemCount: result.chatItemCount,
                  input: result.input,
                  send: result.send,
                  search: result.search,
                  messageList: result.messageList,
                });
              } else {
                setSelectorCheck(null);
              }
            }}
            className="w-full py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-gray-400 text-xs font-medium transition border border-white/5 mb-2"
          >
            Check selectors
          </button>
          {selectorCheck !== null && (
            <div className="p-3 rounded-lg bg-surface-800/80 border border-white/5 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className={selectorCheck.chatList ? 'text-green-400' : 'text-red-400'}>
                  {selectorCheck.chatList ? '✓' : '✗'}
                </span>
                <span className="text-gray-400">Chat list</span>
                {selectorCheck.chatList && (
                  <span className="text-gray-500">({selectorCheck.chatItemCount} items)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={selectorCheck.input ? 'text-green-400' : 'text-red-400'}>
                  {selectorCheck.input ? '✓' : '✗'}
                </span>
                <span className="text-gray-400">Input</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={selectorCheck.send ? 'text-green-400' : 'text-red-400'}>
                  {selectorCheck.send ? '✓' : '✗'}
                </span>
                <span className="text-gray-400">Send button</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={selectorCheck.messageList ? 'text-green-400' : 'text-amber-400'}>
                  {selectorCheck.messageList ? '✓' : '○'}
                </span>
                <span className="text-gray-400">Message list</span>
                <span className="text-gray-500">(when chat open)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={selectorCheck.search ? 'text-green-400' : 'text-gray-500'}>
                  {selectorCheck.search ? '✓' : '○'}
                </span>
                <span className="text-gray-400">Search</span>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={async () => {
            if (!window.botControl?.debugDOM) return;
            const info = await window.botControl.debugDOM();
            console.log('🔍 SnapBot DOM Debug:', JSON.stringify(info, null, 2));
            const scan = await window.botControl.debugScan?.();
            if (scan) console.log('🔍 Visible Chats Scan:', JSON.stringify(scan, null, 2));
            alert(`Lists found: ${info?.roleLists ?? 0}\nURL: ${info?.url ?? '?'}\nTall divs: ${info?.tallDivs?.length ?? 0}\nScan items: ${scan?.totalListitems ?? '?'} raw, ${scan?.afterFilter ?? '?'} after filter\n\nCheck DevTools console for full output.`);
          }}
          className="w-full mb-5 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-gray-500 text-xs font-medium transition border border-white/5"
        >
          🔍 Debug DOM
        </button>

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
