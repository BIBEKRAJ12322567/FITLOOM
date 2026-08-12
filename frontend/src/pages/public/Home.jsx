import { Link } from 'react-router-dom';
import { Dumbbell, Sparkles, Building2, Users, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import SectionHeading from '../../components/ui/SectionHeading';
 
const PILLARS = [
  {
    icon: Dumbbell,
    title: 'Learn to train, for free',
    body: 'Bodyweight fundamentals, machine tutorials, and a full exercise library with video for every movement — no trainer fee required.',
  },
  {
    icon: Sparkles,
    title: 'AI coach that knows your limits',
    body: 'Tell it your goal and any injuries — it builds your plan only from exercises that are actually safe for you, not generic advice.',
  },
  {
    icon: Building2,
    title: 'Your gym, in your pocket',
    body: 'Find your gym, manage your membership, renew your plan, and order supplements — all without a front-desk queue.',
  },
  {
    icon: Users,
    title: 'Real trainers when you want one',
    body: 'Browse verified trainers, book a session, and train over video call — or just use the app solo. Your call.',
  },
];
 
export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-steel">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-tape">
              AI-powered fitness &amp; gym platform
            </p>
            <h1 className="font-display text-5xl leading-[1.05] text-chalk sm:text-6xl lg:text-7xl">
              TRAIN. TRACK.
              <br />
              <span className="text-tape">IMPROVE. REPEAT.</span>
            </h1>
            <p className="mt-6 text-lg text-muted">
              Whether you’re learning your first push-up at home or running your gym’s whole
              operation — one platform, built for how people actually train.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button as={Link} to="/register" size="lg" className="gap-2">
                Start free <ArrowRight size={18} />
              </Button>
              <Button as={Link} to="/gym" variant="secondary" size="lg">
                I run a gym
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative rubber-floor accent bar instead of a stock photo */}
        <div className="h-2 w-full bg-gradient-to-r from-tape via-tape/60 to-transparent" />
      </section>
 
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Everything in one place"
          title="Built for beginners and gym owners alike"
          subtitle="Four pillars, one account."
        />
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <Card key={p.title} className="h-full">
              <span className="mb-4 inline-flex rounded-lg bg-raised p-3 text-tape">
                <p.icon size={22} />
              </span>
              <h3 className="mb-2 font-display text-xl tracking-wide text-chalk">{p.title}</h3>
              <p className="text-sm text-muted">{p.body}</p>
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
 