import { Link } from 'react-router-dom';
import {
  Users,
  Video,
  MapPinned,
  CalendarCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import SectionHeading from '../../components/ui/SectionHeading';

const MEMBER_FEATURES = [
  {
    icon: Users,
    title: 'Browse real trainers',
    body: 'See specializations, hourly rate, and a rating before you book — no cold calls or DMs.',
  },
  {
    icon: CalendarCheck,
    title: 'Book into open slots',
    body: "Each trainer sets their own weekly availability. Pick a time that's actually open and book it instantly.",
  },
  {
    icon: Video,
    title: 'Video or in person',
    body: 'Train from home over video, or book an in-person session — your choice, every time.',
  },
];

export default function TrainersPublic() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-steel">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-tape">
              <Sparkles size={16} />
              Personal coaching, on demand
            </p>
            <h1 className="font-display text-4xl leading-[1.05] text-chalk sm:text-5xl lg:text-6xl">
              BOOK A TRAINER.
              <br />
              <span className="text-tape">SKIP THE GUESSWORK.</span>
            </h1>
            <p className="mt-6 text-lg text-muted">
              Browse trainers by specialization, see their real availability, and book a session
              — video or in person — in a couple of taps.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button as={Link} to="/register" size="lg" className="gap-2">
                Find a trainer <ArrowRight size={18} />
              </Button>
              <Button as={Link} to="/register?role=trainer" variant="secondary" size="lg">
                I'm a trainer — list me
              </Button>
            </div>
          </div>
        </div>
        <div className="h-2 w-full bg-gradient-to-r from-tape via-tape/60 to-transparent" />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="For members"
          title="A trainer that fits your schedule, not the other way around"
        />
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {MEMBER_FEATURES.map((f) => (
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
                eyebrow="For trainers"
                title="Set your rate, set your hours, get booked"
              />
              <p className="mt-4 text-sm text-muted">
                Create a profile with your specializations and hourly rate, mark out your weekly
                availability, and members can book straight into your open slots — no back-and-forth
                messaging to find a time that works.
              </p>
              <Button as={Link} to="/register?role=trainer" className="mt-6 gap-2">
                Set up your trainer profile <ArrowRight size={16} />
              </Button>
            </div>
            <Card className="flex flex-col items-start gap-4">
              <span className="rounded-lg bg-raised p-3 text-tape">
                <MapPinned size={22} />
              </span>
              <h3 className="font-display text-2xl tracking-wide text-chalk">
                You control the schedule
              </h3>
              <p className="text-sm text-muted">
                Confirm or decline each booking yourself. Nothing is locked in on your calendar
                without your say-so.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-4xl text-chalk sm:text-5xl">READY TO GET STARTED?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Whether you're looking for a coach or you are one, it takes a minute to get set up.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button as={Link} to="/register" size="lg" className="gap-2">
            Find a trainer <ArrowRight size={18} />
          </Button>
          <Button as={Link} to="/register?role=trainer" variant="secondary" size="lg">
            List yourself as a trainer
          </Button>
        </div>
      </section>
    </div>
  );
}