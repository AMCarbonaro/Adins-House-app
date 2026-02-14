import { useEffect, useRef, useState } from 'react';

const isElectron = typeof window !== 'undefined' && !!(window as Window & { snapbot?: unknown }).snapbot;

export function SnapBotPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<{
    connected: boolean;
    lastCycle: string | null;
    error: string | null;
  }>({ connected: false, lastCycle: null, error: null });
  const [enabled, setEnabled] = useState(false);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(100);

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
    };

    const refreshStatus = async () => {
      const st = await window.botControl!.getStatus();
      setStatus(st);
    };

    loadState();
    refreshStatus();
    const interval = setInterval(refreshStatus, 3000);
    return () => clearInterval(interval);
  }, []);

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
