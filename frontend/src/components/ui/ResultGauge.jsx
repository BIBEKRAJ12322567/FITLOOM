export default function ResultGauge({ value, label, categoryLabel, categoryTone = 'tape', unit = '' }) {
  const TONE_TEXT = { tape: 'text-tape', success: 'text-success', warning: 'text-warning', danger: 'text-danger' };
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-steel bg-raised py-10 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-mono text-5xl font-bold text-chalk">
        {value}
        {unit && <span className="ml-1 text-xl text-muted">{unit}</span>}
      </p>
      {categoryLabel && (
        <p className={`mt-3 text-sm font-semibold uppercase tracking-wide ${TONE_TEXT[categoryTone]}`}>
          {categoryLabel}
        </p>
      )}
    </div>
  );
}
