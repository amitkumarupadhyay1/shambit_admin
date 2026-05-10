'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Headset, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import type { AdminSupportTicket, SupportTicketStatus } from '@/services/support';
import { supportService } from '@/services/support';
import { SupportConversation } from './components/SupportConversation';
import { SupportMetrics } from './components/SupportMetrics';
import { SupportQueue } from './components/SupportQueue';
import { TicketInspector } from './components/TicketInspector';
import { isTerminalStatus } from './components/supportFormat';
import { useAdminSupportConversation } from './hooks/useAdminSupportConversation';

const QUEUE_REFRESH_MS = 25_000;

function getTicketActivityTime(ticket: AdminSupportTicket): number {
  return new Date(
    ticket.last_customer_action_at ??
      ticket.last_message_preview?.created_at ??
      ticket.updated_at ??
      ticket.created_at
  ).getTime();
}

function sortTickets(tickets: AdminSupportTicket[]): AdminSupportTicket[] {
  return [...tickets].sort((left, right) => {
    if (left.is_code_red !== right.is_code_red) {
      return Number(right.is_code_red) - Number(left.is_code_red);
    }

    const leftUnread = left.unread_message_count ?? 0;
    const rightUnread = right.unread_message_count ?? 0;
    if (leftUnread !== rightUnread) return rightUnread - leftUnread;

    const leftActive = !isTerminalStatus(left.status);
    const rightActive = !isTerminalStatus(right.status);
    if (leftActive !== rightActive) return Number(rightActive) - Number(leftActive);

    if (left.urgency_score !== right.urgency_score) {
      return right.urgency_score - left.urgency_score;
    }

    return getTicketActivityTime(right) - getTicketActivityTime(left);
  });
}

export default function SupportPage() {
  const searchParams = useSearchParams();
  const requestedTicketRef = searchParams.get('ticket');

  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const selectedRefState = useRef<string | null>(null);
  const appliedRequestedRef = useRef<string | null>(null);
  const activityRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.reference === selectedRef) ?? null,
    [selectedRef, tickets]
  );

  useEffect(() => {
    selectedRefState.current = selectedRef;
  }, [selectedRef]);

  const mergeUpdatedTicket = useCallback((updatedTicket: AdminSupportTicket) => {
    setTickets((current) =>
      sortTickets(
        current.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket))
      )
    );
  }, []);

  const loadTickets = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const nextTickets = sortTickets(await supportService.getTickets());
        setTickets(nextTickets);
        setPageError(null);

        const hasRequestedTicket =
          requestedTicketRef &&
          nextTickets.some((ticket) => ticket.reference === requestedTicketRef);
        const shouldApplyRequested =
          hasRequestedTicket && appliedRequestedRef.current !== requestedTicketRef;
        const currentSelection =
          selectedRefState.current &&
          nextTickets.some((ticket) => ticket.reference === selectedRefState.current)
            ? selectedRefState.current
            : null;

        if (shouldApplyRequested) {
          appliedRequestedRef.current = requestedTicketRef;
          setSelectedRef(requestedTicketRef);
        } else if (!currentSelection) {
          setSelectedRef(nextTickets[0]?.reference ?? null);
        }

        if (!requestedTicketRef) {
          appliedRequestedRef.current = null;
        }
      } catch (error) {
        console.error('Failed to load support tickets:', error);
        setPageError('Unable to load the support queue.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [requestedTicketRef]
  );

  const scheduleActivityRefresh = useCallback(() => {
    if (activityRefreshTimer.current) clearTimeout(activityRefreshTimer.current);
    activityRefreshTimer.current = setTimeout(() => {
      void loadTickets(true);
    }, 800);
  }, [loadTickets]);

  const conversation = useAdminSupportConversation(
    selectedRef,
    selectedTicket?.id ?? null,
    scheduleActivityRefresh
  );

  useEffect(() => {
    void loadTickets();
    const interval = setInterval(() => {
      void loadTickets(true);
    }, QUEUE_REFRESH_MS);

    return () => {
      clearInterval(interval);
      if (activityRefreshTimer.current) clearTimeout(activityRefreshTimer.current);
    };
  }, [loadTickets]);

  const handleTransition = async (status: SupportTicketStatus, note: string) => {
    if (!selectedTicket) return;
    setMutating(true);
    try {
      const updatedTicket = await supportService.transitionTicket(selectedTicket.id, status, note);
      mergeUpdatedTicket(updatedTicket);
      toast.success('Ticket status updated');
    } catch (error) {
      console.error('Failed to transition support ticket:', error);
      toast.error('Ticket status could not be updated');
      throw error;
    } finally {
      setMutating(false);
    }
  };

  const handleSaveNotes = async (notes: string) => {
    if (!selectedTicket) return;
    setMutating(true);
    try {
      const updatedTicket = await supportService.updateAdminNotes(selectedTicket.id, notes);
      mergeUpdatedTicket(updatedTicket);
      toast.success('Internal notes saved');
    } catch (error) {
      console.error('Failed to save support ticket notes:', error);
      toast.error('Internal notes could not be saved');
      throw error;
    } finally {
      setMutating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
              <Headset className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Support Operations
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Queue, conversation, workflow, and audit context.
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-2 self-start"
          onClick={() => loadTickets(true)}
          isLoading={refreshing}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {pageError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <span>{pageError}</span>
        </div>
      )}

      <SupportMetrics tickets={tickets} />

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)_420px]">
        <div className="xl:row-span-2 2xl:row-span-1">
          <SupportQueue
            tickets={tickets}
            selectedRef={selectedRef}
            searchTerm={searchTerm}
            isLoading={loading}
            onSearchChange={setSearchTerm}
            onSelectTicket={setSelectedRef}
          />
        </div>

        <SupportConversation ticket={selectedTicket} conversation={conversation} />

        <div className="min-w-0">
          <TicketInspector
            ticket={selectedTicket}
            isMutating={mutating}
            onTransition={handleTransition}
            onSaveNotes={handleSaveNotes}
          />
        </div>
      </div>
    </div>
  );
}
