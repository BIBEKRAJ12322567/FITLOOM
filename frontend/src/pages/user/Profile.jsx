import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';

const GOALS = [
  { value: 'weight_loss', label: 'Weight loss' },
  { value: 'muscle_gain', label: 'Muscle gain' },
  { value: 'general_fitness', label: 'General fitness' },
  { value: 'strength', label: 'Strength' },
  { value: 'endurance', label: 'Endurance' },
];

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const SEVERITIES = ['mild', 'moderate', 'severe'];

const GOAL_LABELS = Object.fromEntries(GOALS.map((g) => [g.value, g.label]));

// Convert an ISO/Date value from the API into the yyyy-mm-dd shape the
// native <input type="date"> expects, or '' if there's nothing to show.
function toDateInputValue(dob) {
  if (!dob) return '';
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function emptyFormFrom(user) {
  const p = user?.profile || {};
  return {
    name: p.name || '',
    avatarUrl: p.avatarUrl || '',
    dob: toDateInputValue(p.dob),
    gender: p.gender || '',
    heightCm: p.heightCm ?? '',
    weightKg: p.weightKg ?? '',
    goals: p.goals || [],
    experienceLevel: p.experienceLevel || 'beginner',
    injuries: (p.injuries || []).map((inj) => ({ ...inj })),
  };
}

export default function Profile() {
  const { user, updateProfile, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => emptyFormFrom(user));
  const [formError, setFormError] = useState('');

  const startEditing = () => {
    setForm(emptyFormFrom(user));
    setFormError('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setFormError('');
    setEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const toggleGoal = (value) => {
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(value) ? f.goals.filter((g) => g !== value) : [...f.goals, value],
    }));
  };

  const addInjury = () => {
    setForm((f) => ({
      ...f,
      injuries: [...f.injuries, { bodyPart: '', note: '', severity: 'mild' }],
    }));
  };

  const updateInjury = (index, field, value) => {
    setForm((f) => ({
      ...f,
      injuries: f.injuries.map((inj, i) => (i === index ? { ...inj, [field]: value } : inj)),
    }));
  };

  const removeInjury = (index) => {
    setForm((f) => ({ ...f, injuries: f.injuries.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('Name cannot be empty.');
      return;
    }
    const cleanedInjuries = form.injuries.filter((inj) => inj.bodyPart.trim());
    const invalidInjury = cleanedInjuries.find((inj) => !inj.bodyPart.trim());
    if (invalidInjury) {
      setFormError('Every injury needs a body part.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      avatarUrl: form.avatarUrl.trim() || null,
      dob: form.dob || null,
      gender: form.gender || null,
      heightCm: form.heightCm === '' ? null : Number(form.heightCm),
      weightKg: form.weightKg === '' ? null : Number(form.weightKg),
      goals: form.goals,
      experienceLevel: form.experienceLevel,
      injuries: cleanedInjuries,
    };

    try {
      await updateProfile(payload);
      setEditing(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const p = user?.profile || {};

  if (!editing) {
    return (
      <Card className="mx-auto max-w-xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-3xl tracking-wide text-chalk">PROFILE</h1>
          <Button variant="secondary" size="sm" onClick={startEditing}>
            <Pencil size={14} />
            Edit
          </Button>
        </div>

        <dl className="space-y-3 text-sm">
          <Row label="Name" value={p.name} />
          <Row label="Email" value={user?.email} />
          <Row label="Role" value={user?.role?.replace('_', ' ')} capitalize />
          <Row label="Plan" value={user?.subscriptionTier || 'free'} capitalize />
          <Row label="Date of birth" value={p.dob ? toDateInputValue(p.dob) : null} />
          <Row label="Gender" value={GENDERS.find((g) => g.value === p.gender)?.label} />
          <Row label="Height" value={p.heightCm ? `${p.heightCm} cm` : null} />
          <Row label="Weight" value={p.weightKg ? `${p.weightKg} kg` : null} />
          <Row label="Experience level" value={p.experienceLevel} capitalize />
        </dl>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Goals</p>
          {p.goals?.length ? (
            <div className="flex flex-wrap gap-2">
              {p.goals.map((g) => (
                <Badge key={g} tone="tape">
                  {GOAL_LABELS[g] || g}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No goals set yet.</p>
          )}
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Injuries</p>
          {p.injuries?.length ? (
            <ul className="space-y-2">
              {p.injuries.map((inj, i) => (
                <li key={i} className="rounded-lg border border-steel bg-raised px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize text-chalk">{inj.bodyPart}</span>
                    <Badge tone={inj.severity === 'severe' ? 'danger' : inj.severity === 'moderate' ? 'warning' : 'neutral'}>
                      {inj.severity}
                    </Badge>
                  </div>
                  {inj.note && <p className="mt-1 text-xs text-muted">{inj.note}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">None on file.</p>
          )}
        </div>

        <p className="mt-6 text-xs text-muted">
          Goals, injuries, and experience level feed directly into the AI workout and diet
          generators.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide text-chalk">EDIT PROFILE</h1>
        <Button variant="ghost" size="sm" onClick={cancelEditing}>
          <X size={14} />
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Full name" name="name" required value={form.name} onChange={handleChange} />
        <Input
          label="Avatar URL"
          name="avatarUrl"
          placeholder="https://…"
          value={form.avatarUrl}
          onChange={handleChange}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Date of birth" type="date" name="dob" value={form.dob} onChange={handleChange} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full rounded-lg border border-steel bg-raised px-4 py-2.5 text-chalk focus:border-tape focus:outline-none"
            >
              <option value="">—</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Height (cm)"
            type="number"
            name="heightCm"
            min="50"
            max="300"
            step="0.1"
            value={form.heightCm}
            onChange={handleChange}
          />
          <Input
            label="Weight (kg)"
            type="number"
            name="weightKg"
            min="20"
            max="400"
            step="0.1"
            value={form.weightKg}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">Goals</label>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button
                type="button"
                key={g.value}
                onClick={() => toggleGoal(g.value)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  form.goals.includes(g.value)
                    ? 'border-tape bg-tape/15 text-tape'
                    : 'border-steel bg-raised text-muted hover:text-chalk'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">Experience level</label>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((l) => (
              <button
                type="button"
                key={l.value}
                onClick={() => setForm((f) => ({ ...f, experienceLevel: l.value }))}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                  form.experienceLevel === l.value
                    ? 'border-tape bg-tape/15 text-tape'
                    : 'border-steel bg-raised text-muted hover:text-chalk'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-muted">Injuries</label>
            <Button type="button" variant="ghost" size="sm" onClick={addInjury}>
              <Plus size={14} />
              Add
            </Button>
          </div>

          {form.injuries.length === 0 && (
            <p className="text-sm text-muted">None on file. Add one if it should limit exercise selection.</p>
          )}

          <div className="space-y-3">
            {form.injuries.map((inj, i) => (
              <div key={i} className="rounded-lg border border-steel bg-raised p-3">
                <div className="mb-2 flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      label="Body part"
                      value={inj.bodyPart}
                      onChange={(e) => updateInjury(i, 'bodyPart', e.target.value)}
                      placeholder="e.g. left knee"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeInjury(i)}
                    className="mt-7 rounded-lg border border-steel p-2.5 text-muted hover:border-danger hover:text-danger"
                    aria-label="Remove injury"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-muted">Severity</label>
                    <select
                      value={inj.severity || 'mild'}
                      onChange={(e) => updateInjury(i, 'severity', e.target.value)}
                      className="w-full rounded-lg border border-steel bg-panel px-4 py-2.5 text-chalk focus:border-tape focus:outline-none"
                    >
                      {SEVERITIES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Note (optional)"
                    value={inj.note || ''}
                    onChange={(e) => updateInjury(i, 'note', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {formError && <p className="text-sm text-danger">{formError}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Saving…' : 'Save changes'}
          </Button>
          <Button type="button" variant="secondary" onClick={cancelEditing} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Row({ label, value, capitalize }) {
  return (
    <div className="flex justify-between border-b border-steel pb-2">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-medium text-chalk ${capitalize ? 'capitalize' : ''}`}>{value || '—'}</dd>
    </div>
  );
}