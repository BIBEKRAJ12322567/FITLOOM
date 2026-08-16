import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, Flame, Dumbbell } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { workoutApi } from '../../api/workoutApi';
import { exerciseApi } from '../../api/exerciseApi';
import { computeDailyVolumeSeries, computeOverloadSuggestions } from '../../utils/progressAnalysis';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-steel bg-panel px-3 py-2 text-sm shadow-lg">
      <p className="text-muted">{label}</p>
      <p className="font-mono font-semibold text-tape">{payload[0].value.toLocaleString()} volume</p>
    </div>
  );
}

export default function Progress() {
  const [logs, setLogs] = useState([]);
  const [exercisesById, setExercisesById] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workoutApi.listLogs(60).then(async (data) => {
      setLogs(data);
      const ids = [...new Set(data.flatMap((log) => log.entries.map((e) => e.exerciseId)))];
      if (ids.length > 0) {
        const resolved = await exerciseApi.getByIds(ids);
        setExercisesById(resolved);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted">
        <Loader2 size={18} className="animate-spin" /> Loading progress…
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="mx-auto flex max-w-md flex-col items-center gap-3 py-14 text-center">
        <Dumbbell className="text-tape" size={28} />
        <h1 className="font-display text-2xl tracking-wide text-chalk">NO LOGGED WORKOUTS YET</h1>
        <p className="text-sm text-muted">Log a workout to start seeing your progress here.</p>
        <Button as={Link} to="/app/workout" size="sm">
          Go to Workout
        </Button>
      </Card>
    );
  }

  const volumeSeries = computeDailyVolumeSeries(logs);
  const suggestions = computeOverloadSuggestions(logs, exercisesById);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-display text-3xl tracking-wide text-chalk">PROGRESS</h1>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-tape" />
          <h2 className="font-semibold text-chalk">Training volume over time</h2>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volumeSeries}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B1F" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#FF6B1F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2C3036" vertical={false} />
              <XAxis dataKey="date" stroke="#8C9198" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#8C9198" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="volume" stroke="#FF6B1F" strokeWidth={2} fill="url(#volumeGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {suggestions.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Flame size={18} className="text-tape" />
            <h2 className="font-semibold text-chalk">Time to add weight?</h2>
          </div>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <p key={s.exerciseId} className="rounded-lg bg-raised px-3 py-2 text-sm text-chalk">
                {s.message}
              </p>
            ))}
          </div>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Recent sessions</h2>
        <div className="space-y-2">
          {logs.slice(0, 10).map((log) => (
            <Card key={log._id} className="flex items-center justify-between py-3">
              <span className="text-sm text-chalk">{new Date(log.date).toLocaleDateString()}</span>
              <span className="text-xs text-muted">
                {log.entries.length} exercise{log.entries.length !== 1 ? 's' : ''}
              </span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}