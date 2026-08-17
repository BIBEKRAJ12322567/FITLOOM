import { Link } from 'react-router-dom';
import {
  Dumbbell,
  Sparkles,
  ListChecks,
  Calculator,
  ArrowRight,
  PlayCircle,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import SectionHeading from '../../components/ui/SectionHeading';

const FEATURES = [
  {
    icon: ListChecks,
    title: 'A real exercise library',
    body: 'Search and filter by muscle group, equipment, and difficulty. Every exercise has step-by-step instructions, so "learn to train" isn\u2019t just a slogan.',
  },
  {
    icon: Sparkles,
    title: 'AI coach that knows your limits',
    body: 'Tell it your goal, your level, and any injuries — it builds your plan only from exercises that are actually safe for you.',
  },
  {
    icon: Dumbbell,
    title: 'Log it, track it, improve it',
    body: 'Log your actual sets, reps, and weight. Streaks, a training-volume trend, and progressive-overload suggestions keep you honest about progress.',
  },
  {
    icon: Calculator,
    title: 'Know your numbers',
    body: 'BMI, calorie/TDEE, and body fat calculators — the same formulas a trainer would use, free and instant.',
  },
];

export default function Fitness() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-steel">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-tape">
              <PlayCircle size={16} />
              Learn to train, for free
            </p>
            <h1 className="font-display text-4xl leading-[1.05] text-chalk sm:text-5xl lg:text-6xl">
              NO TRAINER FEE.
              <br />
              <span className="text-tape">NO GUESSWORK.</span>
            </h1>
            <p className="mt-6 text-lg text-muted">
              Bodyweight fundamentals, machine tutorials, and a full exercise library with
              instructions for every movement — plus an AI coach that builds your plan around
              your actual level and injuries, not a generic template.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button as={Link} to="/register" size="lg" className="gap-2">
                Start free <ArrowRight size={18} />
              </Button>
              <Button as={Link} to="/login" variant="secondary" size="lg">
                Already have an account? Log in
              </Button>
            </div>
          </div>
        </div>
        <div className="h-2 w-full bg-gradient-to-r from-tape via-tape/60 to-transparent" />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What you get"
          title="Everything to go from first push-up to progressive overload"
          subtitle="No equipment required to start — just an account."
        />
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="h-full">
              <span className="mb-4 inline-flex rounded-lg bg-raised p-3 text-tape">
                <f.icon size={22} />
              </span>
              <h3 className="mb-2 font-display text-xl tracking-wide text-chalk">{f.title}</h3>
              <p className="text-sm text-muted">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-steel bg-panel">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl text-chalk sm:text-5xl">READY TO LOAD THE BAR?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Create your free account and get your first AI-generated workout in under a minute.
          </p>
          <Button as={Link} to="/register" size="lg" className="mt-8 gap-2">
            Start free <ArrowRight size={18} />
          </Button>
        </div>
      </section>
    </div>
  );
}