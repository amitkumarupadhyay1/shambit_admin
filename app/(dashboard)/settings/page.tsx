'use client';

import { Settings } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Platform-level settings live here. Pricing controls have moved to the dedicated Pricing workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Admin Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Use the sidebar Pricing section for tax, GST slabs, revenue profiles, rate plans,
            demand events, simulation, and audit logs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
