import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  CreditCard,
  Trophy,
  Package,
  QrCode,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import SectionHeading from '../../components/ui/SectionHeading';

const DASHBOARD_FEATURES = [
  {
    icon: Users,
    title: 'Members, in one place',
    body: 'See every active member, their plan, and renewal date. No more spreadsheets or a register book at the front desk.',
  },
  {
    icon: CreditCard,
    title: 'Plans & memberships',
    body: 'Set up your own membership plans and pricing. Members join and renew themselves from the app — you just watch it happen.',
  },
  {
    icon: Package,
    title: 'Supplement store',
    body: "List products from your gym's own supplement counter and let members order directly, no separate POS needed.",
  },
  {
    icon: Trophy,
    title: 'Leaderboard',
    body: 'A built-in leaderboard keeps your members motivated and coming back — powered by the same activity data as their AI coach.',
  },
];

const WHY = [
  'Members find and join your gym by browsing gyms in their city — real discovery, not just word of mouth.',
  'Reviews and a star rating build trust before someone ever walks in.',
  'Your dashboard is scoped to your gym only — nothing you see or manage touches any other gym on the platform.',
];

export default function Gym() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-steel">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-tape">
              <Building2 size={16} />
              For gym owners
            </p>
            <h1 className="font-display text-4xl leading-[1.05] text-chalk sm:text-5xl lg:text-6xl">
              RUN YOUR GYM
              <br />
              <span className="text-tape">WITHOUT THE PAPERWORK.</span>
            </h1>
            <p className="mt-6 text-lg text-muted">
              List your gym, manage members and plans, sell from your supplement store, and let
              people find and join you — all from one dashboard, free to start.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button as={Link} to="/register?role=gym_owner" size="lg" className="gap-2">
                Register your gym <ArrowRight size={18} />
              </Button>
              <Button as={Link} to="/login" variant="secondary" size="lg">
                Already registered? Log in
              </Button>
            </div>
          </div>
        </div>
        <div className="h-2 w-full bg-gradient-to-r from-tape via-tape/60 to-transparent" />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Your management dashboard"
          title="Everything your front desk used to track, now in one tab bar"
          subtitle="Overview, members, plans, products, and a leaderboard — all scoped to your gym."
        />
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DASHBOARD_FEATURES.map((f) => (
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
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionHeading
                eyebrow="Why gyms list here"
                title="Members are already looking for a gym like yours"
              />
              <ul className="mt-6 space-y-4">
                {WHY.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-muted">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-tape" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="flex flex-col items-start gap-4">
              <span className="rounded-lg bg-raised p-3 text-tape">
                <QrCode size={22} />
              </span>
              <h3 className="font-display text-2xl tracking-wide text-chalk">
                Set up takes minutes
              </h3>
              <p className="text-sm text-muted">
                Register your gym, add your facilities and a membership plan, and you&apos;re
                live. Members can find you, join, and start training the same day.
              </p>
              <Button as={Link} to="/register?role=gym_owner" className="gap-2">
                Get started <ArrowRight size={16} />
              </Button>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-4xl text-chalk sm:text-5xl">READY TO GO DIGITAL?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Create your gym owner account and set up your gym&apos;s dashboard in a few minutes —
          free to start.
        </p>
        <Button as={Link} to="/register?role=gym_owner" size="lg" className="mt-8 gap-2">
          Register your gym <ArrowRight size={18} />
        </Button>
      </section>
    </div>
  );
}