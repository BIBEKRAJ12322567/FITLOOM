import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Calendar, RefreshCw, Loader2, ArrowRight, Search } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { gymApi } from '../../api/gymApi';
import { useAuth } from '../../context/AuthContext';
import { openRazorpayCheckout } from '../../utils/checkout';

const STATUS_TONE = { active: 'success', expired: 'danger', frozen: 'warning', cancelled: 'neutral' };

export default function MyGym() {
  const { user } = useAuth();
  const [myGyms, setMyGyms] = useState([]);
  const [myMemberships, setMyMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState(null);
  const [error, setError] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([gymApi.listMine(), gymApi.listMyMemberships()])
      .then(([gyms, memberships]) => {
        setMyGyms(gyms);
        setMyMemberships(memberships);
      })
      .catch((err) => setError(err.response?.data?.error?.message || 'Could not load your gym info.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const handleRenew = async (membershipId) => {
    setRenewingId(membershipId);
    setError('');
    try {
      const result = await gymApi.renewMembership(membershipId);
      if (result.requiresPayment) {
        const membership = myMemberships.find((m) => m._id === membershipId);
        await openRazorpayCheckout({
          razorpayOrder: result.razorpayOrder,
          payment: result.payment,
          userEmail: user?.email,
          userName: user?.profile?.name,
          description: `${membership?.gymId?.name || 'Gym'} — renewal`,
        });
      }
      // Refetch rather than trust result.membership: when a real gateway is
      // configured, that object still holds the PRE-renewal endDate — the
      // extension only happens server-side once checkout is verified above.
      loadData();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Renewal failed.');
    } finally {
      setRenewingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted">
        <Loader2 size={18} className="animate-spin" /> Loading…
      </div>
    );
  }

  const ownedGyms = myGyms.filter((g) => g.myRole === 'owner');
  const staffedGyms = myGyms.filter((g) => g.myRole === 'staff');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-3xl tracking-wide text-chalk">MY GYM</h1>
      {error && <p className="text-sm text-danger">{error}</p>}

      {ownedGyms.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">You own</h2>
          {ownedGyms.map((gym) => (
            <Card key={gym._id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="text-tape" size={20} />
                <span className="font-semibold text-chalk">{gym.name}</span>
              </div>
              <Button as={Link} to={`/app/owner?gymId=${gym._id}`} size="sm" variant="secondary" className="gap-1.5">
                Manage <ArrowRight size={14} />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {staffedGyms.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            You help manage
          </h2>
          {staffedGyms.map((gym) => (
            <Card key={gym._id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="text-tape" size={20} />
                <span className="font-semibold text-chalk">{gym.name}</span>
              </div>
              <Button as={Link} to={`/app/owner?gymId=${gym._id}`} size="sm" variant="secondary" className="gap-1.5">
                Manage <ArrowRight size={14} />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Your memberships</h2>

        {myMemberships.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <Search className="text-tape" size={26} />
            <p className="text-sm text-muted">You haven’t joined a gym yet.</p>
            <Button as={Link} to="/app/gyms" size="sm">
              Find a gym
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {myMemberships.map((m) => (
              <Card key={m._id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link to={`/app/gyms/${m.gymId?._id}`} className="font-semibold text-chalk hover:text-tape">
                      {m.gymId?.name || 'Gym'}
                    </Link>
                    <p className="mt-1 text-sm text-muted">{m.planId?.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                      <Calendar size={12} /> Expires {new Date(m.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge tone={STATUS_TONE[m.status] || 'neutral'}>{m.status}</Badge>
                    <Button
                      onClick={() => handleRenew(m._id)}
                      disabled={renewingId === m._id}
                      size="sm"
                      variant="secondary"
                      className="gap-1.5"
                    >
                      <RefreshCw size={13} /> {renewingId === m._id ? 'Renewing…' : 'Renew'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <Button as={Link} to="/app/gyms" variant="ghost" size="sm">
          Browse more gyms
        </Button>
      </div>
    </div>
  );
}