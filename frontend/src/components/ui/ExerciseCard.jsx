import { Link } from 'react-router-dom';
import { Dumbbell, PlayCircle } from 'lucide-react';
import Card from './Card';
import Badge from './Badge';

const DIFFICULTY_TONE = { beginner: 'success', intermediate: 'warning', advanced: 'danger' };

export default function ExerciseCard({ exercise }) {
  return (
    <Link to={`/app/exercises/${exercise._id}`}>
      <Card className="group h-full transition-colors hover:border-tape/50">
        <div className="mb-4 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-raised text-muted">
          {exercise.thumbnailUrl ? (
            <img
              src={exercise.thumbnailUrl}
              alt={exercise.name}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(e) => {
                // If the external image host is down/blocked, fall back to
                // the icon rather than showing a broken-image glyph.
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ display: exercise.thumbnailUrl ? 'none' : 'flex' }}
          >
            {exercise.videoUrl ? (
              <PlayCircle size={32} className="text-tape/80 transition-transform group-hover:scale-110" />
            ) : (
              <Dumbbell size={28} />
            )}
          </div>
        </div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-display text-xl tracking-wide text-chalk">{exercise.name}</h3>
          <Badge tone={DIFFICULTY_TONE[exercise.difficulty] || 'neutral'}>{exercise.difficulty}</Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {exercise.muscleGroups?.map((mg) => (
            <span key={mg} className="rounded-full bg-raised px-2 py-0.5 text-xs text-muted">
              {mg}
            </span>
          ))}
        </div>
      </Card>
    </Link>
  );
}