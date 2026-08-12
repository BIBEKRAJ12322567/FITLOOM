import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Dumbbell, Menu, X } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
 
const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/fitness', label: 'Fitness' },
  { to: '/gym', label: 'Gym' },
  { to: '/trainers', label: 'Trainers' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
];
 
export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
 
  return (
    <header className="sticky top-0 z-40 border-b border-steel bg-floor/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl tracking-wide text-chalk">
          <Dumbbell className="text-tape" size={22} />
          FITLOOM
        </Link>
 
        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-tape' : 'text-muted hover:text-chalk'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
 
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Button as={Link} to="/app/dashboard" size="sm">
              Go to dashboard
            </Button>
          ) : (
            <>
              <Button as={Link} to="/login" variant="ghost" size="sm">
                Log in
              </Button>
              <Button as={Link} to="/register" size="sm">
                Start free
              </Button>
            </>
          )}
        </div>
 
        <button
          className="text-chalk md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>
 
      {open && (
        <div className="border-t border-steel bg-floor px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-tape' : 'text-muted'}`}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-2 flex gap-3 border-t border-steel pt-4">
              {isAuthenticated ? (
                <Button as={Link} to="/app/dashboard" size="sm" className="w-full">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button as={Link} to="/login" variant="secondary" size="sm" className="w-full">
                    Log in
                  </Button>
                  <Button as={Link} to="/register" size="sm" className="w-full">
                    Start free
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}