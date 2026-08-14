import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, ShoppingBag, Loader2, CheckCircle2 } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import StarRating from '../../../components/ui/StarRating';
import { gymApi } from '../../../api/gymApi';

export default function GymDetail() {
  const { gymId } = useParams();
  const [gym, setGym] = useState(null);
  const [plans, setPlans] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [joiningPlanId, setJoiningPlanId] = useState(null);
  const [joinedMembership, setJoinedMembership] = useState(null);
  const [joinError, setJoinError] = useState('');

  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [detail, reviewList] = await Promise.all([gymApi.getDetail(gymId), gymApi.listReviews(gymId)]);
      setGym(detail.gym);
      setPlans(detail.plans);
      setReviews(reviewList);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not load this gym.');
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleJoin = async (planId) => {
    setJoiningPlanId(planId);
    setJoinError('');
    try {
      const membership = await gymApi.joinGym(gymId, planId);
      setJoinedMembership(membership);
    } catch (err) {
      setJoinError(err.response?.data?.error?.message || 'Could not join this gym. Try again.');
    } finally {
      setJoiningPlanId(null);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await gymApi.createReview(gymId, reviewForm);
      const [detail, reviewList] = await Promise.all([gymApi.getDetail(gymId), gymApi.listReviews(gymId)]);
      setGym(detail.gym);
      setReviews(reviewList);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted">
        <Loader2 size={18} className="animate-spin" /> Loading gym…
      </div>
    );
  }

  if (error || !gym) {
    return <p className="py-16 text-center text-sm text-danger">{error || 'Gym not found.'}</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-wide text-chalk">{gym.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted">
              {gym.address?.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {gym.address.city}
                </span>
              )}
              {gym.contactPhone && (
                <span className="flex items-center gap-1">
                  <Phone size={14} /> {gym.contactPhone}
                </span>
              )}
            </div>
            <div className="mt-2">
              <StarRating value={gym.ratingAvg || 0} count={gym.ratingCount || 0} />
            </div>
          </div>
          <Button as={Link} to={`/app/gyms/${gymId}/store`} variant="secondary" size="sm" className="gap-1.5">
            <ShoppingBag size={14} /> Supplement store
          </Button>
        </div>

        {gym.description && <p className="mt-4 text-sm text-muted">{gym.description}</p>}

        {gym.facilities?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {gym.facilities.map((f) => (
              <Badge key={f} tone="neutral">
                {f}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <div>
        <h2 className="mb-3 font-display text-2xl tracking-wide text-chalk">MEMBERSHIP PLANS</h2>

        {joinedMembership && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">You’re in!</p>
              <p className="mt-0.5 text-success/90">
                Membership active until {new Date(joinedMembership.endDate).toLocaleDateString()}. Find it
                anytime under My Gym.
              </p>
            </div>
          </div>
        )}
        {joinError && <p className="mb-4 text-sm text-danger">{joinError}</p>}

        {plans.length === 0 ? (
          <p className="text-sm text-muted">This gym hasn’t published any plans yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {plans.map((plan) => (
              <Card key={plan._id}>
                <h3 className="font-semibold text-chalk">{plan.name}</h3>
                <p className="mt-1 font-mono text-2xl font-semibold text-tape">
                  ₹{plan.price}
                  <span className="ml-1 text-sm text-muted">/ {plan.durationDays} days</span>
                </p>
                {plan.features?.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-muted">
                    {plan.features.map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                )}
                <Button
                  onClick={() => handleJoin(plan._id)}
                  disabled={joiningPlanId === plan._id}
                  className="mt-4 w-full"
                  size="sm"
                >
                  {joiningPlanId === plan._id ? 'Joining…' : 'Join with this plan'}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-2xl tracking-wide text-chalk">REVIEWS</h2>

        <Card className="mb-4">
          <form onSubmit={handleReviewSubmit} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Your rating</label>
              <StarRating
                value={reviewForm.rating}
                interactive
                onChange={(v) => setReviewForm((f) => ({ ...f, rating: v }))}
                size={22}
              />
            </div>
            <textarea
              rows={2}
              maxLength={1000}
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="How's this gym? (optional)"
              className="w-full rounded-lg border border-steel bg-raised px-4 py-2.5 text-chalk placeholder:text-muted/60 focus:border-tape focus:outline-none"
            />
            <Button type="submit" size="sm" disabled={submittingReview}>
              {submittingReview ? 'Submitting…' : 'Submit review'}
            </Button>
          </form>
        </Card>

        {reviews.length === 0 ? (
          <p className="text-sm text-muted">No reviews yet — be the first.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <Card key={review._id}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-chalk">
                    {review.userId?.profile?.name || 'A member'}
                  </span>
                  <StarRating value={review.rating} size={13} />
                </div>
                {review.comment && <p className="mt-2 text-sm text-muted">{review.comment}</p>}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}