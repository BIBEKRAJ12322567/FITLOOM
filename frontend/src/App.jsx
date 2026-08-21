import { Routes, Route } from 'react-router-dom';

import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Public pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Fitness from './pages/public/Fitness';
import Gym from './pages/public/Gym';
import TrainersPublic from './pages/public/Trainers';
import Pricing from './pages/public/Pricing';
import Login from './pages/public/Login';
import Register from './pages/public/Register';

// User (protected) pages
import Dashboard from './pages/user/Dashboard';
import Workout from './pages/user/Workout';
import Exercises from './pages/user/Exercises';
import ExerciseDetails from './pages/user/ExerciseDetails';
import Progress from './pages/user/Progress';
import AICoach from './pages/user/AICoach';
import DietPlan from './pages/user/DietPlan';
import CaloriesCalculator from './pages/user/calculators/CaloriesCalculator';
import BmiCalculator from './pages/user/calculators/BmiCalculator';
import BodyFatCalculator from './pages/user/calculators/BodyFatCalculator';
import MyGym from './pages/user/MyGym';
import CheckIn from './pages/user/CheckIn';
import AdminDashboard from './pages/user/AdminDashboard';
import BrowseGyms from './pages/user/gyms/BrowseGyms';
import GymDetail from './pages/user/gyms/GymDetail';
import GymStore from './pages/user/gyms/GymStore';
import OwnerDashboard from './pages/user/OwnerDashboard';
import UserTrainers from './pages/user/Trainers';
import TrainerDetail from './pages/user/TrainerDetail';
import TrainerStudio from './pages/user/TrainerStudio';
import Profile from './pages/user/Profile';

export default function App() {
  return (
    <Routes>
      {/* Public marketing site */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/fitness" element={<Fitness />} />
        <Route path="/gym" element={<Gym />} />
        <Route path="/trainers" element={<TrainersPublic />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Authenticated app */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="workout" element={<Workout />} />
        <Route path="exercises" element={<Exercises />} />
        <Route path="exercises/:id" element={<ExerciseDetails />} />
        <Route path="progress" element={<Progress />} />
        <Route path="ai-coach" element={<AICoach />} />
        <Route path="diet-plan" element={<DietPlan />} />
        <Route path="calculators/calories" element={<CaloriesCalculator />} />
        <Route path="calculators/bmi" element={<BmiCalculator />} />
        <Route path="calculators/body-fat" element={<BodyFatCalculator />} />
        <Route path="my-gym" element={<MyGym />} />
        <Route path="checkin/:gymId" element={<CheckIn />} />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="gyms" element={<BrowseGyms />} />
        <Route path="gyms/:gymId" element={<GymDetail />} />
        <Route path="gyms/:gymId/store" element={<GymStore />} />
        <Route path="owner" element={<OwnerDashboard />} />
        <Route path="trainers" element={<UserTrainers />} />
        <Route path="trainers/:trainerId" element={<TrainerDetail />} />
        <Route path="trainer-studio" element={<TrainerStudio />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-center">
            <h1 className="font-display text-5xl text-chalk">404</h1>
            <p className="text-muted">This page doesn’t exist.</p>
          </div>
        }
      />
    </Routes>
  );
}