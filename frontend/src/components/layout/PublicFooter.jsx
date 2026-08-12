import { Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
 
const COLUMNS = [
  {
    title: 'Product',
    links: [
      { to: '/fitness', label: 'Fitness' },
      { to: '/gym', label: 'Gym' },
      { to: '/trainers', label: 'Trainers' },
      { to: '/pricing', label: 'Pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About' },
      { to: '/login', label: 'Log in' },
      { to: '/register', label: 'Create account' },
    ],
  },
];
 
export default function PublicFooter() {
  return (
    <footer className="border-t border-steel bg-panel">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 font-display text-2xl tracking-wide text-chalk">
              <Dumbbell className="text-tape" size={22} />
              FITLOOM
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted">
              Train. Track. Improve. Repeat. — AI-guided workouts, gym management, and trainer
              coaching, woven into one platform.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-muted hover:text-chalk">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-steel pt-6 text-xs text-muted">
          © {new Date().getFullYear()} FitLoom. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
 