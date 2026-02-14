import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getProfile } from '../lib/chat';
import type { Profile } from '../lib/chat';
import { SetUsernameModal } from './SetUsernameModal';
import { WelcomeLetterModal } from './WelcomeLetterModal';
import { DashboardLayout } from './DashboardLayout';

export function DashboardGate() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [usernameSet, setUsernameSet] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProfile()
      .then((p) => setProfile(p ?? null))
      .catch(() => setProfile(null));
  }, [user]);

  const hasSeenWelcome = (user?.user_metadata as { has_seen_welcome?: boolean })?.has_seen_welcome === true;
  const needsUsername =
    profile !== undefined &&
    (profile === null || !profile.display_name || profile.display_name.trim() === '');
  const showUsername = needsUsername && !usernameSet;
  const showWelcome = !showUsername && !hasSeenWelcome && !welcomeDismissed;

  if (profile === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (showUsername) {
    return (
      <SetUsernameModal
        onComplete={() => {
          setUsernameSet(true);
          getProfile().then((p) => setProfile(p ?? null));
        }}
      />
    );
  }

  if (showWelcome) {
    return <WelcomeLetterModal onEnter={() => setWelcomeDismissed(true)} />;
  }

  return <DashboardLayout />;
}
