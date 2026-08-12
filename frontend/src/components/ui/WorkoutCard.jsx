import { Calendar, Sparkles, ChevronRight } from 'lucide-react';
import Card from './Card';
import Badge from './Badge';

export default function WorkoutCard({ plan, onClick }) {
  const dayCount = plan.days?.length || 0;
  const exerciseCount = plan.days?.reduce((sum, d) => sum + (d.exercises?.length || 0), 0) || 0;

  return (
    <Card
      as="button"
      onClick={onClick}
      className="w-full text-left transition-colors hover:border-tape/50"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-xl tracking-wide text-chalk">{plan.title}</h3>
          <p className="mt-0.5 text-sm capitalize text-muted">{plan.goal?.replace('_', ' ')}</p>
        </div>
        {plan.generatedByAI && (
          <Badge tone="tape" className="flex items-center gap-1">
            <Sparkles size={12} /> AI
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-steel pt-3 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <Calendar size={14} /> {dayCount} days · {exerciseCount} exercises
        </span>
        <ChevronRight size={16} className="text-tape" />
      </div>
    </Card>
  );
}
