import { Link } from 'react-router-dom';
import {
  Dumbbell,
  ShieldCheck,
  Calculator,
  Building2,
  ArrowRight,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import SectionHeading from '../../components/ui/SectionHeading';

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: 'AI proposes, the data decides',
    body: "The workout generator only ever picks from exercises already filtered for your injuries and level — and every response is checked against that same list afterward, so a made-up exercise can't slip through.",
  },
  {
    icon: Calculator,
    title: 'The math is never left to the AI',
    body: 'Calorie targets and macros are computed with the Mifflin-St Jeor formula in plain server code. The AI designs meals inside those numbers — it never gets to do the arithmetic itself.',
  },
  {
    icon: Building2,
    title: 'One gym never sees another',
    body: "Every gym owner's dashboard is scoped strictly to their own gym, enforced at the database layer — not just hidden in the interface.",
  },
];

export default function About() {
  return (
    <div>
      <section className="border-b border-steel">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-raised text-tape">
            <Dumbbell size={26} />
          </span>
          <h1 className="font-display text-4xl leading-tight text-chalk sm:text-5xl">
            TRAIN. TRACK.
            <br />
            <span className="text-tape">IMPROVE. REPEAT.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            FitLoom exists because most people don&apos;t need another generic workout app —
            they need a plan that actually accounts for their injuries, their level, and their
            gym, and a gym owner who doesn&apos;t need three separate tools to run the place.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The story"
          title="Built by one developer, for a very specific frustration"
        />
        <div className="mt-6 space-y-4 text-muted">
          <p>
            Most AI fitness apps hand the model a blank page and hope it doesn&apos;t suggest a
            barbell squat to someone with a herniated disc. FitLoom takes the opposite approach:
            narrow the AI down to only what&apos;s actually safe first, then let it be creative
            within that boundary.
          </p>
          <p>
            The same philosophy runs through the rest of the platform — deterministic formulas
            for anything that has a right answer, AI for anything that benefits from judgment,
            and strict data isolation for any gym owner trusting the platform with their
            members&apos; information.
          </p>
          <p>
            It&apos;s an independently built project, still actively growing — new features ship
            regularly, and the roadmap is driven by what actually makes training and running a
            gym easier, not by feature-count.
          </p>
        </div>
      </section>

      <section className="border-t border-steel bg-panel">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="How it's built"
            title="A few principles that shape every feature"
            align="center"
            className="mx-auto text-center"
          />
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <Card key={p.title} className="h-full">
                <span className="mb-4 inline-flex rounded-lg bg-raised p-3 text-tape">
                  <p.icon size={22} />
                </span>
                <h3 className="mb-2 font-display text-xl tracking-wide text-chalk">{p.title}</h3>
                <p className="text-sm text-muted">{p.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-4xl text-chalk sm:text-5xl">TRY IT YOURSELF</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Free to join, free to train. Create an account and get your first AI-generated workout
          in under a minute.
        </p>
        <Button as={Link} to="/register" size="lg" className="mt-8 gap-2">
          Start free <ArrowRight size={18} />
        </Button>
      </section>
    </div>
  );
}