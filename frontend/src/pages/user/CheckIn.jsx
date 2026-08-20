import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Dumbbell } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { attendanceApi } from '../../api/attendanceApi';
import { gymApi } from '../../api/gymApi';

/**
 * The page a gym's front-desk QR code points at: /app/checkin/:gymId.
 * There's no camera-scanning logic anywhere in this app — a phone camera
 * scanning the printed QR just opens this URL in the browser, and
 * "scanning" IS the person's browser hitting this page while logged in.
 * That's also exactly why this needs to auto-fire the check-in on load
 * rather than requiring a tap: the whole point of a wall-mounted QR code
 * is scan-and-go.
 */
export default function CheckIn() {
  const { gymId } = useParams();
  const [searchParams] = useSearchParams();
  const isQrScan = searchParams.get('method') === 'qr';

  const [status, setStatus] = useState('checking'); // checking | success | already | error
  const [gymName, setGymName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    gymApi.getDetail(gymId).then((data) => setGymName(data.gym?.name || 'your gym')).catch(() => {});

    attendanceApi
      .checkIn(gymId, isQrScan ? 'qr' : 'app')
      .then((result) => setStatus(result.alreadyCheckedIn ? 'already' : 'success'))
      .catch((err) => {
        setStatus('error');
        setErrorMessage(
          err.response?.data?.error?.message || 'Could not check you in. Try again from the gym page.'
        );
      });
    // Only run once per mount — this is a one-shot landing action, not
    // something that should re-fire on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <Card className="w-full">
        <div className="flex flex-col items-center gap-4 py-6">
          {status === 'checking' && (
            <>
              <Loader2 className="animate-spin text-tape" size={40} />
              <p className="text-lg font-semibold text-chalk">Checking you in…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="text-success" size={44} />
              <p className="text-lg font-semibold text-chalk">Checked in to {gymName}!</p>
              <p className="text-sm text-muted">Have a great workout.</p>
            </>
          )}

          {status === 'already' && (
            <>
              <Dumbbell className="text-tape" size={44} />
              <p className="text-lg font-semibold text-chalk">You're already checked in</p>
              <p className="text-sm text-muted">at {gymName} — no need to scan again.</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="text-danger" size={44} />
              <p className="text-lg font-semibold text-chalk">Couldn't check you in</p>
              <p className="text-sm text-muted">{errorMessage}</p>
            </>
          )}

          <Button as={Link} to="/app/my-gym" size="sm" variant="secondary" className="mt-2">
            Go to My Gym
          </Button>
        </div>
      </Card>
    </div>
  );
}