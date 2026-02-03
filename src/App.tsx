import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Diet from './pages/Diet';
import Sleep from './pages/Sleep';
import Insights from './pages/Insights';
import Profile from './pages/Profile';
import Labs from './pages/Labs';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="workouts" element={<Workouts />} />
        <Route path="diet" element={<Diet />} />
        <Route path="sleep" element={<Sleep />} />
        <Route path="insights" element={<Insights />} />
        <Route path="profile" element={<Profile />} />
        <Route path="labs" element={<Labs />} />
      </Route>
    </Routes>
  );
}

export default App;
