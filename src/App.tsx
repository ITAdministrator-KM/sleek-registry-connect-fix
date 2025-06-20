import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import PublicDashboard from './pages/PublicDashboard';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import QRScanPage from './pages/QRScanPage';
import { Toaster } from "@/components/ui/toaster"

import PublicDisplay from './pages/PublicDisplay';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/public" element={<PublicDashboard />} />
          <Route path="/qr-scan" element={<QRScanPage />} />
          
          {/* New public display route */}
          <Route path="/display" element={<PublicDisplay />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
