'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users } from 'lucide-react';

export default function PartnersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Partner Management
        </h1>
        <p className="text-gray-600 mt-2">
          Review and manage hotel partners
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Partner management features will be available soon. You&apos;ll be able to:
          </p>
          <ul className="mt-4 space-y-2 text-gray-600">
            <li className="flex items-center gap-2">
              <span className="text-blue-600">•</span>
              View all registered partners
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-600">•</span>
              Approve or reject partner applications
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-600">•</span>
              Manage partner status and permissions
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-600">•</span>
              View partner performance metrics
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
