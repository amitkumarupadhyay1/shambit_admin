'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Building2 } from 'lucide-react';

export default function PropertiesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Property Management
        </h1>
        <p className="text-gray-600 mt-2">
          Review and manage property listings
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Property management features will be available soon. You&apos;ll be able to:
          </p>
          <ul className="mt-4 space-y-2 text-gray-600">
            <li className="flex items-center gap-2">
              <span className="text-emerald-600">•</span>
              Review property submissions
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-600">•</span>
              Approve or reject properties
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-600">•</span>
              Edit property details
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-600">•</span>
              Manage property visibility
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
