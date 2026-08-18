import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
 
const ROLES = [
  { value: 'user', label: 'Member' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'gym_owner', label: 'Gym owner' },
];
const VALID_ROLE_VALUES = ROLES.map((r) => r.value);
 
export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Lets links like /register?role=gym_owner (e.g. the "I run a gym" page)
  // land with that role pre-selected. Falls back to 'user' for anything
  // missing or not a valid registerable role.
  const requestedRole = searchParams.get('role');
  const initialRole = VALID_ROLE_VALUES.includes(requestedRole) ? requestedRole : 'user';
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: initialRole });
  const [formError, setFormError] = useState('');
 
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
 
    if (form.password !== form.confirmPassword) {
      setFormError("Passwords don't match.");
      return;
    }
    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
 
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      // Gym owners and trainers have nowhere useful to go from the generic
      // member dashboard — send them straight to their own setup page.
      const destinations = { gym_owner: '/app/owner', trainer: '/app/trainer-studio' };
      const destination = destinations[form.role] || '/app/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setFormError(err.message);
    }
  };
 
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-display text-3xl tracking-wide text-chalk">
          <Dumbbell className="text-tape" size={26} />
          FITLOOM
        </Link>
 
        <div className="rounded-2xl border border-steel bg-panel p-8">
          <h1 className="mb-1 font-display text-3xl tracking-wide text-chalk">CREATE ACCOUNT</h1>
          <p className="mb-6 text-sm text-muted">Start training smarter today — free to join.</p>
 
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full name" name="name" required value={form.name} onChange={handleChange} />
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
            />
 
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">I am a</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                      form.role === r.value
                        ? 'border-tape bg-tape/15 text-tape'
                        : 'border-steel bg-raised text-muted hover:text-chalk'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
 
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
            />
            <Input
              label="Confirm password"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
            />
 
            {formError && <p className="text-sm text-danger">{formError}</p>}
 
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
 
          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-tape hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}