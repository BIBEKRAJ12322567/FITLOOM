import Card from './Card';
import PlateLoad from './PlateLoad';

export default function KpiCard({ icon: Icon, label, value, sub, plateValue, plateTotal, plateColor = 'tape' }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium uppercase tracking-wide text-muted">{label}</span>
        {Icon && (
          <span className="rounded-lg bg-raised p-2 text-tape">
            <Icon size={18} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="font-mono text-3xl font-semibold text-chalk">{value}</div>
      {plateTotal ? <PlateLoad value={plateValue} total={plateTotal} color={plateColor} /> : null}
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </Card>
  );
}
