import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Building2,
  IndianRupee,
  Dumbbell,
  Search,
  Ban,
  CheckCircle2,
  Star,
  Trash2,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import KpiCard from '../../components/ui/KpiCard';
import { adminApi } from '../../api/adminApi';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'gyms', label: 'Gyms' },
  { id: 'reviews', label: 'Reviews' },
];

function OverviewTab() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminApi.getStats().then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-muted">
        <Loader2 size={16} className="animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <KpiCard icon={Users} label="Total Users" value={stats.totalUsers} />
      <KpiCard icon={Building2} label="Total Gyms" value={stats.totalGyms} />
      <KpiCard icon={Dumbbell} label="Active Memberships" value={stats.activeMemberships} />
      <KpiCard icon={IndianRupee} label="Platform Revenue" value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`} />
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .listUsers({ search: search || undefined, limit: 50 })
      .then((data) => setUsers(data.users))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(load, [load]);

  const toggleSuspend = async (user) => {
    setBusyId(user._id);
    try {
      await adminApi.setUserSuspension(user._id, !user.isSuspended);
      setUsers((list) => list.map((u) => (u._id === user._id ? { ...u, isSuspended: !u.isSuspended } : u)));
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err.response?.data?.error?.message || 'Could not update this account.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-muted">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u._id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-chalk">{u.profile?.name || u.email}</p>
                <p className="truncate text-xs text-muted">{u.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone="neutral">{u.role}</Badge>
                  {u.isSuspended && <Badge tone="danger">Suspended</Badge>}
                </div>
              </div>
              <Button
                size="sm"
                variant={u.isSuspended ? 'secondary' : 'danger'}
                disabled={busyId === u._id || u.role === 'admin'}
                onClick={() => toggleSuspend(u)}
                className="shrink-0 gap-1.5"
              >
                {u.isSuspended ? (
                  <>
                    <CheckCircle2 size={13} /> Unsuspend
                  </>
                ) : (
                  <>
                    <Ban size={13} /> Suspend
                  </>
                )}
              </Button>
            </Card>
          ))}
          {users.length === 0 && <p className="py-6 text-center text-sm text-muted">No users found.</p>}
        </div>
      )}
    </div>
  );
}

function GymsTab() {
  const [gyms, setGyms] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .listGyms({ search: search || undefined, limit: 50 })
      .then((data) => setGyms(data.gyms))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(load, [load]);

  const toggleSuspend = async (gym) => {
    setBusyId(gym._id);
    try {
      await adminApi.setGymSuspension(gym._id, !gym.isSuspended);
      setGyms((list) => list.map((g) => (g._id === gym._id ? { ...g, isSuspended: !g.isSuspended } : g)));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search gyms by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-muted">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-2">
          {gyms.map((g) => (
            <Card key={g._id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-chalk">{g.name}</p>
                <p className="truncate text-xs text-muted">
                  Owner: {g.ownerId?.profile?.name || g.ownerId?.email || 'unknown'}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone="neutral">{g.subscriptionPlan}</Badge>
                  {g.isSuspended && <Badge tone="danger">Suspended</Badge>}
                </div>
              </div>
              <Button
                size="sm"
                variant={g.isSuspended ? 'secondary' : 'danger'}
                disabled={busyId === g._id}
                onClick={() => toggleSuspend(g)}
                className="shrink-0 gap-1.5"
              >
                {g.isSuspended ? (
                  <>
                    <CheckCircle2 size={13} /> Unsuspend
                  </>
                ) : (
                  <>
                    <Ban size={13} /> Suspend
                  </>
                )}
              </Button>
            </Card>
          ))}
          {gyms.length === 0 && <p className="py-6 text-center text-sm text-muted">No gyms found.</p>}
        </div>
      )}
    </div>
  );
}

function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .listReviews({ limit: 50 })
      .then((data) => setReviews(data.reviews))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const handleDelete = async (reviewId) => {
    setBusyId(reviewId);
    try {
      await adminApi.deleteReview(reviewId);
      setReviews((list) => list.filter((r) => r._id !== reviewId));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-muted">
        <Loader2 size={16} className="animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reviews.map((r) => (
        <Card key={r._id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-chalk">{r.gymId?.name || 'Unknown gym'}</span>
                <span className="flex items-center gap-0.5 text-xs text-tape">
                  <Star size={12} fill="currentColor" /> {r.rating}
                </span>
              </div>
              <p className="text-xs text-muted">by {r.userId?.profile?.name || r.userId?.email || 'unknown'}</p>
              {r.comment && <p className="mt-1.5 text-sm text-chalk">{r.comment}</p>}
            </div>
            <Button
              size="sm"
              variant="danger"
              disabled={busyId === r._id}
              onClick={() => handleDelete(r._id)}
              className="shrink-0 gap-1.5"
            >
              <Trash2 size={13} /> Remove
            </Button>
          </div>
        </Card>
      ))}
      {reviews.length === 0 && <p className="py-6 text-center text-sm text-muted">No reviews yet.</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-raised p-2.5 text-tape">
          <ShieldAlert size={22} />
        </span>
        <div>
          <h1 className="font-display text-3xl tracking-wide text-chalk">ADMIN</h1>
          <p className="text-sm text-muted">Platform-wide moderation and stats.</p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-steel">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'border-tape text-tape'
                : 'border-transparent text-muted hover:text-chalk'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'gyms' && <GymsTab />}
      {activeTab === 'reviews' && <ReviewsTab />}
    </div>
  );
}