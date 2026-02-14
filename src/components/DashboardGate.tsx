import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { WelcomeLetterModal } from './WelcomeLetterModal';
import { DashboardLayout } from './DashboardLayout';

export function DashboardGate() {
  const { user } = useAuth();
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  const hasSeenWelcome = (user?.user_metadata as { has_seen_welcome?: boolean })?.has_seen_welcome === true;
  const showWelcome = !hasSeenWelcome && !welcomeDismissed;

  if (showWelcome) {
    return <WelcomeLetterModal onEnter={() => setWelcomeDismissed(true)} />;
  }

  return <DashboardLayout />;
}
