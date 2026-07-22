'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Building2, CheckCircle2, RefreshCcw, Users, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { bookingsService } from '@/services/bookings';
import type { B2BManualOrder } from '@/types/booking';

type AllocationState = Record<string, Record<number, number>>;

function apiErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
  ) {
    return (error as { response: { data: { error: string } } }).response.data.error;
  }
  return fallback;
}

function toAmount(value: string | number | null | undefined) {
  const amount = typeof value === 'number' ? value : Number.parseFloat(value || '0');
  return Number.isFinite(amount) ? amount : 0;
}

export default function B2BManualAllocationPanel() {
  const [orders, setOrders] = useState<B2BManualOrder[]>([]);
  const [allocations, setAllocations] = useState<AllocationState>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await bookingsService.getPendingB2BManualOrders();
      setOrders(result);
      setError(null);
      setAllocations((current) => {
        const next = { ...current };
        for (const order of result) next[order.booking_reference] ??= {};
        return next;
      });
    } catch (loadError) {
      setError(apiErrorMessage(loadError, 'Unable to load pending B2B allocation requests.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const pendingRooms = useMemo(
    () => orders.reduce((total, order) => total + order.total_rooms, 0),
    [orders],
  );

  const setQuantity = (reference: string, roomTypeId: number, value: number, maximum: number) => {
    const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(maximum, Math.floor(value))) : 0;
    setAllocations((current) => ({
      ...current,
      [reference]: { ...(current[reference] || {}), [roomTypeId]: safeValue },
    }));
  };

  const confirmOrder = async (order: B2BManualOrder) => {
    const note = (notes[order.booking_reference] || '').trim();
    if (note.length < 10) {
      setError(`Add a hotel confirmation/allocation note of at least 10 characters for ${order.booking_reference}.`);
      return;
    }
    const allocationRows = Object.entries(allocations[order.booking_reference] || {})
      .map(([roomTypeId, quantity]) => ({ room_type_id: Number(roomTypeId), quantity }))
      .filter((item) => item.quantity > 0);
    const selectedTotal = allocationRows.reduce((total, item) => total + item.quantity, 0);
    if (selectedTotal !== order.total_rooms) {
      setError(`Allocate exactly ${order.total_rooms} rooms for ${order.booking_reference}.`);
      return;
    }
    if (!window.confirm(`Confirm allocation for ${order.booking_reference}?`)) return;

    setProcessing(order.booking_reference);
    setError(null);
    try {
      await bookingsService.confirmB2BManualAllocation(order.booking_reference, allocationRows, note);
      await loadOrders();
    } catch (confirmError) {
      setError(apiErrorMessage(confirmError, 'Unable to confirm this allocation.'));
    } finally {
      setProcessing(null);
    }
  };

  const rejectOrder = async (order: B2BManualOrder) => {
    const note = (notes[order.booking_reference] || '').trim();
    if (note.length < 10) {
      setError(`Add a rejection note of at least 10 characters for ${order.booking_reference}.`);
      return;
    }
    if (!window.confirm(`Reject ${order.booking_reference} and release its ledger hold?`)) return;
    setProcessing(order.booking_reference);
    setError(null);
    try {
      await bookingsService.rejectB2BManualOrder(order.booking_reference, note);
      await loadOrders();
    } catch (rejectError) {
      setError(apiErrorMessage(rejectError, 'Unable to reject this booking request.'));
    } finally {
      setProcessing(null);
    }
  };

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-700" /> B2B Manual Allocation Queue
            </CardTitle>
            <CardDescription className="mt-2">
              {orders.length} request(s) awaiting allocation, covering {pendingRooms} room(s).
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadOrders()} isLoading={loading} className="gap-2">
            <RefreshCcw className="h-4 w-4" /> Refresh queue
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {!loading && orders.length === 0 && (
          <div className="rounded-xl border border-dashed border-purple-200 bg-white p-6 text-center text-sm text-gray-600">
            No global bookings currently require manual allocation.
          </div>
        )}
        {orders.map((order) => {
          const selected = allocations[order.booking_reference] || {};
          const pricing = order.pricing_snapshot;
          const finalPayable = pricing?.final_b2b_selling_total || pricing?.b2b_selling_total || order.b2b_selling_total;
          const platformFee = toAmount(pricing?.platform_fee_total);
          const couponDiscount = toAmount(pricing?.coupon_discount_amount);
          const focDiscount = toAmount(pricing?.foc_discount_total);
          const focRooms = Number(pricing?.foc_rooms_granted || 0);
          const selectedTotal = Object.values(selected).reduce((total, quantity) => total + quantity, 0);
          const selectedCapacity = order.eligible_rooms.reduce(
            (total, room) => total + (selected[room.room_type_id] || 0) * room.max_adults,
            0,
          );
          const valid = selectedTotal === order.total_rooms && selectedCapacity >= order.total_guests;
          const isProcessing = processing === order.booking_reference;

          return (
            <div key={order.booking_reference} className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-bold text-gray-900">{order.booking_reference}</p>
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">Pending confirmation</span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2 font-semibold text-gray-900"><Building2 className="h-4 w-4" /> {order.hotel_name}</p>
                    <p>{order.global_rate_plan} · {order.agency_name} ({order.agent_email})</p>
                    <p>{formatDate(order.check_in)} to {formatDate(order.check_out)}{order.num_nights ? ` · ${order.num_nights} night(s)` : ''}</p>
                    <p>{order.total_rooms} rooms · {order.total_guests} adults · {formatCurrency(finalPayable)}</p>
                    <p>Primary guest: {order.primary_guest_name || 'Not provided'} · {order.contact_email || 'No email'}{order.contact_phone ? ` · ${order.contact_phone}` : ''}</p>
                    <p>Contract: {order.contract_number || 'Not captured'}{order.contract_version ? ` v${order.contract_version}` : ''}</p>
                    <p className="text-xs text-gray-500">Submitted {formatDateTime(order.created_at)}</p>
                    <p className="text-xs font-semibold text-amber-700">Confirmation deadline {formatDateTime(order.confirmation_deadline)}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 text-sm">
                  <p className="font-semibold text-gray-900">Allocation check</p>
                  <p className={selectedTotal === order.total_rooms ? 'mt-2 text-emerald-700' : 'mt-2 text-amber-700'}>Rooms: {selectedTotal} / {order.total_rooms}</p>
                  <p className={selectedCapacity >= order.total_guests ? 'text-emerald-700' : 'text-amber-700'}>Backend adult capacity: {selectedCapacity} / {order.total_guests}</p>
                  <p className="mt-2 text-xs text-gray-500">Payment: {order.payment_status || 'PENDING'} · Allocation: {order.allocation_status || 'PENDING'}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-gray-500">Subtotal</p>
                  <p className="mt-1 font-black text-gray-900">{formatCurrency(pricing?.b2b_selling_subtotal || finalPayable)}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-gray-500">Platform Fee</p>
                  <p className="mt-1 font-black text-gray-900">{formatCurrency(platformFee)}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-gray-500">Coupon</p>
                  <p className="mt-1 font-black text-gray-900">{couponDiscount > 0 ? `-${formatCurrency(couponDiscount)}` : formatCurrency(0)}</p>
                  {pricing?.coupon_code && <p className="mt-1 text-xs font-semibold text-emerald-700">{pricing.coupon_code}</p>}
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-gray-500">FOC Rooms</p>
                  <p className="mt-1 font-black text-gray-900">{focRooms}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-gray-500">FOC Benefit</p>
                  <p className="mt-1 font-black text-gray-900">{focDiscount > 0 ? `-${formatCurrency(focDiscount)}` : formatCurrency(0)}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-emerald-700">Final Payable</p>
                  <p className="mt-1 font-black text-emerald-900">{formatCurrency(finalPayable)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {order.eligible_rooms.map((room) => (
                  <label key={room.room_type_id} className="rounded-xl border border-gray-200 p-3">
                    <span className="block text-sm font-semibold text-gray-900">{room.name}</span>
                    <span className="mt-1 block text-xs text-gray-500">{room.available_rooms} available · {room.max_adults} adults/room{room.max_occupancy ? ` · ${room.max_occupancy} max occupancy` : ''}</span>
                    <Input
                      type="number"
                      min={0}
                      max={room.available_rooms}
                      value={selected[room.room_type_id] || 0}
                      onChange={(event) => setQuantity(order.booking_reference, room.room_type_id, Number(event.target.value), room.available_rooms)}
                      className="mt-2"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-5">
                <label className="text-sm font-semibold text-gray-900">Hotel confirmation / negotiation note</label>
                <textarea
                  value={notes[order.booking_reference] || ''}
                  onChange={(event) => setNotes((current) => ({ ...current, [order.booking_reference]: event.target.value }))}
                  rows={3}
                  maxLength={2000}
                  placeholder="Record who confirmed with the hotel, confirmation reference, or the precise rejection reason. This is retained in the audit trail."
                  className="mt-2 w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <Button variant="outline" onClick={() => void rejectOrder(order)} disabled={isProcessing} className="gap-2 text-red-700">
                  <XCircle className="h-4 w-4" /> Reject and release ledger
                </Button>
                <Button onClick={() => void confirmOrder(order)} disabled={!valid || isProcessing} isLoading={isProcessing} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Confirm allocation
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
