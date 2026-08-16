import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, PlayCircle, Dumbbell, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { exerciseApi } from '../../api/exerciseApi';

const DIFFICULTY_TONE = { beginner: 'success', intermediate: 'warning', advanced: 'danger' };

export default function ExerciseDetails() {
  const { id } = useParams();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    exerciseApi
      .getById(id)
      .then(setExercise)
      .catch((err) => setError(err.response?.data?.error?.message || 'Exercise not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted">
        <Loader2 size={18} className="animate-spin" /> Loading…
      </div>
    );
  }

  if (error || !exercise) {
    return <p className="py-16 text-center text-sm text-danger">{error || 'Exercise not found.'}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/app/exercises" className="mb-4 flex items-center gap-1.5 text-sm text-muted hover:text-chalk">
        <ArrowLeft size={14} /> Back to library
      </Link>

      <Card>
        <div className="mb-4 flex aspect-video items-center justify-center rounded-xl bg-raised text-muted">
          {exercise.videoUrl ? (
            <PlayCircle size={48} className="text-tape/80" />
          ) : (
            <Dumbbell size={40} />
          )}
        </div>

        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <h1 className="font-display text-3xl tracking-wide text-chalk">{exercise.name}</h1>
          <Badge tone={DIFFICULTY_TONE[exercise.difficulty] || 'neutral'}>{exercise.difficulty}</Badge>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {exercise.muscleGroups?.map((mg) => (
            <span key={mg} className="rounded-full bg-raised px-2.5 py-1 text-xs text-muted">
              {mg}
            </span>
          ))}
          {exercise.equipment && exercise.equipment !== 'none' && (
            <span className="rounded-full bg-raised px-2.5 py-1 text-xs text-muted">
              Equipment: {exercise.equipment}
            </span>
          )}
        </div>

        {exercise.instructions?.length > 0 && (
          <div className="mb-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">How to</h2>
            <ol className="space-y-1.5">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-chalk">
                  <span className="text-tape">{i + 1}.</span> {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {(exercise.injurySafeFor?.length > 0 || exercise.injuryRiskFor?.length > 0) && (
          <div className="space-y-2 border-t border-steel pt-4">
            {exercise.injurySafeFor?.length > 0 && (
              <p className="flex items-center gap-2 text-sm text-success">
                <ShieldCheck size={16} /> Generally safe for: {exercise.injurySafeFor.join(', ').replace(/_/g, ' ')}
              </p>
            )}
            {exercise.injuryRiskFor?.length > 0 && (
              <p className="flex items-center gap-2 text-sm text-warning">
                <ShieldAlert size={16} /> Use caution if you have: {exercise.injuryRiskFor.join(', ').replace(/_/g, ' ')}
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}