/**
 * Draggable title bar for macOS (hiddenInset window).
 * Provides a region to drag the window since the native title bar is hidden.
 */
declare const window: Window & { electronAPI?: { platform: string } };

export function TitleBar() {
  const isMac = typeof window !== 'undefined' && window.electronAPI?.platform === 'darwin';
  if (!isMac) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-12 z-[9999]"
      style={{
        WebkitAppRegion: 'drag',
        // Leave space for traffic lights on the left
        paddingLeft: 78,
      }}
    />
  );
}
