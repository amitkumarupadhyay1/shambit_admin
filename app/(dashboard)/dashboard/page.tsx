'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Building2, Users, Calendar, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="relative">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Welcome to ShamBit Admin
          </h1>
          <p className="text-blue-100 text-lg">
            Manage your platform, monitor usage, and oversee operations
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-900">
                Total Partners
              </CardTitle>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-500 mt-1">Coming soon</p>
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
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-500 mt-1">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-900">
                Total Bookings
              </CardTitle>
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-500 mt-1">Coming soon</p>
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
            <p className="text-3xl font-bold text-gray-900">₹0</p>
            <p className="text-sm text-gray-500 mt-1">Coming soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
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

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Backend API</span>
              <span className="text-sm text-emerald-600 font-semibold">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Database</span>
              <span className="text-sm text-emerald-600 font-semibold">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Cloudinary</span>
              <span className="text-sm text-emerald-600 font-semibold">Operational</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
