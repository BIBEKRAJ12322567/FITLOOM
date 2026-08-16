import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import ExerciseCard from '../../components/ui/ExerciseCard';
import { exerciseApi } from '../../api/exerciseApi';

const MUSCLE_GROUPS = ['', 'chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'core', 'glutes'];
const DIFFICULTIES = ['', 'beginner', 'intermediate', 'advanced'];

export default function Exercises() {
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const params = {};
    if (search) params.search = search;
    if (muscleGroup) params.muscleGroup = muscleGroup;
    if (difficulty) params.difficulty = difficulty;

    exerciseApi
      .list(params)
      .then((data) => setExercises(data.exercises))
      .catch((err) => setError(err.response?.data?.error?.message || 'Could not load exercises.'))
      .finally(() => setLoading(false));
  }, [search, muscleGroup, difficulty]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-1 font-display text-3xl tracking-wide text-chalk">EXERCISE LIBRARY</h1>
      <p className="mb-6 text-sm text-muted">Search the full library, filter by muscle group or difficulty.</p>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full rounded-lg border border-steel bg-raised py-2.5 pl-9 pr-4 text-chalk placeholder:text-muted/60 focus:border-tape focus:outline-none"
          />
        </div>
        <select
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          className="rounded-lg border border-steel bg-raised px-3 py-2.5 text-sm text-chalk focus:border-tape focus:outline-none"
        >
          {MUSCLE_GROUPS.map((mg) => (
            <option key={mg} value={mg}>
              {mg ? mg[0].toUpperCase() + mg.slice(1) : 'All muscle groups'}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="rounded-lg border border-steel bg-raised px-3 py-2.5 text-sm text-chalk focus:border-tape focus:outline-none"
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d ? d[0].toUpperCase() + d.slice(1) : 'All levels'}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted">
          <Loader2 size={18} className="animate-spin" /> Loading exercises…
        </div>
      )}
      {error && <p className="py-8 text-center text-sm text-danger">{error}</p>}
      {!loading && !error && exercises.length === 0 && (
        <p className="py-16 text-center text-sm text-muted">No exercises match those filters.</p>
      )}

      {!loading && exercises.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exercises.map((ex) => (
            <ExerciseCard key={ex._id} exercise={ex} />
          ))}
        </div>
      )}
    </div>
  );
}