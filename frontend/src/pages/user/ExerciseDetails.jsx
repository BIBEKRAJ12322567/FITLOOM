import { useParams } from 'react-router-dom';
import ComingSoon from '../../components/ui/ComingSoon';
export default function ExerciseDetails() {
  const { id } = useParams();
  return <ComingSoon title="EXERCISE DETAILS" note={`Detail view for exercise ${id} — video, muscle targeting, and form cues land here next.`} />;
}
