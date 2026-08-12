import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';

export default function Profile() {
  const { user } = useAuth();
  return (
    <Card className="mx-auto max-w-xl">
      <h1 className="mb-4 font-display text-3xl tracking-wide text-chalk">PROFILE</h1>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between border-b border-steel pb-2">
          <dt className="text-muted">Name</dt>
          <dd className="font-medium text-chalk">{user?.profile?.name || '—'}</dd>
        </div>
        <div className="flex justify-between border-b border-steel pb-2">
          <dt className="text-muted">Email</dt>
          <dd className="font-medium text-chalk">{user?.email || '—'}</dd>
        </div>
        <div className="flex justify-between border-b border-steel pb-2">
          <dt className="text-muted">Role</dt>
          <dd className="font-medium capitalize text-chalk">{user?.role?.replace('_', ' ') || '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Plan</dt>
          <dd className="font-medium capitalize text-chalk">{user?.subscriptionTier || 'free'}</dd>
        </div>
      </dl>
      <p className="mt-6 text-xs text-muted">
        Full edit form (goals, injuries, experience level) is next in the build queue.
      </p>
    </Card>
  );
}
