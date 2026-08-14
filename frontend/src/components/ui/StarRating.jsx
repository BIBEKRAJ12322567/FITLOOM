import { Star } from 'lucide-react';

export default function StarRating({ value = 0, count, size = 16, interactive = false, onChange }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={size}
            className={star <= Math.round(value) ? 'fill-tape text-tape' : 'text-steel'}
          />
        </button>
      ))}
      {typeof count === 'number' && (
        <span className="ml-1 text-xs text-muted">
          {value.toFixed(1)} ({count})
        </span>
      )}
    </div>
  );
}
