import { AlertTriangle, Clock3, MessageSquareText, Search } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatDateTime } from '@/lib/utils';
import type { AdminSupportTicket } from '@/services/support';
import { getSenderLabel, getStatusLabel, getStatusTone } from './supportFormat';

interface SupportQueueProps {
  tickets: AdminSupportTicket[];
  selectedRef: string | null;
  searchTerm: string;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onSelectTicket: (reference: string) => void;
}

export function SupportQueue({
  tickets,
  selectedRef,
  searchTerm,
  isLoading,
  onSearchChange,
  onSelectTicket,
}: SupportQueueProps) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleTickets = tickets.filter((ticket) => {
    if (!normalizedSearch) return true;
    const haystack = [
      ticket.reference,
      ticket.customer_name,
      ticket.customer_email,
      ticket.customer_phone,
      ticket.subject,
      ticket.booking_reference_text,
      ticket.hotel_booking?.hotel_name,
      ticket.issue_category_display,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  return (
    <Card className="overflow-hidden rounded-lg hover:shadow-sm">
      <CardHeader className="space-y-4 border-b border-gray-100 bg-slate-50">
        <div>
          <CardTitle className="flex items-center gap-3 text-xl">
            <MessageSquareText className="h-5 w-5 text-orange-600" />
            Support Queue
          </CardTitle>
          <CardDescription className="mt-2">
            Prioritized by severity, unread activity, and latest customer action.
          </CardDescription>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search tickets, guests, hotels, bookings"
            className="pl-11"
          />
        </div>
      </CardHeader>

      <CardContent className="max-h-[calc(100vh-300px)] min-h-[520px] overflow-y-auto p-0">
        {isLoading ? (
          <LoadingSpinner size="lg" text="Loading support queue..." className="py-12" />
        ) : visibleTickets.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No tickets match the current filters.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visibleTickets.map((ticket) => {
              const isSelected = selectedRef === ticket.reference;
              const unreadCount = ticket.unread_message_count ?? 0;
              return (
                <button
                  key={ticket.reference}
                  type="button"
                  onClick={() => onSelectTicket(ticket.reference)}
                  className={`w-full px-5 py-4 text-left transition ${
                    isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900">{ticket.reference}</p>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusTone(ticket.status)}`}
                        >
                          {getStatusLabel(ticket.status)}
                        </span>
                        {ticket.is_code_red && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                            <AlertTriangle className="h-3 w-3" />
                            Code red
                          </span>
                        )}
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 truncate text-sm font-medium text-gray-900">
                        {ticket.subject}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {ticket.customer_name || 'Anonymous guest'}
                      </p>
                      {ticket.last_message_preview && (
                        <p className="mt-2 line-clamp-2 text-xs text-gray-500">
                          {getSenderLabel(ticket.last_message_preview.sender_type)}:{' '}
                          {ticket.last_message_preview.message}
                        </p>
                      )}
                    </div>

                    <div className="flex w-28 flex-col items-end gap-1 text-right text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">
                        {ticket.issue_category_display}
                      </span>
                      {ticket.expected_response_by && (
                        <span className="inline-flex items-center gap-1 text-amber-700">
                          <Clock3 className="h-3 w-3" />
                          SLA
                        </span>
                      )}
                      <span>{formatDateTime(ticket.updated_at)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
