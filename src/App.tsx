import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          !user ? (
            <LoginScreen onSuccess={() => {}} />
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
  );
}

export default App;
