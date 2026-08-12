import { useState, useMemo } from 'react';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import ResultGauge from '../../../components/ui/ResultGauge';
import { calculateBMI } from '../../../utils/calculators';

export default function BmiCalculator() {
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);

  const result = useMemo(() => {
    if (!weight || !height) return null;
    return calculateBMI(Number(weight), Number(height));
  }, [weight, height]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 font-display text-3xl tracking-wide text-chalk">BMI CALCULATOR</h1>
      <p className="mb-6 text-sm text-muted">Body Mass Index — a quick screening measure, not a diagnosis.</p>

      <Card className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Weight (kg)"
            type="number"
            min="1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <Input
            label="Height (cm)"
            type="number"
            min="1"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>
      </Card>

      {result && (
        <div className="mt-5">
          <ResultGauge value={result.bmi} label="Your BMI" categoryLabel={result.category} categoryTone={result.tone} />
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        BMI doesn’t account for muscle mass, bone density, or body composition — it’s a starting
        point, not the full picture. The Body Fat calculator gives a more direct read on
        composition.
      </p>
    </div>
  );
}
