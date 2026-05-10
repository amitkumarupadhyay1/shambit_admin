'use client';

import { type ComponentType, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Mail,
  Phone,
  RefreshCcw,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { formatDateTime } from '@/lib/utils';
import type { AdminSupportTicket, SupportTicketStatus } from '@/services/support';
import {
  getStatusLabel,
  getStatusTone,
  statusActionLabels,
} from './supportFormat';

interface TicketInspectorProps {
  ticket: AdminSupportTicket | null;
  isMutating: boolean;
  onTransition: (status: SupportTicketStatus, note: string) => Promise<void>;
  onSaveNotes: (notes: string) => Promise<void>;
}

export function TicketInspector({
  ticket,
  isMutating,
  onTransition,
  onSaveNotes,
}: TicketInspectorProps) {
  const [transitionNote, setTransitionNote] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState<SupportTicketStatus | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    setAdminNotes(ticket?.admin_notes ?? '');
    setTransitionNote('');
  }, [ticket?.id, ticket?.admin_notes]);

  const sortedTimeline = useMemo(
    () =>
      [...(ticket?.timeline_events ?? [])].sort(
        (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
      ),
    [ticket?.timeline_events]
  );

  if (!ticket) {
    return (
      <Card className="rounded-lg hover:shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Ticket Context</CardTitle>
          <CardDescription>Select a queue item to see booking and workflow controls.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const transitions = ticket.allowed_status_transitions ?? [];

  const handleTransition = async (status: SupportTicketStatus) => {
    setSavingStatus(status);
    try {
      await onTransition(status, transitionNote);
      setTransitionNote('');
    } finally {
      setSavingStatus(null);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await onSaveNotes(adminNotes);
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-lg hover:shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{ticket.reference}</CardTitle>
              <CardDescription className="mt-2">{ticket.subject}</CardDescription>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(ticket.status)}`}
            >
              {getStatusLabel(ticket.status)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <InfoRow icon={User} label="Customer" value={ticket.customer_name || 'Anonymous guest'} />
          <InfoRow icon={Mail} label="Email" value={ticket.customer_email || 'No email'} />
          <InfoRow icon={Phone} label="Phone" value={ticket.customer_phone || 'No phone'} />
          <InfoRow
            icon={ClipboardList}
            label="Category"
            value={ticket.issue_category_display}
          />
          {ticket.expected_response_by && (
            <InfoRow
              icon={CalendarDays}
              label="Expected response"
              value={formatDateTime(ticket.expected_response_by)}
            />
          )}
          {ticket.hotel_booking && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 text-slate-500" />
                <div>
                  <p className="font-semibold text-slate-900">{ticket.hotel_booking.hotel_name}</p>
                  <p className="mt-1 text-slate-600">
                    {ticket.hotel_booking.booking_reference} · {ticket.hotel_booking.hotel_city}
                  </p>
                  <p className="mt-1 text-slate-500">
                    {ticket.hotel_booking.check_in} to {ticket.hotel_booking.check_out}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Customer description
            </p>
            <p className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
              {ticket.description}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg hover:shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Workflow</CardTitle>
          <CardDescription>Move the ticket through the backend support state machine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={transitionNote}
            onChange={(event) => setTransitionNote(event.target.value)}
            placeholder="Optional handoff note for the timeline"
            rows={3}
          />
          <div className="flex flex-wrap gap-2">
            {transitions.length === 0 ? (
              <span className="text-sm text-slate-500">No further transitions available.</span>
            ) : (
              transitions.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={status === 'CLOSED' ? 'danger' : 'outline'}
                  isLoading={savingStatus === status || isMutating}
                  onClick={() => handleTransition(status)}
                >
                  {statusActionLabels[status]}
                </Button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg hover:shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Internal Notes</CardTitle>
          <CardDescription>Private operational notes for support staff.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={adminNotes}
            onChange={(event) => setAdminNotes(event.target.value)}
            placeholder="Add settlement IDs, escalation owners, or risk notes"
            rows={5}
          />
          <Button
            size="sm"
            variant="secondary"
            isLoading={isSavingNotes}
            disabled={isMutating}
            onClick={handleSaveNotes}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Save notes
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-lg hover:shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Timeline</CardTitle>
          <CardDescription>Status and support workflow audit trail.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedTimeline.length === 0 ? (
            <p className="text-sm text-slate-500">No timeline events yet.</p>
          ) : (
            sortedTimeline.slice(0, 12).map((event, index) => (
              <div key={`${event.timestamp}-${index}`} className="flex gap-3">
                <div className="mt-1 rounded-full bg-orange-100 p-1.5 text-orange-600">
                  <RefreshCcw className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{event.message}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {event.actor} · {formatDateTime(event.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="mt-0.5 h-4 w-4 text-slate-500" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-slate-800">{value}</p>
      </div>
    </div>
  );
}
