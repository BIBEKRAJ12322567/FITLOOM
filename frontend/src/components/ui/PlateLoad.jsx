const PLATE_COLORS = {
  tape: 'bg-tape',
  iron: 'bg-iron',
  success: 'bg-success',
};

/**
 * Renders progress as a stack of barbell-loading plates instead of a
 * generic ring or bar — filled plates = progress made, outlined = what's
 * left. This is the one place the design deliberately breaks from plain
 * dashboard chrome, so it stays consistent everywhere progress is shown.
 */
export default function PlateLoad({ value, total, color = 'tape', plateCount = 6, className = '' }) {
  const pct = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;
  const filledPlates = Math.round(pct * plateCount);

  return (
    <div className={`flex items-end gap-1 ${className}`} role="img" aria-label={`${Math.round(pct * 100)}% of target`}>
      {Array.from({ length: plateCount }).map((_, i) => {
        const filled = i < filledPlates;
        const height = 10 + i * 3; // ascending plate heights, like a real stack
        return (
          <div
            key={i}
            className={`w-2.5 rounded-sm transition-all duration-500 ${
              filled ? PLATE_COLORS[color] : 'border border-steel bg-transparent'
            }`}
            style={{ height, transitionDelay: `${i * 40}ms` }}
          />
        );
      })}
    </div>
  );
}
