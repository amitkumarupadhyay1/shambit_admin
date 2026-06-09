'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Building2, Users, TrendingUp, ShieldAlert, Activity, Database, HardDrive, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { getSystemHealth, getDashboardStats } from '@/services/dashboard';

export default function DashboardPage() {
  const { data: health, isLoading: isHealthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: getSystemHealth,
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000,
  });

  const handleRefresh = () => {
    refetchHealth();
    refetchStats();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="relative flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-3">
              Welcome to ShamBit Admin
            </h1>
            <p className="text-blue-100 text-lg">
              Manage your platform, monitor usage, and oversee operations
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isHealthLoading || isStatsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-900">
                Total Users
              </CardTitle>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <div className="h-9 bg-gray-200 rounded animate-pulse w-1/2"></div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">{stats?.users.total || 0}</p>
                <p className="text-sm text-emerald-600 mt-1 font-medium">{stats?.users.active || 0} active</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-900">
                Active OTP Limits
              </CardTitle>
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <div className="h-9 bg-gray-200 rounded animate-pulse w-1/2"></div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">{stats?.auth.active_otp_limits || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Rate limited users</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-900">
                Total Properties
              </CardTitle>
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <div className="h-9 bg-gray-200 rounded animate-pulse w-1/2"></div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">{stats?.platform.properties || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Platform listings</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-900">
                Platform Revenue
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <div className="h-9 bg-gray-200 rounded animate-pulse w-1/2"></div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">₹{stats?.platform.revenue || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Total volume</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* System Status */}
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>System Status</CardTitle>
              {isHealthLoading ? (
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
              ) : health?.status === 'healthy' ? (
                <div className="flex items-center text-sm text-emerald-600 font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                  All Systems Operational
                </div>
              ) : (
                <div className="flex items-center text-sm text-red-600 font-medium">
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                  System Degraded
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Backend API */}
              <div className={`flex items-center justify-between p-3 rounded-lg ${health?.status === 'healthy' ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                <div className="flex items-center">
                  <Activity className={`w-4 h-4 mr-2 ${health ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-900">Backend API</span>
                </div>
                <span className={`text-sm font-semibold ${health ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {health ? `${health.response_time_ms}ms` : 'Checking...'}
                </span>
              </div>

              {/* Database */}
              <div className={`flex items-center justify-between p-3 rounded-lg ${health?.dependencies?.database?.status === 'connected' ? 'bg-emerald-50' : health ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div className="flex items-center">
                  <Database className={`w-4 h-4 mr-2 ${health?.dependencies?.database?.status === 'connected' ? 'text-emerald-600' : health ? 'text-red-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-900">Database</span>
                </div>
                <span className={`text-sm font-semibold ${health?.dependencies?.database?.status === 'connected' ? 'text-emerald-600' : health ? 'text-red-600' : 'text-gray-500'}`}>
                  {health ? health.dependencies.database.status.toUpperCase() : 'Checking...'}
                </span>
              </div>

              {/* Redis Cache */}
              <div className={`flex items-center justify-between p-3 rounded-lg ${health?.dependencies?.cache?.status === 'connected' ? 'bg-emerald-50' : health ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div className="flex items-center">
                  <Activity className={`w-4 h-4 mr-2 ${health?.dependencies?.cache?.status === 'connected' ? 'text-emerald-600' : health ? 'text-red-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-900">Redis Cache</span>
                </div>
                <span className={`text-sm font-semibold ${health?.dependencies?.cache?.status === 'connected' ? 'text-emerald-600' : health ? 'text-red-600' : 'text-gray-500'}`}>
                  {health ? health.dependencies.cache.status.toUpperCase() : 'Checking...'}
                </span>
              </div>

              {/* Storage */}
              <div className={`flex items-center justify-between p-3 rounded-lg ${health?.dependencies?.storage?.status === 'available' ? 'bg-emerald-50' : health ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div className="flex items-center">
                  <HardDrive className={`w-4 h-4 mr-2 ${health?.dependencies?.storage?.status === 'available' ? 'text-emerald-600' : health ? 'text-red-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-900">Cloud Storage</span>
                </div>
                <span className={`text-sm font-semibold ${health?.dependencies?.storage?.status === 'available' ? 'text-emerald-600' : health ? 'text-red-600' : 'text-gray-500'}`}>
                  {health ? health.dependencies.storage.status.toUpperCase() : 'Checking...'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Cloudinary Monitoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Monitor your Cloudinary usage, storage, and bandwidth in real-time.
              </p>
              <Link href="/cloudinary">
                <Button className="w-full">View Cloudinary Stats</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Partner Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Review and approve partner applications and property submissions.
              </p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
