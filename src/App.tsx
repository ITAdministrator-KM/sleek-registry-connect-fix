import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import PublicDashboard from './pages/PublicDashboard';
import { Toaster } from "@/components/ui/toaster"
import PublicRegistry from './components/staff/PublicRegistry';
import SubjectStaffDashboard from './pages/SubjectStaffDashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/public" element={<PublicDashboard />} />
          <Route path="/subject-staff" element={<SubjectStaffDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
