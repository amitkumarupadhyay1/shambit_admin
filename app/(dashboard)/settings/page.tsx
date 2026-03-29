'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure platform settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-purple-600" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Settings features will be available soon. You&apos;ll be able to:
          </p>
          <ul className="mt-4 space-y-2 text-gray-600">
            <li className="flex items-center gap-2">
              <span className="text-purple-600">•</span>
              Configure platform settings
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-600">•</span>
              Manage admin users
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-600">•</span>
              Set up email notifications
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-600">•</span>
              Configure payment gateways
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
