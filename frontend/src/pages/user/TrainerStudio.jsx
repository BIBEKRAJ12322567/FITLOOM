import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Trash2, Video, MapPinned } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { trainerApi } from '../../api/trainerApi';

const DAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const STATUS_TONE = {
  pending: 'warning',
  confirmed: 'success',
  completed: 'neutral',
  cancelled: 'danger',
};

function emptyForm() {
  return { bio: '', specializations: '', hourlyRate: '', availability: [] };
}

function formFromProfile(profile) {
  return {
    bio: profile.bio || '',
    specializations: (profile.specializations || []).join(', '),
    hourlyRate: profile.hourlyRate ?? '',
    availability: (profile.availability || []).map((s) => ({ ...s })),
  };
}

export default function TrainerStudio() {
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await trainerApi.getMyProfile();
      setForm(formFromProfile(profile));
      setHasProfile(true);
    } catch (err) {
      // 404 just means no profile yet — that's the normal first-visit state,
      // not an error worth surfacing.
      if (err.response?.status !== 404) {
        setSaveError(err.response?.data?.error?.message || 'Could not load your trainer profile.');
      }
      setHasProfile(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      setBookings(await trainerApi.listIncomingBookings());
    } catch {
      // Non-fatal — the profile form above is the primary content on this page.
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadBookings();
  }, [loadProfile, loadBookings]);

  const addSlot = () => {
    setForm((f) => ({
      ...f,
      availability: [...f.availability, { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }],
    }));
  };

  const updateSlot = (index, field, value) => {
    setForm((f) => ({
      ...f,
      availability: f.availability.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  const removeSlot = (index) => {
    setForm((f) => ({ ...f, availability: f.availability.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);

    const hourlyRate = Number(form.hourlyRate);
    if (Number.isNaN(hourlyRate) || hourlyRate < 0) {
      setSaveError('Hourly rate must be a number of 0 or more.');
      return;
    }
    for (const slot of form.availability) {
      if (slot.endTime <= slot.startTime) {
        setSaveError('Every availability slot needs an end time after its start time.');
        return;
      }
    }

    setSaving(true);
    try {
      await trainerApi.upsertMyProfile({
        bio: form.bio.trim() || undefined,
        specializations: form.specializations
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        hourlyRate,
        availability: form.availability,
      });
      setHasProfile(true);
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err.response?.data?.error?.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleBookingAction = async (bookingId, status) => {
    setActioningId(bookingId);
    try {
      await trainerApi.updateBookingStatus(bookingId, status);
      await loadBookings();
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted">
        <Loader2 size={18} className="animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-chalk">TRAINER STUDIO</h1>
        <p className="text-sm text-muted">
          {hasProfile
            ? 'Manage your public profile, availability, and incoming bookings.'
            : 'Set up your public trainer profile so members can find and book you.'}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              maxLength={1000}
              placeholder="Tell members about your training style and experience…"
              className="w-full rounded-lg border border-steel bg-raised px-4 py-2.5 text-chalk placeholder:text-muted/60 focus:border-tape focus:outline-none"
            />
          </div>

          <Input
            label="Specializations (comma-separated)"
            placeholder="strength, mobility, weight loss"
            value={form.specializations}
            onChange={(e) => setForm((f) => ({ ...f, specializations: e.target.value }))}
          />

          <Input
            label="Hourly rate (₹)"
            type="number"
            min="0"
            step="1"
            required
            value={form.hourlyRate}
            onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))}
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-muted">Weekly availability</label>
              <Button type="button" variant="ghost" size="sm" onClick={addSlot}>
                <Plus size={14} />
                Add slot
              </Button>
            </div>

            {form.availability.length === 0 && (
              <p className="text-sm text-muted">
                No availability set — members won&apos;t be able to book you until you add at least
                one slot.
              </p>
            )}

            <div className="space-y-2">
              {form.availability.map((slot, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-steel bg-raised p-2.5">
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) => updateSlot(i, 'dayOfWeek', Number(e.target.value))}
                    className="rounded-lg border border-steel bg-panel px-3 py-2 text-sm text-chalk focus:border-tape focus:outline-none"
                  >
                    {DAY_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(i, 'startTime', e.target.value)}
                    className="rounded-lg border border-steel bg-panel px-3 py-2 text-sm text-chalk focus:border-tape focus:outline-none"
                  />
                  <span className="text-muted">–</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(i, 'endTime', e.target.value)}
                    className="rounded-lg border border-steel bg-panel px-3 py-2 text-sm text-chalk focus:border-tape focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeSlot(i)}
                    className="ml-auto rounded-lg border border-steel p-2 text-muted hover:border-danger hover:text-danger"
                    aria-label="Remove slot"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {saveError && <p className="text-sm text-danger">{saveError}</p>}
          {saveSuccess && <p className="text-sm text-success">Profile saved.</p>}

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Saving…' : hasProfile ? 'Save changes' : 'Create profile'}
          </Button>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 font-display text-xl tracking-wide text-chalk">INCOMING BOOKINGS</h2>

        {bookingsLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : bookings.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <Card key={b._id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-chalk">{b.clientId?.profile?.name || 'Client'}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                    {b.sessionMode === 'video' ? <Video size={14} /> : <MapPinned size={14} />}
                    {new Date(b.scheduledAt).toLocaleString()} · {b.durationMinutes} min
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-chalk">₹{b.price}</span>
                  <Badge tone={STATUS_TONE[b.status] || 'neutral'}>{b.status}</Badge>
                  {b.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        disabled={actioningId === b._id}
                        onClick={() => handleBookingAction(b._id, 'confirmed')}
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actioningId === b._id}
                        onClick={() => handleBookingAction(b._id, 'cancelled')}
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={actioningId === b._id}
                      onClick={() => handleBookingAction(b._id, 'completed')}
                    >
                      Mark completed
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}