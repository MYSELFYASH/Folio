import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Goal, LayoutList, Library, LogOut, Moon, Sun, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const THEME_KEY = 'folio_theme';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      root.removeAttribute('data-theme');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [dark]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const nav = [
    { to: '/library', label: 'My Books', icon: Library },
    { to: '/goals', label: 'Goals & Stats', icon: Goal },
    { to: '/lists', label: 'Collections', icon: LayoutList },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink">
      {/* ── Top bar ── */}
      <header className="h-14 shrink-0 border-b border-border bg-cream/95 backdrop-blur-sm sticky top-0 z-40 flex items-center px-6 gap-6">
        {/* Logo */}
        <Link
          to="/library"
          className="flex items-center gap-2 font-serif text-xl font-medium text-ink shrink-0 hover:text-terra transition-colors"
        >
          <BookOpen className="h-5 w-5 text-terra" />
          fo.lio
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-terra/10 text-terra'
                    : 'text-ink2 hover:text-ink hover:bg-cream2'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="h-8 w-8 rounded-full flex items-center justify-center text-ink2 hover:text-ink hover:bg-cream2 transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User info + logout */}
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border">
            <Link to="/profile" className="flex items-center gap-2 hover:bg-cream2 px-2 py-1 rounded-md transition-colors" title="Settings & Profile">
              <div className="h-7 w-7 rounded-full bg-terra/15 flex items-center justify-center shrink-0">
                <span className="text-terra text-xs font-medium uppercase">
                  {user?.username?.[0] || 'U'}
                </span>
              </div>
              <span className="text-sm text-ink2 font-medium max-w-[100px] truncate">
                {user?.username}
              </span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="ml-1 h-7 w-7 rounded-md flex items-center justify-center text-ink3 hover:text-terra hover:bg-cream2 transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden text-ink2 hover:text-ink transition-colors"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </header>

      {/* Mobile dropdown nav */}
      {menuOpen && (
        <div className="md:hidden bg-cream border-b border-border px-4 py-2 space-y-1 z-30">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive ? 'bg-terra/10 text-terra' : 'text-ink2 hover:bg-cream2'
                )
              }
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
          <div className="flex items-center justify-between pt-2 pb-1 border-t border-border mt-2">
            <span className="text-sm text-ink2">{user?.username}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-ink3 hover:text-terra flex items-center gap-1"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export function LayoutShell({ children }) {
  return <div className="min-h-screen bg-cream text-ink">{children}</div>;
}
