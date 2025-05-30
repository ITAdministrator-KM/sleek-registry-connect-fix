import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import PublicDashboard from './pages/PublicDashboard';
import { Toaster } from "@/components/ui/toaster"
import QRScanPage from './pages/QRScanPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/public" element={<PublicDashboard />} />
        <Route path="/qr-scan/:publicId" element={<QRScanPage />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
