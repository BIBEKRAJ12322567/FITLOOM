import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import Card from './Card';
import StarRating from './StarRating';

export default function GymCard({ gym }) {
  return (
    <Link to={`/app/gyms/${gym._id}`}>
      <Card className="h-full transition-colors hover:border-tape/50">
        <h3 className="font-display text-xl tracking-wide text-chalk">{gym.name}</h3>
        {gym.address?.city && (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted">
            <MapPin size={14} /> {gym.address.city}
          </p>
        )}
        <div className="mt-3">
          <StarRating value={gym.ratingAvg || 0} count={gym.ratingCount || 0} size={14} />
        </div>
        {gym.facilities?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {gym.facilities.slice(0, 3).map((f) => (
              <span key={f} className="rounded-full bg-raised px-2 py-0.5 text-xs text-muted">
                {f}
              </span>
            ))}
          </div>
        )}
      </Card>
    </Link>
  );
}