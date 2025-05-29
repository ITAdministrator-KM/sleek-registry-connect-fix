
import { Bell } from 'lucide-react';
import NotificationBell from './NotificationBell';

interface AdminHeaderProps {
  title: string;
  username: string;
}

const AdminHeader = ({ title, username }: AdminHeaderProps) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and oversee system operations</p>
        </div>
        <div className="flex items-center space-x-4">
          <NotificationBell />
          <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-lg">
            <span className="text-gray-700 font-medium">Welcome, {username}</span>
            <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
              {username.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
