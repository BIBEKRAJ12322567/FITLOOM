import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { aiApi } from '../../api/aiApi';

const GOALS = [
  { value: 'weight_loss', label: 'Weight loss' },
  { value: 'muscle_gain', label: 'Muscle gain' },
  { value: 'general_fitness', label: 'General fitness' },
  { value: 'strength', label: 'Strength' },
  { value: 'endurance', label: 'Endurance' },
];

const LEVELS = ['beginner', 'intermediate', 'advanced'];

export default function AICoach() {
  const [form, setForm] = useState({ goal: 'general_fitness', level: 'beginner', daysPerWeek: 3, notes: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [plan, setPlan] = useState(null);
  const [meta, setMeta] = useState(null);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const data = await aiApi.generateWorkout({
        goal: form.goal,
        level: form.level,
        daysPerWeek: Number(form.daysPerWeek),
        notes: form.notes || undefined,
      });
      setPlan(data.workoutPlan);
      setMeta(data.meta);
      setStatus('success');
      // Let the Dashboard surface this without a second fetch — see the
      // comment in Dashboard.jsx for why sessionStorage is a pragmatic
      // stand-in here rather than a real "recent plans" endpoint.
      sessionStorage.setItem('latestWorkoutPlan', JSON.stringify(data.workoutPlan));
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err.response?.data?.error?.message || 'Something went wrong generating your plan. Try again.'
      );
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-lg bg-raised p-2.5 text-tape">
          <Sparkles size={22} />
        </span>
        <div>
          <h1 className="font-display text-3xl tracking-wide text-chalk">AI COACH</h1>
          <p className="text-sm text-muted">
            Generates a plan from exercises already filtered for your level and any injuries on file.
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-muted">Goal</label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button
                  type="button"
                  key={g.value}
                  onClick={() => setForm((f) => ({ ...f, goal: g.value }))}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    form.goal === g.value
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
            <label className="mb-2 block text-sm font-medium text-muted">Level</label>
            <div className="flex gap-2">
              {LEVELS.map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setForm((f) => ({ ...f, level: lvl }))}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                    form.level === lvl
                      ? 'border-tape bg-tape/15 text-tape'
                      : 'border-steel bg-raised text-muted hover:text-chalk'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Days per week</label>
            <input
              type="range"
              name="daysPerWeek"
              min="1"
              max="6"
              value={form.daysPerWeek}
              onChange={handleChange}
              className="w-full accent-tape"
            />
            <p className="mt-1 text-sm font-mono text-chalk">{form.daysPerWeek} days/week</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Notes (optional)</label>
            <textarea
              name="notes"
              rows={2}
              maxLength={500}
              value={form.notes}
              onChange={handleChange}
              placeholder="e.g. only have dumbbells at home, prefer supersets..."
              className="w-full rounded-lg border border-steel bg-raised px-4 py-2.5 text-chalk placeholder:text-muted/60 focus:border-tape focus:outline-none"
            />
          </div>

          <Button type="submit" disabled={status === 'loading'} className="w-full gap-2">
            {status === 'loading' ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating your plan…
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate workout plan
              </>
            )}
          </Button>
        </form>
      </Card>

      {status === 'error' && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Couldn’t generate a plan</p>
            <p className="mt-0.5 text-danger/90">{errorMessage}</p>
          </div>
        </div>
      )}

      {status === 'success' && plan && (
        <Card className="mt-5">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl tracking-wide text-chalk">{plan.title}</h2>
              <p className="text-sm capitalize text-muted">
                {plan.goal.replace('_', ' ')} · {plan.level}
              </p>
            </div>
            <Badge tone="tape" className="flex items-center gap-1">
              <Sparkles size={12} /> AI-generated
            </Badge>
          </div>

          {meta?.droppedExercises > 0 && (
            <p className="mb-4 text-xs text-muted">
              Simplified slightly to only use exercises that match your level and injury profile
              ({meta.droppedExercises} substitution{meta.droppedExercises !== 1 ? 's' : ''} made).
            </p>
          )}

          <div className="space-y-4">
            {plan.days.map((day, i) => (
              <div key={i} className="rounded-xl border border-steel bg-raised p-4">
                <h3 className="mb-3 font-semibold text-chalk">{day.dayLabel}</h3>
                <div className="space-y-2">
                  {day.exercises.map((ex, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between border-b border-steel/60 pb-2 text-sm last:border-0 last:pb-0"
                    >
                      <span className="text-chalk">Exercise {j + 1}</span>
                      <span className="font-mono text-muted">
                        {ex.sets} × {ex.repsTarget} · {ex.restSeconds}s rest
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
