'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Building2, Filter, ArrowRight, Loader2 } from 'lucide-react';
import { adminPropertyService } from '@/services/adminPropertyService';
import type { HotelPartnerProperty, PropertyStatus } from '@/types/property';
import toast from 'react-hot-toast';

const STATUS_VARIANTS: Record<PropertyStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  DRAFT: 'default',
  SUBMITTED: 'info',
  UNDER_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<HotelPartnerProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    city: '',
  });
  
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [filters]);

  const fetchProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await adminPropertyService.getProperties({
        status: debouncedFilters.status || undefined,
        city: debouncedFilters.city || undefined,
      });
      setProperties(response.results);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedFilters]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Property Management
          </h1>
          <p className="text-gray-600 mt-2">
            Review and manage property listings from partners
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                className="text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="DRAFT">Draft</option>
              </select>
              <input
                type="text"
                placeholder="Filter by city..."
                className="text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Loading properties...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
              <Building2 className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">No properties found matching your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">Property Details</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">Partner</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">Location</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {properties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">
                            {property.property_name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {property.property_name}
                            </p>
                            <p className="text-[10px] text-gray-500 uppercase font-medium tracking-tight">
                              {property.property_type} • {property.star_rating} Star
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-700">{property.partner_business_name}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-black">ID: #{property.partner}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={STATUS_VARIANTS[property.status]}>
                          {property.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-700">{property.city_name}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">{property.state}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/properties/${property.id}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            Review
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
