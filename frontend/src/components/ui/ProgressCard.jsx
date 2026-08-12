import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from './Card';

const TREND_CONFIG = {
  up: { icon: TrendingUp, color: 'text-success' },
  down: { icon: TrendingDown, color: 'text-danger' },
  flat: { icon: Minus, color: 'text-muted' },
};

export default function ProgressCard({ label, value, unit, deltaLabel, trend = 'flat' }) {
  const { icon: TrendIcon, color } = TREND_CONFIG[trend];
  return (
    <Card>
      <p className="text-sm font-medium uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-2 flex items-baseline gap-1 font-mono">
        <span className="text-3xl font-semibold text-chalk">{value}</span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
      {deltaLabel && (
        <p className={`mt-2 flex items-center gap-1 text-xs font-medium ${color}`}>
          <TrendIcon size={14} /> {deltaLabel}
        </p>
      )}
    </Card>
  );
}
