import { Link } from 'react-router-dom';
import { Check, ArrowRight, Building2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import SectionHeading from '../../components/ui/SectionHeading';

// NOTE for future work: these caps and the Premium gate itself are NOT
// enforced anywhere in the backend yet — User.subscriptionTier exists on
// the model but nothing checks it. Real payment is also still a mock
// (see backend/src/services/paymentService.js). TODOs to wire up before
// this plan is actually billable:
//   - enforce a monthly AI-workout-generation cap for subscriptionTier==='free'
//   - enforce a monthly AI-diet-plan cap for subscriptionTier==='free'
//   - gate progress trend chart / overload insights behind 'premium'
//   - wire a real payment gateway and an upgrade endpoint that flips
//     subscriptionTier once payment succeeds
const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Everything you need to start training with a real plan.',
    features: [
      'AI workout generator (3 plans/month)',
      'AI diet plan generator (2 plans/month)',
      'Full exercise library with filters',
      'Workout logging & streak tracking',
      'BMI, calorie, and body fat calculators',
      'Browse and join gyms',
    ],
    cta: 'Start free',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: '₹199',
    period: '/month',
    description: 'For people who want a plan every week, not once a month.',
    features: [
      'Unlimited AI workout generations',
      'Unlimited AI diet plan generations',
      'Training-volume trend charts',
      'Progressive-overload suggestions',
      'Everything in Free',
    ],
    cta: 'Join free for now',
    highlighted: true,
    launchingSoon: true,
  },
];

export default function Pricing() {
  return (
    <div>
      <section className="border-b border-steel">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-tape">
            Pricing
          </p>
          <h1 className="font-display text-4xl leading-tight text-chalk sm:text-5xl">
            SIMPLE PRICING, NO GYM MEMBERSHIP FINE PRINT
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Start free. Upgrade later if you want more from the AI coach — no card required to
            sign up.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlighted ? 'relative border-tape' : 'relative'}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-5 rounded-full bg-tape px-3 py-1 text-xs font-bold uppercase tracking-wide text-floor">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-2xl tracking-wide text-chalk">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted">{plan.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-mono text-4xl font-semibold text-chalk">{plan.price}</span>
                <span className="text-sm text-muted">{plan.period}</span>
              </div>

              {plan.launchingSoon && (
                <Badge tone="warning" className="mt-3">
                  Billing launching soon
                </Badge>
              )}

              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted">
                    <Check size={16} className="mt-0.5 shrink-0 text-tape" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                as={Link}
                to="/register"
                variant={plan.highlighted ? 'primary' : 'secondary'}
                className="mt-8 w-full gap-2"
              >
                {plan.cta} <ArrowRight size={16} />
              </Button>

              {plan.launchingSoon && (
                <p className="mt-3 text-center text-xs text-muted">
                  Sign up free today — you won&apos;t be charged, and you&apos;ll get early access
                  when Premium billing goes live.
                </p>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-steel bg-panel">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 lg:px-8">
          <span className="rounded-lg bg-raised p-3 text-tape">
            <Building2 size={22} />
          </span>
          <h2 className="font-display text-2xl tracking-wide text-chalk sm:text-3xl">
            Running a gym instead?
          </h2>
          <p className="max-w-md text-sm text-muted">
            Gym owner plans are priced separately based on how many members you manage.
          </p>
          <Button as={Link} to="/gym" variant="secondary" className="gap-2">
            See gym owner details <ArrowRight size={16} />
          </Button>
        </div>
      </section>
    </div>
  );
}