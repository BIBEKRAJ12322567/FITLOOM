import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Video, MapPinned, CheckCircle2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import StarRating from '../../components/ui/StarRating';
import { trainerApi } from '../../api/trainerApi';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DURATIONS = [30, 45, 60, 90];

export default function TrainerDetail() {
  const { trainerId } = useParams();
  const navigate = useNavigate();

  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [sessionMode, setSessionMode] = useState('video');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setTrainer(await trainerApi.getDetail(trainerId));
    } catch (err) {
      setLoadError(err.response?.data?.error?.message || 'Could not load this trainer.');
    } finally {
      setLoading(false);
    }
  }, [trainerId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBook = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!date || !time) {
      setFormError('Pick a date and time.');
      return;
    }

    const scheduledAt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      setFormError('Pick a time in the future.');
      return;
    }

    setSubmitting(true);
    try {
      await trainerApi.book(trainerId, {
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: Number(duration),
        sessionMode,
      });
      setSuccess(true);
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Could not book this session.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted">
        <Loader2 size={18} className="animate-spin" /> Loading trainer…
      </div>
    );
  }

  if (loadError || !trainer) {
    return <p className="py-16 text-center text-sm text-danger">{loadError || 'Trainer not found.'}</p>;
  }

  const availabilityByDay = DAY_NAMES.map((name, i) => ({
    name,
    slots: (trainer.availability || []).filter((s) => s.dayOfWeek === i),
  })).filter((d) => d.slots.length > 0);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-wide text-chalk">
              {trainer.userId?.profile?.name || 'Trainer'}
            </h1>
            <div className="mt-1.5">
              <StarRating value={trainer.ratingAvg || 0} count={trainer.ratingCount || 0} size={15} />
            </div>
          </div>
          <span className="font-mono text-2xl font-semibold text-tape">₹{trainer.hourlyRate}/hr</span>
        </div>

        {trainer.bio && <p className="mt-4 text-sm text-muted">{trainer.bio}</p>}

        {trainer.specializations?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {trainer.specializations.map((s) => (
              <Badge key={s} tone="tape">
                {s}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Weekly availability</p>
          {availabilityByDay.length === 0 ? (
            <p className="text-sm text-muted">No availability set yet.</p>
          ) : (
            <div className="space-y-1.5">
              {availabilityByDay.map((d) => (
                <div key={d.name} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-chalk">{d.name}</span>
                  <span className="text-muted">
                    {d.slots.map((s) => `${s.startTime}–${s.endTime}`).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-display text-xl tracking-wide text-chalk">BOOK A SESSION</h2>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 size={40} className="text-success" />
            <p className="text-chalk">Session booked — waiting on the trainer to confirm.</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/app/trainers')}>
              View my bookings
            </Button>
          </div>
        ) : (
          <form onSubmit={handleBook} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted">Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().slice(0, 10)}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-steel bg-raised px-4 py-2.5 text-chalk focus:border-tape focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted">Time</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-lg border border-steel bg-raised px-4 py-2.5 text-chalk focus:border-tape focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                      duration === d
                        ? 'border-tape bg-tape/15 text-tape'
                        : 'border-steel bg-raised text-muted hover:text-chalk'
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Session type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSessionMode('video')}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    sessionMode === 'video'
                      ? 'border-tape bg-tape/15 text-tape'
                      : 'border-steel bg-raised text-muted hover:text-chalk'
                  }`}
                >
                  <Video size={16} /> Video
                </button>
                <button
                  type="button"
                  onClick={() => setSessionMode('in_person')}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    sessionMode === 'in_person'
                      ? 'border-tape bg-tape/15 text-tape'
                      : 'border-steel bg-raised text-muted hover:text-chalk'
                  }`}
                >
                  <MapPinned size={16} /> In person
                </button>
              </div>
            </div>

            <p className="text-xs text-muted">
              Estimated price: ₹{Math.round(((trainer.hourlyRate * duration) / 60) * 100) / 100} for{' '}
              {duration} minutes.
            </p>

            {formError && <p className="text-sm text-danger">{formError}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Booking…' : 'Book session'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}