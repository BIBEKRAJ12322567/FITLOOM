import { Construction } from 'lucide-react';
import Card from './Card';

export default function ComingSoon({ title, note }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="rounded-full bg-raised p-3 text-tape">
        <Construction size={22} />
      </span>
      <h1 className="font-display text-3xl tracking-wide text-chalk">{title}</h1>
      <p className="max-w-md text-sm text-muted">
        {note || 'This page is next in the build queue — routing and layout are wired, content is coming.'}
      </p>
    </Card>
  );
}
