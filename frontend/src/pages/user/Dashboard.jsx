import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, TrendingUp, Sparkles, Target } from 'lucide-react';
import KpiCard from '../../components/ui/KpiCard';
import WorkoutCard from '../../components/ui/WorkoutCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { dashboardKpis } from '../../data/mockData';

export default function Dashboard() {
  const [latestPlan, setLatestPlan] = useState(null);

  // The AI Coach page stores its most recent generated plan here so the
  // dashboard can surface it without a second network round-trip. A real
  // "recent plans" list would instead fetch GET /api/workouts?limit=1 —
  // this is a pragmatic stand-in until that endpoint exists.
  useEffect(() => {
    const stored = sessionStorage.getItem('latestWorkoutPlan');
    if (stored) setLatestPlan(JSON.parse(stored));
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Target}
          label="This week's workouts"
          value={`${dashboardKpis.weeklyWorkouts.value}/${dashboardKpis.weeklyWorkouts.target}`}
          plateValue={dashboardKpis.weeklyWorkouts.value}
          plateTotal={dashboardKpis.weeklyWorkouts.target}
          sub="workouts logged this week"
        />
        <KpiCard
          icon={Flame}
          label="Current streak"
          value={`${dashboardKpis.currentStreak.value} days`}
          sub="keep it going"
        />
        <KpiCard
          icon={TrendingUp}
          label="Calories today"
          value={dashboardKpis.caloriesToday.value.toLocaleString()}
          plateValue={dashboardKpis.caloriesToday.value}
          plateTotal={dashboardKpis.caloriesToday.target}
          plateColor="iron"
          sub={`of ${dashboardKpis.caloriesToday.target.toLocaleString()} target`}
        />
        <KpiCard
          icon={Sparkles}
          label="Weight change"
          value={`${dashboardKpis.weightChangeKg.value} kg`}
          sub={dashboardKpis.weightChangeKg.sinceLabel}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-wide text-chalk">LATEST PLAN</h2>
          <Button as={Link} to="/app/ai-coach" variant="secondary" size="sm" className="gap-1.5">
            <Sparkles size={14} /> Generate new
          </Button>
        </div>

        {latestPlan ? (
          <div className="max-w-md">
            <WorkoutCard plan={latestPlan} onClick={() => {}} />
          </div>
        ) : (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <Sparkles className="text-tape" size={28} />
            <p className="text-sm text-muted">You haven’t generated a plan yet.</p>
            <Button as={Link} to="/app/ai-coach" size="sm">
              Generate your first workout
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
