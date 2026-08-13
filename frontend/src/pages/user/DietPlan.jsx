import { useState } from 'react';
import { Salad, Loader2, AlertCircle, Flame } from 'lucide-react';
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

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very active' },
];

const DIETARY_PREFS = [
  { value: 'no_preference', label: 'No preference' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'non_vegetarian', label: 'Non-vegetarian' },
];

export default function DietPlan() {
  const [form, setForm] = useState({
    weightKg: 70,
    heightCm: 170,
    age: 25,
    sex: 'male',
    activityLevel: 'moderate',
    goal: 'general_fitness',
    dietaryPreference: 'no_preference',
    cuisinePreference: 'general',
    notes: '',
  });
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
      const data = await aiApi.generateDietPlan({
        weightKg: Number(form.weightKg),
        heightCm: Number(form.heightCm),
        age: Number(form.age),
        sex: form.sex,
        activityLevel: form.activityLevel,
        goal: form.goal,
        dietaryPreference: form.dietaryPreference,
        cuisinePreference: form.cuisinePreference,
        notes: form.notes || undefined,
      });
      setPlan(data.dietPlan);
      setMeta(data.meta);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err.response?.data?.error?.message || 'Something went wrong generating your diet plan. Try again.'
      );
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-lg bg-raised p-2.5 text-tape">
          <Salad size={22} />
        </span>
        <div>
          <h1 className="font-display text-3xl tracking-wide text-chalk">DIET PLAN</h1>
          <p className="text-sm text-muted">
            Your calorie target and macros are calculated for you (Mifflin-St Jeor) — the AI only
            designs meals to fit them.
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Weight (kg)</label>
              <input
                type="number"
                name="weightKg"
                min="20"
                max="300"
                value={form.weightKg}
                onChange={handleChange}
                className="w-full rounded-lg border border-steel bg-raised px-3 py-2.5 text-chalk focus:border-tape focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Height (cm)</label>
              <input
                type="number"
                name="heightCm"
                min="100"
                max="250"
                value={form.heightCm}
                onChange={handleChange}
                className="w-full rounded-lg border border-steel bg-raised px-3 py-2.5 text-chalk focus:border-tape focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Age</label>
              <input
                type="number"
                name="age"
                min="13"
                max="100"
                value={form.age}
                onChange={handleChange}
                className="w-full rounded-lg border border-steel bg-raised px-3 py-2.5 text-chalk focus:border-tape focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Sex</label>
              <select
                name="sex"
                value={form.sex}
                onChange={handleChange}
                className="w-full rounded-lg border border-steel bg-raised px-3 py-2.5 text-chalk focus:border-tape focus:outline-none"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Activity level</label>
              <select
                name="activityLevel"
                value={form.activityLevel}
                onChange={handleChange}
                className="w-full rounded-lg border border-steel bg-raised px-3 py-2.5 text-chalk focus:border-tape focus:outline-none"
              >
                {ACTIVITY_LEVELS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Dietary preference</label>
              <select
                name="dietaryPreference"
                value={form.dietaryPreference}
                onChange={handleChange}
                className="w-full rounded-lg border border-steel bg-raised px-3 py-2.5 text-chalk focus:border-tape focus:outline-none"
              >
                {DIETARY_PREFS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">
              Cuisine preference (optional)
            </label>
            <input
              type="text"
              name="cuisinePreference"
              value={form.cuisinePreference}
              onChange={handleChange}
              placeholder="e.g. Indian, Mediterranean, general"
              className="w-full rounded-lg border border-steel bg-raised px-4 py-2.5 text-chalk placeholder:text-muted/60 focus:border-tape focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Notes (optional)</label>
            <textarea
              name="notes"
              rows={2}
              maxLength={500}
              value={form.notes}
              onChange={handleChange}
              placeholder="e.g. lactose intolerant, no seafood..."
              className="w-full rounded-lg border border-steel bg-raised px-4 py-2.5 text-chalk placeholder:text-muted/60 focus:border-tape focus:outline-none"
            />
          </div>

          <Button type="submit" disabled={status === 'loading'} className="w-full gap-2">
            {status === 'loading' ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating your meal plan…
              </>
            ) : (
              <>
                <Salad size={16} /> Generate diet plan
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
                {plan.goal.replace('_', ' ')} · {plan.dietaryPreference.replace('_', ' ')}
              </p>
            </div>
            <Badge tone="tape" className="flex items-center gap-1">
              <Salad size={12} /> AI-generated
            </Badge>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-steel bg-raised p-3 text-center">
              <p className="flex items-center justify-center gap-1 text-xs text-muted">
                <Flame size={12} /> Calories
              </p>
              <p className="font-mono text-lg font-semibold text-tape">{plan.dailyCalorieTarget}</p>
            </div>
            <div className="rounded-lg border border-steel bg-raised p-3 text-center">
              <p className="text-xs text-muted">Protein</p>
              <p className="font-mono text-lg font-semibold text-chalk">{plan.macros.proteinG}g</p>
            </div>
            <div className="rounded-lg border border-steel bg-raised p-3 text-center">
              <p className="text-xs text-muted">Carbs</p>
              <p className="font-mono text-lg font-semibold text-chalk">{plan.macros.carbsG}g</p>
            </div>
            <div className="rounded-lg border border-steel bg-raised p-3 text-center">
              <p className="text-xs text-muted">Fat</p>
              <p className="font-mono text-lg font-semibold text-chalk">{plan.macros.fatG}g</p>
            </div>
          </div>

          {meta?.deviationPct > 15 && (
            <p className="mb-4 text-xs text-muted">
              Note: the meals shown total {meta.totalCalories} kcal, about {meta.deviationPct}% off
              your {plan.dailyCalorieTarget} kcal target — feel free to adjust portions.
            </p>
          )}

          <div className="space-y-4">
            {plan.meals.map((meal, i) => (
              <div key={i} className="rounded-xl border border-steel bg-raised p-4">
                <h3 className="mb-3 font-semibold text-chalk">{meal.mealLabel}</h3>
                <div className="space-y-2">
                  {meal.items.map((item, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between border-b border-steel/60 pb-2 text-sm last:border-0 last:pb-0"
                    >
                      <div>
                        <span className="text-chalk">{item.name}</span>
                        <span className="ml-2 text-xs text-muted">{item.portion}</span>
                      </div>
                      <span className="font-mono text-muted">{item.calories} kcal</span>
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