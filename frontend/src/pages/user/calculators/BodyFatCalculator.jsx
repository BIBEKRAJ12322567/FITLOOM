import { useState, useMemo } from 'react';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import ResultGauge from '../../../components/ui/ResultGauge';
import { calculateBodyFat } from '../../../utils/calculators';

export default function BodyFatCalculator() {
  const [form, setForm] = useState({ sex: 'male', heightCm: 175, neckCm: 38, waistCm: 85, hipCm: 95 });

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const result = useMemo(() => {
    const { heightCm, neckCm, waistCm, hipCm, sex } = form;
    if (!heightCm || !neckCm || !waistCm || (sex === 'female' && !hipCm)) return null;
    if (sex === 'male' && Number(waistCm) <= Number(neckCm)) return null; // formula requires waist > neck
    return calculateBodyFat({
      sex,
      heightCm: Number(heightCm),
      neckCm: Number(neckCm),
      waistCm: Number(waistCm),
      hipCm: Number(hipCm),
    });
  }, [form]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 font-display text-3xl tracking-wide text-chalk">BODY FAT CALCULATOR</h1>
      <p className="mb-6 text-sm text-muted">U.S. Navy circumference method — no calipers needed, just a tape measure.</p>

      <Card className="space-y-4">
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

        <div className="grid grid-cols-2 gap-4">
          <Input label="Height (cm)" type="number" name="heightCm" value={form.heightCm} onChange={handleChange} />
          <Input label="Neck (cm)" type="number" name="neckCm" value={form.neckCm} onChange={handleChange} />
          <Input label="Waist (cm)" type="number" name="waistCm" value={form.waistCm} onChange={handleChange} />
          {form.sex === 'female' && (
            <Input label="Hip (cm)" type="number" name="hipCm" value={form.hipCm} onChange={handleChange} />
          )}
        </div>
      </Card>

      {result ? (
        <div className="mt-5">
          <ResultGauge
            value={result.bodyFat}
            unit="%"
            label="Estimated body fat"
            categoryLabel={result.category}
            categoryTone={result.tone}
          />
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted">
          Enter valid measurements to see your result (for men, waist must be greater than neck).
        </p>
      )}
    </div>
  );
}
