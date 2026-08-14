import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Dumbbell,
  Library,
  LineChart,
  Sparkles,
  Salad,
  Calculator,
  Building2,
  Search,
  Users,
  UserCircle,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_SECTIONS = [
  {
    label: 'Train',
    items: [
      { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/app/workout', label: 'Workout', icon: Dumbbell },
      { to: '/app/exercises', label: 'Exercises', icon: Library },
      { to: '/app/progress', label: 'Progress', icon: LineChart },
    ],
  },
  {
    label: 'AI Coach',
    items: [
      { to: '/app/ai-coach', label: 'AI Coach', icon: Sparkles },
      { to: '/app/diet-plan', label: 'Diet Plan', icon: Salad },
      { to: '/app/calculators/bmi', label: 'Calculators', icon: Calculator },
    ],
  },
  {
    label: 'Gym',
    items: [
      { to: '/app/my-gym', label: 'My Gym', icon: Building2 },
      { to: '/app/gyms', label: 'Find a Gym', icon: Search },
      { to: '/app/trainers', label: 'Trainers', icon: Users },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const isGymOwner = user?.role === 'gym_owner';

  const sections = isGymOwner
    ? [
        ...NAV_SECTIONS,
        {
          label: 'Manage',
          items: [{ to: '/app/owner', label: 'Gym Management', icon: Settings }],
        },
      ]
    : NAV_SECTIONS;

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-steel bg-panel transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-steel px-6">
          <Dumbbell className="text-tape" size={22} />
          <span className="font-display text-2xl tracking-wide text-chalk">FITLOOM</span>
        </div>

        <nav className="space-y-6 overflow-y-auto px-3 py-6" style={{ height: 'calc(100vh - 4rem)' }}>
          {sections.map((section) => (
            <div key={section.label}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive ? 'bg-tape/15 text-tape' : 'text-muted hover:bg-raised hover:text-chalk'
                      }`
                    }
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
          <div className="border-t border-steel pt-4">
            <NavLink
              to="/app/profile"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-tape/15 text-tape' : 'text-muted hover:bg-raised hover:text-chalk'
                }`
              }
            >
              <UserCircle size={18} />
              Profile
            </NavLink>
          </div>
        </nav>
      </aside>
    </>
  );
}