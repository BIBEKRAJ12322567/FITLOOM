import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
 
export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState('');
 
  const redirectTo = location.state?.from?.pathname || '/app/dashboard';
 
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await login(form);
      navigate(redirectTo, { replace: true });
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
          <h1 className="mb-1 font-display text-3xl tracking-wide text-chalk">WELCOME BACK</h1>
          <p className="mb-6 text-sm text-muted">Log in to pick up where you left off.</p>
 
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
            />
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
            />
 
            {formError && <p className="text-sm text-danger">{formError}</p>}
 
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in…' : 'Log in'}
            </Button>
          </form>
 
          <p className="mt-6 text-center text-sm text-muted">
            New here?{' '}
            <Link to="/register" className="font-semibold text-tape hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
 