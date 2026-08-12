import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const firstName = user?.profile?.name?.split(' ')[0] || 'there';

  return (
    <header className="flex h-16 items-center justify-between border-b border-steel bg-panel/60 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button className="text-chalk lg:hidden" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <h1 className="font-display text-xl tracking-wide text-chalk sm:text-2xl">
          WELCOME BACK, {firstName.toUpperCase()}
        </h1>
      </div>

      <button
        onClick={logout}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-chalk"
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Log out</span>
      </button>
    </header>
  );
}
