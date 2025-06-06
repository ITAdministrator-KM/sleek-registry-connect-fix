import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Calendar, CheckCircle, Building, UserCheck } from 'lucide-react';
import { apiService } from '@/services/api';

interface StatsData {
  totalUsers: number;
  totalDepartments: number;
  totalDivisions: number;
  totalTokensToday: number;
  totalPublicUsers: number;
  completedServices: number;
}

const DashboardStats = () => {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalDepartments: 0,
    totalDivisions: 0,
    totalTokensToday: 0,
    totalPublicUsers: 0,
    completedServices: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if we have a token
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        setError('Authentication required');
        setIsLoading(false);
        return;
      }
      
      // Log the API calls for debugging
      console.log('Fetching dashboard stats...');
      
      // Fetch all data in parallel with error handling for each
      const [users, departments, divisions, publicUsers, todayTokens] = await Promise.allSettled([
        apiService.getUsers().catch(e => { 
          console.error('Error fetching users:', e);
          return [];
        }),
        apiService.getDepartments().catch(e => {
          console.error('Error fetching departments:', e);
          return [];
        }),
        apiService.getDivisions().catch(e => {
          console.error('Error fetching divisions:', e);
          return [];
        }),
        apiService.getPublicUsers().catch(e => {
          console.error('Error fetching public users:', e);
          return [];
        }),
        apiService.getTokens().catch(e => {
          console.error('Error fetching tokens:', e);
          return [];
        })
      ]);

      console.log('API responses:', { users, departments, divisions, publicUsers, todayTokens });

      const newStats: StatsData = {
        totalUsers: users.status === 'fulfilled' ? users.value?.length || 0 : 0,
        totalDepartments: departments.status === 'fulfilled' ? departments.value?.length || 0 : 0,
        totalDivisions: divisions.status === 'fulfilled' ? divisions.value?.length || 0 : 0,
        totalPublicUsers: publicUsers.status === 'fulfilled' ? publicUsers.value?.length || 0 : 0,
        totalTokensToday: todayTokens.status === 'fulfilled' ? todayTokens.value?.length || 0 : 0,
        completedServices: todayTokens.status === 'fulfilled' 
          ? (todayTokens.value || []).filter((token: any) => token?.status === 'completed').length 
          : 0
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error in fetchStats:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Staff',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Departments',
      value: stats.totalDepartments,
      icon: Building,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Divisions',
      value: stats.totalDivisions,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Public Users',
      value: stats.totalPublicUsers,
      icon: UserCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Today\'s Tokens',
      value: stats.totalTokensToday,
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Completed Services',
      value: stats.completedServices,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
