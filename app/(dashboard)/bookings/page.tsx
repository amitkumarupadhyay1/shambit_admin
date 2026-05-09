'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Calendar, ChevronLeft, ChevronRight, RefreshCcw, Search, Users } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { bookingsService } from '@/services/bookings';
import type { AdminBookingListResponse, AdminHotelBooking } from '@/types/booking';

const statusOptions = ['ALL', 'CONFIRMED', 'PENDING_PAYMENT', 'DRAFT', 'CANCELLED', 'EXPIRED'] as const;

const statusStyles: Record<string, string> = {
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING_PAYMENT: 'bg-amber-50 text-amber-700 border-amber-200',
  DRAFT: 'bg-blue-50 text-blue-700 border-blue-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  EXPIRED: 'bg-slate-100 text-slate-700 border-slate-200',
};

function getStatusClass(status: string) {
  return statusStyles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function BookingsPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminBookingListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>('ALL');

  const loadBookings = async (targetPage: number, showRefreshState = false) => {
    if (showRefreshState) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await bookingsService.getBookings(targetPage);
      setData(response);
      setError(null);
    } catch (loadError) {
      console.error('Failed to load admin bookings:', loadError);
      setError('Failed to load bookings from the backend. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadBookings(page);
  }, [page]);

  const visibleBookings = useMemo(() => {
    const bookings = data?.results ?? [];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const statusMatches = statusFilter === 'ALL' || booking.status === statusFilter;
      if (!statusMatches) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        booking.booking_reference,
        booking.customer_name,
        booking.customer_email,
        booking.customer_phone,
        booking.hotel.name,
        booking.hotel.city_name,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [data, searchTerm, statusFilter]);

  const confirmedCount = visibleBookings.filter((booking) => booking.status === 'CONFIRMED').length;
  const pendingCount = visibleBookings.filter((booking) => booking.status === 'PENDING_PAYMENT' || booking.status === 'DRAFT').length;
  const cancelledCount = visibleBookings.filter((booking) => booking.status === 'CANCELLED').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Booking Management</h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            Monitor real hotel bookings from the live backend, review booking status, and keep
            customer, partner, and admin visibility aligned.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 self-start"
          onClick={() => loadBookings(page, true)}
          isLoading={refreshing}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Bookings</CardDescription>
            <CardTitle className="text-3xl">{data?.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Visible This Page</CardDescription>
            <CardTitle className="text-3xl">{visibleBookings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Confirmed</CardDescription>
            <CardTitle className="text-3xl text-emerald-700">{confirmedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending or Draft</CardDescription>
            <CardTitle className="text-3xl text-amber-700">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-orange-600" />
              Live Booking Feed
            </CardTitle>
            <CardDescription className="mt-2">
              Search and filter the current page of live hotel bookings. Use pagination to inspect the
              rest of the dataset.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by reference, guest, hotel, email, or phone"
                className="pl-11"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option}
                  variant={statusFilter === option ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(option)}
                >
                  {option === 'ALL' ? 'All statuses' : option.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <LoadingSpinner size="lg" text="Loading live bookings..." className="py-12" />
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <p className="font-semibold">Unable to load bookings</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          ) : visibleBookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
              <p className="text-lg font-semibold text-gray-900">No bookings match the current filters</p>
              <p className="mt-2 text-sm text-gray-600">
                Try clearing the search or switching status filters. Cancelled bookings on this page: {cancelledCount}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleBookings.map((booking) => (
                <BookingRow key={booking.id} booking={booking} />
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Page {page}
              {data ? ` of ${Math.max(1, Math.ceil(data.count / 20))}` : ''}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!data?.previous}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((current) => current + 1)}
                disabled={!data?.next}
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BookingRow({ booking }: { booking: AdminHotelBooking }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-semibold text-gray-900">{booking.booking_reference}</p>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(booking.status)}`}>
              {booking.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <Building2 className="mt-0.5 h-4 w-4 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">{booking.hotel.name}</p>
              <p>
                {booking.hotel.short_address}, {booking.hotel.city_name}
              </p>
              <p className="mt-1">Room type: {booking.room_type.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <Users className="mt-0.5 h-4 w-4 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">{booking.customer_name || 'Guest not named'}</p>
              <p>{booking.customer_email || 'No email available'}</p>
              <p>{booking.customer_phone || 'No phone available'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:min-w-[360px]">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stay</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {formatDate(booking.check_in)} to {formatDate(booking.check_out)}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {booking.num_rooms} room(s), {booking.num_guests} guest(s)
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Booked</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">{formatDateTime(booking.created_at)}</p>
            <p className="mt-1 text-sm text-gray-600">{formatCurrency(booking.total_amount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
