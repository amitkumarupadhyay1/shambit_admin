'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatBytes } from '@/lib/utils';
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

interface UsageCardProps {
  title: string;
  used: number;
  limit: number;
  percent: number;
  icon: React.ReactNode;
  formatValue?: (value: number) => string;
}

export function UsageCard({
  title,
  used = 0,
  limit = 0,
  percent = 0,
  icon,
  formatValue = formatBytes,
}: UsageCardProps) {
  // Ensure values are numbers and handle undefined/null
  const safeUsed = Number(used) || 0;
  const safeLimit = Number(limit) || 0;
  const safePercent = Number(percent) || 0;

  const getStatusColor = () => {
    if (safePercent >= 90) return 'text-red-600 bg-red-50';
    if (safePercent >= 75) return 'text-orange-600 bg-orange-50';
    return 'text-emerald-600 bg-emerald-50';
  };

  const getProgressColor = () => {
    if (safePercent >= 90) return 'bg-red-600';
    if (safePercent >= 75) return 'bg-orange-500';
    return 'bg-emerald-500';
  };

  const getStatusIcon = () => {
    if (safePercent >= 90) return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (safePercent >= 75) return <TrendingUp className="w-5 h-5 text-orange-600" />;
    return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${getStatusColor()}`}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Stats */}
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {formatValue(safeUsed)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              of {formatValue(safeLimit)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-2xl font-bold text-gray-900">
              {safePercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${Math.min(safePercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-right">
            {formatValue(Math.max(safeLimit - safeUsed, 0))} remaining
          </p>
        </div>

        {/* Status Message */}
        {safePercent >= 90 && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-800">
              Critical: Usage is very high. Consider upgrading or cleanup.
            </p>
          </div>
        )}
        {safePercent >= 75 && safePercent < 90 && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <TrendingUp className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange-800">
              Warning: Usage is high. Monitor closely.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
