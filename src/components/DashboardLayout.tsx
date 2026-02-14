import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DASHBOARD_NAV, DASHBOARD_SETTINGS_PATH } from '../config/dashboardNav';

export function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-surface-950">
      <aside className="w-56 flex flex-col bg-surface-900/50 border-r border-white/5">
        <div className="p-4 border-b border-white/5">
          <span className="block font-semibold text-white">Step Bro</span>
          <span className="block text-xs text-brand-400/80">by Adin Zander</span>
        </div>
        <nav className="flex-1 p-2" aria-label="Main">
          <ul className="space-y-1">
            {DASHBOARD_NAV.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-500/20 text-brand-300'
                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="relative p-2 border-t border-white/5" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200 truncate"
          >
            {user?.email ?? 'Account'}
          </button>
          {userMenuOpen && (
            <div
              className="absolute bottom-full left-0 right-0 mb-2 bg-surface-800 border border-white/10 rounded-lg shadow-xl py-1 z-50"
              role="menu"
            >
              <NavLink
                to={DASHBOARD_SETTINGS_PATH}
                className="block px-3 py-2 text-sm text-gray-200 hover:bg-white/5"
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
              >
                Settings
              </NavLink>
              <button
                type="button"
                className="block w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-white/5 text-red-400"
                role="menuitem"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
