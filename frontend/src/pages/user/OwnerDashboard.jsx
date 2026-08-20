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
  ShieldCheck,
  Trash2,
  Mail,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import KpiCard from '../../components/ui/KpiCard';
import { gymApi, STAFF_PERMISSIONS } from '../../api/gymApi';

// Each tab lists the permission that unlocks it for a delegated staff
// account. `null` means it's open to anyone with dashboard access
// (leaderboard is already a non-sensitive, non-owner-gated backend route).
// 'owner' means it's never delegable, regardless of permissions granted.
const TABS = [
  { id: 'overview', label: 'Overview', permission: 'view_overview' },
  { id: 'members', label: 'Members', permission: 'manage_members' },
  { id: 'plans', label: 'Plans', permission: 'manage_plans' },
  { id: 'products', label: 'Products', permission: 'manage_products' },
  { id: 'leaderboard', label: 'Leaderboard', permission: null },
  { id: 'staff', label: 'Staff', permission: 'owner' },
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

function InviteStaffForm({ gymId, onInvited }) {
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const togglePermission = (value) => {
    setPermissions((p) => (p.includes(value) ? p.filter((v) => v !== value) : [...p, value]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (permissions.length === 0) {
      setError('Grant at least one permission.');
      return;
    }
    setSubmitting(true);
    try {
      await gymApi.inviteStaff(gymId, { email: email.trim(), permissions });
      setEmail('');
      setPermissions([]);
      onInvited();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not invite that person.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        label="Staff member's email"
        type="email"
        placeholder="them@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <p className="text-xs text-muted">
        They need an existing FitLoom account — ask them to register first if they don't have one.
      </p>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-muted">Permissions</label>
        <div className="flex flex-wrap gap-2">
          {STAFF_PERMISSIONS.map((perm) => (
            <button
              type="button"
              key={perm.value}
              onClick={() => togglePermission(perm.value)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                permissions.includes(perm.value)
                  ? 'border-tape bg-tape/15 text-tape'
                  : 'border-steel bg-raised text-muted hover:text-chalk'
              }`}
            >
              {perm.label}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
        <Mail size={14} /> {submitting ? 'Inviting…' : 'Invite'}
      </Button>
    </form>
  );
}

function StaffRow({ member, gymId, onChanged }) {
  const [busy, setBusy] = useState(false);

  const togglePermission = async (value) => {
    setBusy(true);
    try {
      const next = member.permissions.includes(value)
        ? member.permissions.filter((v) => v !== value)
        : [...member.permissions, value];
      if (next.length === 0) return; // keep at least one permission; use Revoke to fully remove
      await gymApi.updateStaffPermissions(gymId, member._id, next);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    setBusy(true);
    try {
      await gymApi.removeStaff(gymId, member._id);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-chalk">
            {member.userId?.profile?.name || member.userId?.email}
          </p>
          <p className="text-xs text-muted">{member.userId?.email}</p>
        </div>
        <Button variant="danger" size="sm" onClick={revoke} disabled={busy} className="gap-1.5">
          <Trash2 size={13} /> Revoke
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {STAFF_PERMISSIONS.map((perm) => {
          const active = member.permissions.includes(perm.value);
          return (
            <button
              key={perm.value}
              type="button"
              disabled={busy}
              onClick={() => togglePermission(perm.value)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                active
                  ? 'border-tape bg-tape/15 text-tape'
                  : 'border-steel bg-raised text-muted hover:text-chalk'
              }`}
            >
              {perm.label}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function StaffTab({ gymId }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    gymApi
      .listStaff(gymId)
      .then(setStaff)
      .finally(() => setLoading(false));
  }, [gymId]);

  useEffect(load, [load]);

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck size={18} className="text-tape" />
          <h3 className="font-semibold text-chalk">Invite staff</h3>
        </div>
        <InviteStaffForm gymId={gymId} onInvited={load} />
      </Card>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-muted">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : staff.filter((s) => s.status === 'active').length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">No delegated staff yet.</p>
      ) : (
        <div className="space-y-3">
          {staff
            .filter((s) => s.status === 'active')
            .map((member) => (
              <StaffRow key={member._id} member={member} gymId={gymId} onChanged={load} />
            ))}
        </div>
      )}
    </div>
  );
}

export default function OwnerDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [resolving, setResolving] = useState(true);
  const [gymId, setGymId] = useState(searchParams.get('gymId'));
  const [activeTab, setActiveTab] = useState('overview');
  const [myGyms, setMyGyms] = useState([]);

  const [overview, setOverview] = useState(null);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Always fetch listMine — even when gymId already came from the URL —
  // because it's how we learn whether the current user is this gym's
  // owner (full access) or a delegated staffer (access limited to
  // myPermissions), which decides which tabs render at all.
  useEffect(() => {
    gymApi
      .listMine()
      .then((gyms) => {
        setMyGyms(gyms);
        if (!gymId && gyms.length > 0) {
          setGymId(gyms[0]._id);
          setSearchParams({ gymId: gyms[0]._id });
        }
      })
      .finally(() => setResolving(false));
    // Only run once on mount / when the URL's gymId first resolves — myGyms
    // itself doesn't need to change if the user just switches tabs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myAccess = myGyms.find((g) => g._id === gymId);
  const isOwner = myAccess?.myRole === 'owner';
  const myPermissions = myAccess?.myPermissions || [];

  const visibleTabs = TABS.filter((tab) => {
    if (tab.permission === 'owner') return isOwner;
    if (tab.permission === null) return true;
    return isOwner || myPermissions.includes(tab.permission);
  });

  // If the current tab isn't visible once access is known (e.g. a staffer
  // without view_overview lands on the default 'overview' tab), fall back
  // to the first tab they actually have access to.
  useEffect(() => {
    if (myAccess && !visibleTabs.some((t) => t.id === activeTab) && visibleTabs.length > 0) {
      setActiveTab(visibleTabs[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myAccess, activeTab]);

  const loadTabData = useCallback(async () => {
    if (!gymId) return;
    setTabLoading(true);
    try {
      if (activeTab === 'overview') setOverview(await gymApi.getOverview(gymId));
      if (activeTab === 'members') setMembers((await gymApi.getMembers(gymId)).members);
      if (activeTab === 'plans') setPlans(await gymApi.listPlans(gymId));
      if (activeTab === 'products') setProducts(await gymApi.listProducts(gymId));
      if (activeTab === 'leaderboard') setLeaderboard(await gymApi.getLeaderboard(gymId));
      // 'staff' tab manages its own data fetching in <StaffTab>.
    } finally {
      setTabLoading(false);
    }
  }, [gymId, activeTab]);

  useEffect(() => {
    if (activeTab !== 'staff') loadTabData();
  }, [loadTabData, activeTab]);

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
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl tracking-wide text-chalk">GYM MANAGEMENT</h1>
        {myAccess && (
          <Badge tone={isOwner ? 'tape' : 'neutral'}>{isOwner ? 'Owner' : 'Staff'}</Badge>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-steel">
        {visibleTabs.map((tab) => (
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

      {activeTab === 'staff' && isOwner && <StaffTab gymId={gymId} />}
    </div>
  );
}