'use client';

import { useEffect, useState } from 'react';
import { UsageCard } from '@/components/cloudinary/UsageCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { cloudinaryService } from '@/services/cloudinary';
import type { CloudinaryUsage } from '@/types/cloudinary';
import { Database, Zap, Image, AlertCircle, RefreshCw } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CloudinaryPage() {
  const [usage, setUsage] = useState<CloudinaryUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      setError(null);
      const data = await cloudinaryService.getUsage();
      setUsage(data);
    } catch (err) {
      console.error('Failed to fetch Cloudinary usage:', err);
      setError('Failed to load Cloudinary usage data. Showing mock data.');
      
      // Set mock data for development/testing
      setUsage({
        storage_used: 0,
        storage_limit: 25 * 1024 * 1024 * 1024, // 25GB
        storage_percent: 0,
        bandwidth_used: 0,
        bandwidth_limit: 25 * 1024 * 1024 * 1024, // 25GB
        bandwidth_percent: 0,
        transformations_used: 0,
        transformations_limit: 25000,
        transformations_percent: 0,
        credits_used: 0,
        credits_limit: 25,
        credits_percent: 0,
        status: 'safe',
        alerts: [],
      });
      
      toast.error('Using mock data - API not available');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchUsage();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsage();
    toast.success('Usage data refreshed');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading Cloudinary usage..." />
      </div>
    );
  }

  if (error || !usage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-16 h-16 text-orange-500" />
        <h2 className="text-2xl font-bold text-gray-900">API Not Available</h2>
        <p className="text-gray-600 text-center max-w-md">
          {error || 'Unknown error occurred'}
          <br />
          <span className="text-sm">The backend API endpoint may not be implemented yet.</span>
        </p>
        <Button onClick={fetchUsage}>Try Again</Button>
      </div>
    );
  }

  const getOverallStatus = () => {
    const maxPercent = Math.max(
      usage.storage_percent,
      usage.bandwidth_percent,
      usage.transformations_percent
    );
    if (maxPercent >= 90) return { label: 'Critical', color: 'text-red-600 bg-red-50' };
    if (maxPercent >= 75) return { label: 'Warning', color: 'text-orange-600 bg-orange-50' };
    return { label: 'Healthy', color: 'text-emerald-600 bg-emerald-50' };
  };

  const status = getOverallStatus();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Cloudinary Monitoring
          </h1>
          <p className="text-gray-600 mt-2">
            Track your Cloudinary usage, storage, and bandwidth in real-time
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          isLoading={isRefreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Overall Status Banner */}
      <Card className={`border-2 ${status.color.includes('red') ? 'border-red-200' : status.color.includes('orange') ? 'border-orange-200' : 'border-emerald-200'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Overall Status
              </h3>
              <p className="text-sm text-gray-600">
                Current plan: <span className="font-semibold">Free Tier</span>
              </p>
            </div>
            <div className={`px-6 py-3 rounded-xl ${status.color}`}>
              <p className="text-2xl font-bold">{status.label}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {usage.alerts && usage.alerts.length > 0 && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-lg">Active Alerts ({usage.alerts.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {usage.alerts.map((alert, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-orange-900">
                  <span className="text-orange-600 mt-0.5">•</span>
                  {alert}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Usage Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <UsageCard
          title="Storage"
          used={usage.storage_used}
          limit={usage.storage_limit}
          percent={usage.storage_percent}
          icon={<Database className="w-5 h-5" />}
        />
        <UsageCard
          title="Bandwidth"
          used={usage.bandwidth_used}
          limit={usage.bandwidth_limit}
          percent={usage.bandwidth_percent}
          icon={<Zap className="w-5 h-5" />}
        />
        <UsageCard
          title="Transformations"
          used={usage.transformations_used}
          limit={usage.transformations_limit}
          percent={usage.transformations_percent}
          icon={<Image className="w-5 h-5" aria-label="Transformations icon" />}
          formatValue={formatNumber}
        />
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5" role="img" aria-label="checkmark">✓</span>
              <span>
                <strong>Storage:</strong> Optimized images before upload reduce storage by 60-80%
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5" role="img" aria-label="checkmark">✓</span>
              <span>
                <strong>Bandwidth:</strong> Cloudinary CDN caches transformed images globally
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5" role="img" aria-label="checkmark">✓</span>
              <span>
                <strong>Transformations:</strong> Each unique transformation is cached and reused
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5" role="img" aria-label="checkmark">✓</span>
              <span>
                <strong>Cleanup:</strong> Deleted photos are automatically removed from Cloudinary
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
