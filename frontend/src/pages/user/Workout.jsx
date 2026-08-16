import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Sparkles, Plus, Minus, CheckCircle2, Flame } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import WorkoutCard from '../../components/ui/WorkoutCard';
import { workoutApi } from '../../api/workoutApi';
import { exerciseApi } from '../../api/exerciseApi';

function LogWorkoutForm({ plan, onLogged }) {
  const [dayIndex, setDayIndex] = useState(0);
  const [exercisesById, setExercisesById] = useState({});
  const [loadingNames, setLoadingNames] = useState(true);
  const [setsByExercise, setSetsByExercise] = useState({}); // { exerciseId: [{reps, weightKg}] }
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const day = plan.days[dayIndex];

  useEffect(() => {
    const ids = [...new Set(plan.days.flatMap((d) => d.exercises.map((e) => e.exerciseId)))];
    exerciseApi
      .getByIds(ids)
      .then(setExercisesById)
      .finally(() => setLoadingNames(false));
  }, [plan]);

  useEffect(() => {
    // Pre-fill one empty set row per exercise in the selected day, matching
    // the plan's prescribed set count as a starting point.
    const initial = {};
    day.exercises.forEach((ex) => {
      initial[ex.exerciseId] = Array.from({ length: ex.sets }, () => ({ reps: '', weightKg: '' }));
    });
    setSetsByExercise(initial);
  }, [day]);

  const updateSet = (exerciseId, setIndex, field, value) => {
    setSetsByExercise((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((s, i) => (i === setIndex ? { ...s, [field]: value } : s)),
    }));
  };

  const addSet = (exerciseId) => {
    setSetsByExercise((prev) => ({
      ...prev,
      [exerciseId]: [...prev[exerciseId], { reps: '', weightKg: '' }],
    }));
  };

  const removeSet = (exerciseId, setIndex) => {
    setSetsByExercise((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].filter((_, i) => i !== setIndex),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const entries = Object.entries(setsByExercise)
      .map(([exerciseId, sets]) => ({
        exerciseId,
        sets: sets
          .filter((s) => s.reps !== '' && s.weightKg !== '')
          .map((s) => ({ reps: Number(s.reps), weightKg: Number(s.weightKg) })),
      }))
      .filter((entry) => entry.sets.length > 0);

    if (entries.length === 0) {
      setError('Log at least one set with reps and weight filled in.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await workoutApi.createLog({ planId: plan._id, entries });
      onLogged(result.streakDays);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not save this log.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingNames) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-muted">
        <Loader2 size={16} className="animate-spin" /> Loading exercises…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {plan.days.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {plan.days.map((d, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setDayIndex(i)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                i === dayIndex
                  ? 'border-tape bg-tape/15 text-tape'
                  : 'border-steel bg-raised text-muted hover:text-chalk'
              }`}
            >
              {d.dayLabel}
            </button>
          ))}
        </div>
      )}

      {day.exercises.map((ex) => {
        const info = exercisesById[ex.exerciseId];
        const sets = setsByExercise[ex.exerciseId] || [];
        return (
          <div key={ex.exerciseId} className="rounded-xl border border-steel bg-raised p-4">
            <h4 className="mb-2 text-sm font-semibold text-chalk">
              {info?.name || 'Exercise'}{' '}
              <span className="font-normal text-muted">
                (target: {ex.sets} × {ex.repsTarget})
              </span>
            </h4>
            <div className="space-y-2">
              {sets.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 text-xs text-muted">#{i + 1}</span>
                  <input
                    type="number"
                    placeholder="Reps"
                    value={s.reps}
                    onChange={(e) => updateSet(ex.exerciseId, i, 'reps', e.target.value)}
                    className="w-20 rounded-lg border border-steel bg-panel px-2 py-1.5 text-sm text-chalk focus:border-tape focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="kg"
                    value={s.weightKg}
                    onChange={(e) => updateSet(ex.exerciseId, i, 'weightKg', e.target.value)}
                    className="w-20 rounded-lg border border-steel bg-panel px-2 py-1.5 text-sm text-chalk focus:border-tape focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeSet(ex.exerciseId, i)}
                    className="text-muted hover:text-danger"
                  >
                    <Minus size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addSet(ex.exerciseId)}
                className="flex items-center gap-1 text-xs text-tape hover:underline"
              >
                <Plus size={12} /> Add set
              </button>
            </div>
          </div>
        );
      })}

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Saving…' : 'Save workout log'}
      </Button>
    </form>
  );
}

export default function Workout() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [logSuccess, setLogSuccess] = useState(null); // streakDays

  useEffect(() => {
    workoutApi
      .listMyPlans()
      .then(setPlans)
      .finally(() => setLoading(false));
  }, []);

  const handleLogged = (streakDays) => {
    setLogSuccess(streakDays);
    setSelectedPlan(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted">
        <Loader2 size={18} className="animate-spin" /> Loading your plans…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide text-chalk">WORKOUT</h1>
        <Button as={Link} to="/app/ai-coach" variant="secondary" size="sm" className="gap-1.5">
          <Sparkles size={14} /> Generate new
        </Button>
      </div>

      {logSuccess !== null && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
          <CheckCircle2 size={18} />
          <span className="flex items-center gap-1.5">
            Workout logged! <Flame size={14} /> {logSuccess}-day streak.
          </span>
        </div>
      )}

      {plans.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <Sparkles className="text-tape" size={28} />
          <p className="text-sm text-muted">You don’t have any saved plans yet.</p>
          <Button as={Link} to="/app/ai-coach" size="sm">
            Generate your first workout
          </Button>
        </Card>
      ) : selectedPlan ? (
        <Card>
          <button
            onClick={() => setSelectedPlan(null)}
            className="mb-4 text-sm text-muted hover:text-chalk"
          >
            ← Back to plans
          </button>
          <h2 className="mb-4 font-display text-2xl tracking-wide text-chalk">{selectedPlan.title}</h2>
          <LogWorkoutForm plan={selectedPlan} onLogged={handleLogged} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <WorkoutCard key={plan._id} plan={plan} onClick={() => setSelectedPlan(plan)} />
          ))}
        </div>
      )}
    </div>
  );
}