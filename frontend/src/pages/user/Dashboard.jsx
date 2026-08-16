import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, TrendingUp, Sparkles, Target } from 'lucide-react';
import KpiCard from '../../components/ui/KpiCard';
import WorkoutCard from '../../components/ui/WorkoutCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { authApi } from '../../api/authApi';
import { workoutApi } from '../../api/workoutApi';
import { dashboardKpis } from '../../data/mockData';

function startOfWeek() {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function Dashboard() {
  const [latestPlan, setLatestPlan] = useState(null);
  const [streakDays, setStreakDays] = useState(null);
  const [weeklyWorkoutCount, setWeeklyWorkoutCount] = useState(null);

  useEffect(() => {
    // Streak lives on the User document and only changes when a workout is
    // logged — refetch it here rather than trusting whatever was in the
    // JWT at login time, which could be stale by the time this page loads.
    authApi.me().then((data) => setStreakDays(data.user?.gamification?.streakDays ?? 0));

    workoutApi.listLogs(30).then((logs) => {
      const weekStart = startOfWeek();
      setWeeklyWorkoutCount(logs.filter((log) => new Date(log.date) >= weekStart).length);
    });

    // Instant path: AI Coach just wrote here after generating. Fallback:
    // fetch the user's most recent saved plan for a returning session.
    const stored = sessionStorage.getItem('latestWorkoutPlan');
    if (stored) {
      setLatestPlan(JSON.parse(stored));
    } else {
      workoutApi.listMyPlans().then((plans) => {
        if (plans.length > 0) setLatestPlan(plans[0]);
      });
    }
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Target}
          label="This week's workouts"
          value={weeklyWorkoutCount === null ? '—' : `${weeklyWorkoutCount}/${dashboardKpis.weeklyWorkouts.target}`}
          plateValue={weeklyWorkoutCount || 0}
          plateTotal={dashboardKpis.weeklyWorkouts.target}
          sub="workouts logged this week"
        />
        <KpiCard
          icon={Flame}
          label="Current streak"
          value={streakDays === null ? '—' : `${streakDays} day${streakDays !== 1 ? 's' : ''}`}
          sub="keep it going"
        />
        {/* Calories/weight-change don't have a real tracking feature behind
            them yet (no daily calorie log, no bodyweight log) — left as
            illustrative mock data rather than fabricating a number. */}
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