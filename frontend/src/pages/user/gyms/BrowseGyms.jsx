import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import GymCard from '../../../components/ui/GymCard';
import { gymApi } from '../../../api/gymApi';

export default function BrowseGyms() {
  const [gyms, setGyms] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGyms = useCallback(async (searchTerm) => {
    setLoading(true);
    setError('');
    try {
      const data = await gymApi.list(searchTerm ? { search: searchTerm } : undefined);
      setGyms(data.gyms);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not load gyms.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGyms();
  }, [fetchGyms]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGyms(search);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-1 font-display text-3xl tracking-wide text-chalk">FIND A GYM</h1>
      <p className="mb-6 text-sm text-muted">Search by name, check facilities and ratings, join in a couple clicks.</p>

      <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search gyms by name..."
            className="w-full rounded-lg border border-steel bg-raised py-2.5 pl-9 pr-4 text-chalk placeholder:text-muted/60 focus:border-tape focus:outline-none"
          />
        </div>
      </form>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted">
          <Loader2 size={18} className="animate-spin" /> Loading gyms…
        </div>
      )}

      {error && <p className="py-8 text-center text-sm text-danger">{error}</p>}

      {!loading && !error && gyms.length === 0 && (
        <p className="py-16 text-center text-sm text-muted">No gyms found. Try a different search.</p>
      )}

      {!loading && gyms.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gyms.map((gym) => (
            <GymCard key={gym._id} gym={gym} />
          ))}
        </div>
      )}
    </div>
  );
}