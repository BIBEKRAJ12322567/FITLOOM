import { useState, useMemo } from 'react';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import ResultGauge from '../../../components/ui/ResultGauge';
import { calculateCalories } from '../../../utils/calculators';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary (little/no exercise)' },
  { value: 'light', label: 'Light (1-3 days/week)' },
  { value: 'moderate', label: 'Moderate (3-5 days/week)' },
  { value: 'active', label: 'Active (6-7 days/week)' },
  { value: 'very_active', label: 'Very active (physical job + training)' },
];

const GOAL_OPTIONS = [
  { value: 'weight_loss', label: 'Weight loss' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'muscle_gain', label: 'Muscle gain' },
];

export default function CaloriesCalculator() {
  const [form, setForm] = useState({
    weightKg: 70,
    heightCm: 170,
    age: 25,
    sex: 'male',
    activityLevel: 'moderate',
    goal: 'maintain',
  });

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const result = useMemo(() => {
    if (!form.weightKg || !form.heightCm || !form.age) return null;
    return calculateCalories({
      weightKg: Number(form.weightKg),
      heightCm: Number(form.heightCm),
      age: Number(form.age),
      sex: form.sex,
      activityLevel: form.activityLevel,
      goal: form.goal,
    });
  }, [form]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 font-display text-3xl tracking-wide text-chalk">CALORIES CALCULATOR</h1>
      <p className="mb-6 text-sm text-muted">Estimated daily calorie target using the Mifflin-St Jeor equation.</p>

      <Card className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Weight (kg)" type="number" name="weightKg" value={form.weightKg} onChange={handleChange} />
          <Input label="Height (cm)" type="number" name="heightCm" value={form.heightCm} onChange={handleChange} />
          <Input label="Age" type="number" name="age" value={form.age} onChange={handleChange} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Sex</label>
            <select
              name="sex"
              value={form.sex}
              onChange={handleChange}
              className="w-full rounded-lg border border-steel bg-raised px-4 py-2.5 text-chalk focus:border-tape focus:outline-none"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">Activity level</label>
          <select
            name="activityLevel"
            value={form.activityLevel}
            onChange={handleChange}
            className="w-full rounded-lg border border-steel bg-raised px-4 py-2.5 text-chalk focus:border-tape focus:outline-none"
          >
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">Goal</label>
          <select
            name="goal"
            value={form.goal}
            onChange={handleChange}
            className="w-full rounded-lg border border-steel bg-raised px-4 py-2.5 text-chalk focus:border-tape focus:outline-none"
          >
            {GOAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {result && (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ResultGauge value={result.bmr} label="BMR" unit="kcal" />
          <ResultGauge value={result.tdee} label="Maintenance (TDEE)" unit="kcal" />
          <ResultGauge value={result.target} label="Your target" unit="kcal" categoryTone="tape" />
        </div>
      )}
    </div>
  );
}
