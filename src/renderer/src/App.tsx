import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { TitleBar } from './components/TitleBar';
import { LoginScreen } from './features/auth/LoginScreen';
import { DashboardGate } from './components/DashboardGate';
import { DashboardPlaceholder } from './components/DashboardPlaceholder';
import { Chat, ChatIndex } from './features/chat/Chat';
import { ChatRoom } from './features/chat/ChatRoom';
import { OnlyFansSecrets } from './features/onlyfans-secrets/OnlyFansSecrets';
import { OnlyFansSecretsHome } from './features/onlyfans-secrets/OnlyFansSecretsHome';
import { OnlyFansSecretsChapter } from './features/onlyfans-secrets/OnlyFansSecretsChapter';
import { SnapBotPage } from './features/snapbot/SnapBotPage';
import { TridentCRM } from './features/trident-crm/TridentCRM';
import { Settings } from './features/settings/Settings';

function App() {
  const { user, loading } = useAuth();

  const isMac = typeof window !== 'undefined' && (window as Window & { electronAPI?: { platform: string } }).electronAPI?.platform === 'darwin';

  if (loading) {
    return (
      <>
        <TitleBar />
        <div className={`h-screen flex flex-col overflow-hidden bg-surface-950 ${isMac ? 'pt-12' : ''}`}>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <p className="text-gray-400">Loading…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TitleBar />
      <div className={`h-screen overflow-hidden flex flex-col bg-surface-950 ${isMac ? 'pt-12' : ''}`}>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <Routes>
      <Route
        path="/"
        element={
          !user ? (
            <LoginScreen
              onSuccess={() => {
                (window as Window & { electronAPI?: { enterFullScreen?: () => void } }).electronAPI?.enterFullScreen?.();
              }}
            />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route
        path="/dashboard"
        element={user ? <DashboardGate /> : <Navigate to="/" replace />}
      >
        <Route index element={<DashboardPlaceholder title="Select a tool" />} />
        <Route path="chat" element={<Chat />}>
          <Route index element={<ChatIndex />} />
          <Route path=":roomSlug" element={<ChatRoom />} />
        </Route>
        <Route path="onlyfans-secrets" element={<OnlyFansSecrets />}>
          <Route index element={<OnlyFansSecretsHome />} />
          <Route path="chapters/:chapterId" element={<OnlyFansSecretsChapter />} />
        </Route>
        <Route path="snapbot" element={<SnapBotPage />} />
        <Route path="trident-crm" element={<TridentCRM />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default App;
