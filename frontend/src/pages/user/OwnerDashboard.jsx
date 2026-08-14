import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Users,
  IndianRupee,
  CalendarCheck,
  Trophy,
  Package,
  Plus,
  Loader2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import KpiCard from '../../components/ui/KpiCard';
import { gymApi } from '../../api/gymApi';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members' },
  { id: 'plans', label: 'Plans' },
  { id: 'products', label: 'Products' },
  { id: 'leaderboard', label: 'Leaderboard' },
];

function RegisterGymForm({ onRegistered }) {
  const [form, setForm] = useState({ name: '', city: '', line1: '', contactPhone: '', facilities: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const gym = await gymApi.register({
        name: form.name,
        address: { city: form.city, line1: form.line1 },
        contactPhone: form.contactPhone,
        facilities: form.facilities
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
      });
      onRegistered(gym._id);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not register your gym.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-lg bg-raised p-2.5 text-tape">
          <Building2 size={22} />
        </span>
        <div>
          <h1 className="font-display text-2xl tracking-wide text-chalk">REGISTER YOUR GYM</h1>
          <p className="text-sm text-muted">Get set up to manage members, plans, and revenue.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Gym name" name="name" required value={form.name} onChange={handleChange} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="City" name="city" value={form.city} onChange={handleChange} />
          <Input label="Contact phone" name="contactPhone" value={form.contactPhone} onChange={handleChange} />
        </div>
        <Input label="Address line" name="line1" value={form.line1} onChange={handleChange} />
        <Input
          label="Facilities (comma-separated)"
          name="facilities"
          placeholder="Cardio zone, Free weights, Locker rooms"
          value={form.facilities}
          onChange={handleChange}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Registering…' : 'Register gym'}
        </Button>
      </form>
    </Card>
  );
}

function AddPlanForm({ gymId, onAdded }) {
  const [form, setForm] = useState({ name: '', durationDays: 30, price: 0, features: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await gymApi.createPlan(gymId, {
        name: form.name,
        durationDays: Number(form.durationDays),
        price: Number(form.price),
        features: form.features.split(',').map((f) => f.trim()).filter(Boolean),
      });
      setForm({ name: '', durationDays: 30, price: 0, features: '' });
      onAdded();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <input
        placeholder="Plan name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        required
        className="col-span-2 rounded-lg border border-steel bg-raised px-3 py-2 text-sm text-chalk focus:border-tape focus:outline-none sm:col-span-1"
      />
      <input
        type="number"
        placeholder="Days"
        value={form.durationDays}
        onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
        className="rounded-lg border border-steel bg-raised px-3 py-2 text-sm text-chalk focus:border-tape focus:outline-none"
      />
      <input
        type="number"
        placeholder="Price ₹"
        value={form.price}
        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
        className="rounded-lg border border-steel bg-raised px-3 py-2 text-sm text-chalk focus:border-tape focus:outline-none"
      />
      <input
        placeholder="Features, comma sep"
        value={form.features}
        onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
        className="col-span-2 rounded-lg border border-steel bg-raised px-3 py-2 text-sm text-chalk focus:border-tape focus:outline-none sm:col-span-1"
      />
      <Button type="submit" size="sm" disabled={submitting} className="gap-1">
        <Plus size={14} /> Add
      </Button>
    </form>
  );
}

function AddProductForm({ gymId, onAdded }) {
  const [form, setForm] = useState({ name: '', price: 0, stockQty: 0 });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await gymApi.createProduct(gymId, {
        name: form.name,
        price: Number(form.price),
        stockQty: Number(form.stockQty),
      });
      setForm({ name: '', price: 0, stockQty: 0 });
      onAdded();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <input
        placeholder="Product name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        required
        className="col-span-2 rounded-lg border border-steel bg-raised px-3 py-2 text-sm text-chalk focus:border-tape focus:outline-none sm:col-span-1"
      />
      <input
        type="number"
        placeholder="Price ₹"
        value={form.price}
        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
        className="rounded-lg border border-steel bg-raised px-3 py-2 text-sm text-chalk focus:border-tape focus:outline-none"
      />
      <input
        type="number"
        placeholder="Stock"
        value={form.stockQty}
        onChange={(e) => setForm((f) => ({ ...f, stockQty: e.target.value }))}
        className="rounded-lg border border-steel bg-raised px-3 py-2 text-sm text-chalk focus:border-tape focus:outline-none"
      />
      <Button type="submit" size="sm" disabled={submitting} className="gap-1">
        <Plus size={14} /> Add
      </Button>
    </form>
  );
}

export default function OwnerDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [resolving, setResolving] = useState(true);
  const [gymId, setGymId] = useState(searchParams.get('gymId'));
  const [activeTab, setActiveTab] = useState('overview');

  const [overview, setOverview] = useState(null);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Resolve which gym to manage: use the URL param if present, otherwise
  // check if the user owns exactly one gym and auto-select it.
  useEffect(() => {
    if (gymId) {
      setResolving(false);
      return;
    }
    gymApi
      .listMine()
      .then((gyms) => {
        if (gyms.length > 0) {
          setGymId(gyms[0]._id);
          setSearchParams({ gymId: gyms[0]._id });
        }
      })
      .finally(() => setResolving(false));
  }, [gymId, setSearchParams]);

  const loadTabData = useCallback(async () => {
    if (!gymId) return;
    setTabLoading(true);
    try {
      if (activeTab === 'overview') setOverview(await gymApi.getOverview(gymId));
      if (activeTab === 'members') setMembers((await gymApi.getMembers(gymId)).members);
      if (activeTab === 'plans') setPlans(await gymApi.listPlans(gymId));
      if (activeTab === 'products') setProducts(await gymApi.listProducts(gymId));
      if (activeTab === 'leaderboard') setLeaderboard(await gymApi.getLeaderboard(gymId));
    } finally {
      setTabLoading(false);
    }
  }, [gymId, activeTab]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  if (resolving) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted">
        <Loader2 size={18} className="animate-spin" /> Loading…
      </div>
    );
  }

  if (!gymId) {
    return (
      <RegisterGymForm
        onRegistered={(newGymId) => {
          setGymId(newGymId);
          setSearchParams({ gymId: newGymId });
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <h1 className="font-display text-3xl tracking-wide text-chalk">GYM MANAGEMENT</h1>

      <div className="flex gap-1 overflow-x-auto border-b border-steel">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'border-tape text-tape' : 'border-transparent text-muted hover:text-chalk'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabLoading && (
        <div className="flex items-center justify-center gap-2 py-10 text-muted">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      )}

      {!tabLoading && activeTab === 'overview' && overview && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard icon={Users} label="Active members" value={String(overview.activeMemberCount)} />
          <KpiCard icon={IndianRupee} label="Total revenue" value={`₹${overview.totalRevenue.toLocaleString()}`} />
          <KpiCard icon={CalendarCheck} label="Today's check-ins" value={String(overview.todayAttendanceCount)} />
        </div>
      )}

      {!tabLoading && activeTab === 'members' && (
        <Card>
          {members.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No active members yet.</p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m._id}
                  className="flex items-center justify-between border-b border-steel/60 pb-2 text-sm last:border-0"
                >
                  <span className="text-chalk">{m.userId?.profile?.name || m.userId?.email}</span>
                  <span className="text-muted">
                    {m.planId?.name} · expires {new Date(m.endDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {!tabLoading && activeTab === 'plans' && (
        <div className="space-y-4">
          <Card>
            <AddPlanForm gymId={gymId} onAdded={loadTabData} />
          </Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {plans.map((plan) => (
              <Card key={plan._id}>
                <h3 className="font-semibold text-chalk">{plan.name}</h3>
                <p className="font-mono text-tape">
                  ₹{plan.price} / {plan.durationDays}d
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!tabLoading && activeTab === 'products' && (
        <div className="space-y-4">
          <Card>
            <AddProductForm gymId={gymId} onAdded={loadTabData} />
          </Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {products.map((product) => (
              <Card key={product._id} className="flex items-center gap-3">
                <Package size={18} className="text-tape" />
                <div>
                  <p className="text-sm font-semibold text-chalk">{product.name}</p>
                  <p className="text-xs text-muted">
                    ₹{product.price} · {product.stockQty} in stock
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!tabLoading && activeTab === 'leaderboard' && (
        <Card>
          {leaderboard.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No attendance recorded in the last 30 days.</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <div key={entry.userId} className="flex items-center justify-between border-b border-steel/60 pb-2 text-sm last:border-0">
                  <span className="flex items-center gap-2 text-chalk">
                    {i < 3 ? <Trophy size={14} className="text-tape" /> : <span className="w-3.5" />}#{i + 1}{' '}
                    {entry.name}
                  </span>
                  <span className="font-mono text-muted">{entry.visitCount} visits</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}