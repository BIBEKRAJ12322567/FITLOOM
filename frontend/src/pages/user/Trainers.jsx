import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, Video, MapPinned } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StarRating from '../../components/ui/StarRating';
import Button from '../../components/ui/Button';
import { trainerApi } from '../../api/trainerApi';

const TABS = [
  { id: 'browse', label: 'Browse' },
  { id: 'bookings', label: 'My Bookings' },
];

const STATUS_TONE = {
  pending: 'warning',
  confirmed: 'success',
  completed: 'neutral',
  cancelled: 'danger',
};

function TrainerCard({ trainer }) {
  return (
    <Link to={`/app/trainers/${trainer._id}`}>
      <Card className="h-full transition-colors hover:border-tape/50">
        <div className="flex items-start justify-between">
          <h3 className="font-display text-xl tracking-wide text-chalk">
            {trainer.userId?.profile?.name || 'Trainer'}
          </h3>
          <span className="font-mono text-sm font-semibold text-tape">₹{trainer.hourlyRate}/hr</span>
        </div>
        <div className="mt-2">
          <StarRating value={trainer.ratingAvg || 0} count={trainer.ratingCount || 0} size={14} />
        </div>
        {trainer.bio && <p className="mt-3 line-clamp-2 text-sm text-muted">{trainer.bio}</p>}
        {trainer.specializations?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {trainer.specializations.slice(0, 4).map((s) => (
              <Badge key={s} tone="tape">
                {s}
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </Link>
  );
}

function BrowseTab() {
  const [trainers, setTrainers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTrainers = useCallback(async (specialization) => {
    setLoading(true);
    setError('');
    try {
      const data = await trainerApi.list(specialization ? { specialization } : undefined);
      setTrainers(data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not load trainers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTrainers(search.trim() || undefined);
  };

  return (
    <div>
      <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by specialization, e.g. strength, mobility…"
            className="w-full rounded-lg border border-steel bg-raised py-2.5 pl-9 pr-4 text-chalk placeholder:text-muted/60 focus:border-tape focus:outline-none"
          />
        </div>
      </form>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted">
          <Loader2 size={18} className="animate-spin" /> Loading trainers…
        </div>
      )}

      {error && <p className="py-8 text-center text-sm text-danger">{error}</p>}

      {!loading && !error && trainers.length === 0 && (
        <p className="py-16 text-center text-sm text-muted">
          No trainers found{search ? ' for that specialization' : ''} yet.
        </p>
      )}

      {!loading && trainers.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trainers.map((t) => (
            <TrainerCard key={t._id} trainer={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBookings(await trainerApi.listMyBookings());
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not load your bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      await trainerApi.updateBookingStatus(bookingId, 'cancelled');
      await load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not cancel this booking.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted">
        <Loader2 size={18} className="animate-spin" /> Loading your bookings…
      </div>
    );
  }

  if (error) return <p className="py-8 text-center text-sm text-danger">{error}</p>;

  if (bookings.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted">
        No sessions booked yet — browse trainers and book one.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <Card key={b._id} className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-chalk">
              {b.trainerId?.userId?.profile?.name || 'Trainer'}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
              {b.sessionMode === 'video' ? <Video size={14} /> : <MapPinned size={14} />}
              {new Date(b.scheduledAt).toLocaleString()} · {b.durationMinutes} min
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-chalk">₹{b.price}</span>
            <Badge tone={STATUS_TONE[b.status] || 'neutral'}>{b.status}</Badge>
            {(b.status === 'pending' || b.status === 'confirmed') && (
              <Button
                variant="ghost"
                size="sm"
                disabled={cancellingId === b._id}
                onClick={() => handleCancel(b._id)}
              >
                {cancellingId === b._id ? 'Cancelling…' : 'Cancel'}
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function Trainers() {
  const [activeTab, setActiveTab] = useState('browse');

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-1 font-display text-3xl tracking-wide text-chalk">TRAINERS</h1>
      <p className="mb-6 text-sm text-muted">Book a session with a trainer, in person or over video.</p>

      <div className="mb-6 flex gap-1 border-b border-steel">
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

      {activeTab === 'browse' ? <BrowseTab /> : <BookingsTab />}
    </div>
  );
}