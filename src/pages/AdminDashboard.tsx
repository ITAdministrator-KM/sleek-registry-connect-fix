import React, { useState } from 'react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import DashboardStats from '@/components/DashboardStats';
import UserManagement from '@/components/UserManagement';
import PublicAccountsManagement from '@/components/PublicAccountsManagement';
import DepartmentManagement from '@/components/DepartmentManagement';
import DivisionManagement from '@/components/DivisionManagement';
import SubjectStaffManagement from '@/components/SubjectStaffManagement';
import PublicRegistryWrapper from '@/components/public-registry/PublicRegistryWrapper';
import TokenManagement from '@/components/TokenManagement';
import AppointmentManagement from '@/components/AppointmentManagement';
import ServiceCatalogManagement from '@/components/ServiceCatalogManagement';
import NotificationManagement from '@/components/NotificationManagement';
import AccountSettings from '@/components/AccountSettings';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardStats />;
      case 'users':
        return <UserManagement />;
      case 'public-accounts':
        return <PublicAccountsManagement />;
      case 'departments':
        return <DepartmentManagement />;
      case 'divisions':
        return <DivisionManagement />;
      case 'subject-management':
        return <SubjectStaffManagement />;
      case 'public-registry':
        return <PublicRegistryWrapper />;
      case 'tokens':
        return <TokenManagement />;
      case 'appointments':
        return <AppointmentManagement />;
      case 'service-catalog':
        return <ServiceCatalogManagement />;
      case 'notifications':
        return <NotificationManagement />;
      case 'settings':
        return <AccountSettings />;
      default:
        return <DashboardStats />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 ml-64 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
