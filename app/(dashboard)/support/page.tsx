'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Circle,
  Headset,
  Loader2,
  MessageSquareText,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  TimerReset,
  Wifi,
  WifiOff,
} from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getAuthToken, getWsUrl } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import {
  supportService,
  type AdminSupportChatMessage,
  type AdminSupportTicket,
} from '@/services/support';

interface ChatMessage extends Omit<AdminSupportChatMessage, 'id'> {
  id: number | string;
  pending?: boolean;
  server_msg_id?: number;
}

const PING_INTERVAL_MS = 25_000;
const TYPING_DEBOUNCE_MS = 1_500;

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function getStatusClass(status: string): string {
  const styles: Record<string, string> = {
    OPEN: 'border-red-200 bg-red-50 text-red-700',
    IN_REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
    WAITING_ON_HOTEL: 'border-violet-200 bg-violet-50 text-violet-700',
    WAITING_ON_CUSTOMER: 'border-blue-200 bg-blue-50 text-blue-700',
    RESOLVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    CLOSED: 'border-slate-200 bg-slate-100 text-slate-700',
  };
  return styles[status] || 'border-slate-200 bg-slate-100 text-slate-700';
}

export default function SupportPage() {
  const searchParams = useSearchParams();
  const requestedTicketRef = searchParams.get('ticket');

  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [guestOnline, setGuestOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRefState = useRef<string | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSendingTyping = useRef(false);
  const confirmedIds = useRef<Set<number>>(new Set());

  const selectedTicket =
    tickets.find((ticket) => ticket.reference === selectedRef) ?? null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedRef]);

  useEffect(() => {
    selectedRefState.current = selectedRef;
  }, [selectedRef]);

  const loadTickets = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await supportService.getTickets();
      const sorted = [...response].sort((left, right) => {
        if (left.is_code_red !== right.is_code_red) {
          return Number(right.is_code_red) - Number(left.is_code_red);
        }
        return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
      });
      setTickets(sorted);
      setError(null);

      const preferredRef =
        requestedTicketRef && sorted.some((ticket) => ticket.reference === requestedTicketRef)
          ? requestedTicketRef
          : null;
      const stillValidSelection =
        selectedRefState.current &&
        sorted.some((ticket) => ticket.reference === selectedRefState.current)
          ? selectedRefState.current
          : null;
      const nextSelection = preferredRef || stillValidSelection || sorted[0]?.reference || null;
      setSelectedRef(nextSelection);
    } catch (loadError) {
      console.error('Failed to load support tickets:', loadError);
      setError('Unable to load the support queue right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestedTicketRef]);

  useEffect(() => {
    void loadTickets();

    const interval = setInterval(() => {
      void loadTickets(true);
    }, 30_000);

    return () => clearInterval(interval);
  }, [loadTickets]);

  useEffect(() => {
    if (!selectedRef) {
      setMessages([]);
      return;
    }

    let isCancelled = false;
    const loadConversation = async () => {
      setConversationLoading(true);
      confirmedIds.current.clear();

      try {
        const [history, presence] = await Promise.all([
          supportService.getChatHistory(selectedRef),
          supportService.getChatPresence(selectedRef),
        ]);

        if (isCancelled) return;

        setMessages(history.map((message) => ({ ...message, pending: false })));
        const participantCounts = presence.participant_counts ?? {};
        setGuestOnline(
          Boolean(
            (participantCounts.CUSTOMER ?? 0) +
            (participantCounts.PARTNER ?? 0) ||
            presence.is_online
          )
        );
        setError(null);
        await supportService.markChatMessagesRead(selectedRef);
      } catch (conversationError) {
        console.error('Failed to load support conversation:', conversationError);
        if (!isCancelled) {
          setError('Unable to load this conversation.');
        }
      } finally {
        if (!isCancelled) {
          setConversationLoading(false);
        }
      }
    };

    void loadConversation();

    return () => {
      isCancelled = true;
    };
  }, [selectedRef]);

  const handleServerEvent = useCallback((data: Record<string, unknown>) => {
    switch (data.type) {
      case 'chat_message': {
        const serverId = data.server_msg_id as number;
        if (confirmedIds.current.has(serverId)) break;
        setMessages((prev) => [
          ...prev,
          {
            id: serverId,
            ticket: 0,
            sender: null,
            sender_name: data.sender_name as string,
            sender_type: data.sender_type as 'CUSTOMER' | 'PARTNER' | 'ADMIN' | 'SYSTEM',
            message: data.message as string,
            context_data: (data.context_data as Record<string, unknown>) ?? {},
            is_read: false,
            created_at: data.created_at as string,
          },
        ]);
        break;
      }

      case 'message_ack': {
        const { client_msg_id, server_msg_id, created_at } = data as {
          client_msg_id: number | string;
          server_msg_id: number;
          created_at: string;
        };
        confirmedIds.current.add(server_msg_id);
        setMessages((prev) => {
          const mapped = prev.map((message) =>
            message.id === client_msg_id
              ? { ...message, id: server_msg_id, server_msg_id, pending: false, created_at }
              : message
          );

          let seenServerMessage = false;
          return mapped.filter((message) => {
            const resolvedServerId =
              typeof message.id === 'number' ? message.id : message.server_msg_id;
            if (resolvedServerId !== server_msg_id) {
              return true;
            }
            if (seenServerMessage) {
              return false;
            }
            seenServerMessage = true;
            return true;
          });
        });
        break;
      }

      case 'typing_event': {
        if (data.sender_type !== 'ADMIN') {
          setIsTyping(data.is_typing as boolean);
          if (data.is_typing) {
            setTimeout(() => setIsTyping(false), 3000);
          }
        }
        break;
      }

      case 'presence_update': {
        if (data.sender_type !== 'ADMIN') {
          const participantCounts = data.participant_counts as Record<string, number> | undefined;
          setGuestOnline(
            Boolean(
              (participantCounts?.CUSTOMER ?? 0) +
              (participantCounts?.PARTNER ?? 0) ||
              data.is_online
            )
          );
        }
        break;
      }

      case 'error': {
        if (data.code === 'RATE_LIMIT_EXCEEDED') {
          setError('Rate limit reached. Wait a moment before replying again.');
        } else if (data.code === 'MESSAGE_TOO_LONG') {
          setError(`Reply too long. Max ${data.max} characters.`);
        } else {
          setError((data.message as string) ?? 'An unexpected chat error occurred.');
        }
        setTimeout(() => setError(null), 4000);
        break;
      }

      case 'pong':
      default:
        break;
    }
  }, []);

  useEffect(() => {
    if (!selectedRef || ws.current) return;

    const token = getAuthToken();
    if (!token) {
      setError('Admin token missing. Please sign in again.');
      return;
    }

    const socket = new WebSocket(getWsUrl(selectedRef, token));
    ws.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setError(null);

      pingTimer.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, PING_INTERVAL_MS);

      supportService.markChatMessagesRead(selectedRef).catch(() => null);
      supportService.getChatPresence(selectedRef)
        .then((presence) => {
          const participantCounts = presence.participant_counts ?? {};
          setGuestOnline(
            Boolean(
              (participantCounts.CUSTOMER ?? 0) +
              (participantCounts.PARTNER ?? 0) ||
              presence.is_online
            )
          );
        })
        .catch(() => null);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleServerEvent(data);
    };

    socket.onclose = () => {
      setIsConnected(false);
      setGuestOnline(false);
      ws.current = null;
      if (pingTimer.current) clearInterval(pingTimer.current);
    };

    socket.onerror = () => {
      setError('Realtime connection dropped. Refresh the page if this persists.');
    };

    return () => {
      if (pingTimer.current) clearInterval(pingTimer.current);
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [selectedRef, handleServerEvent]);

  const sendTypingEvent = (isTypingNow: boolean) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ type: isTypingNow ? 'typing_start' : 'typing_stop' }));
    isSendingTyping.current = isTypingNow;
  };

  const handleInputChange = (value: string) => {
    setInputMessage(value);

    if (!isSendingTyping.current && value.trim()) {
      sendTypingEvent(true);
    }

    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      if (isSendingTyping.current) sendTypingEvent(false);
    }, TYPING_DEBOUNCE_MS);
  };

  const sendMessage = () => {
    const text = inputMessage.trim();
    if (!text || !ws.current || !isConnected || !selectedRef) return;

    if (isSendingTyping.current) {
      sendTypingEvent(false);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    }

    const clientMsgId = randomId();
    setMessages((prev) => [
      ...prev,
      {
        id: clientMsgId,
        ticket: selectedTicket?.id ?? 0,
        sender: null,
        sender_name: 'Support Team',
        sender_type: 'ADMIN',
        message: text,
        context_data: {},
        is_read: false,
        created_at: new Date().toISOString(),
        pending: true,
      },
    ]);

    setInputMessage('');
    ws.current.send(JSON.stringify({
      type: 'message',
      message: text,
      client_msg_id: clientMsgId,
      context_data: {
        portal: 'admin',
        ticket_reference: selectedRef,
      },
    }));
  };

  const visibleTickets = tickets.filter((ticket) => {
    if (!searchTerm.trim()) return true;
    const haystack = [
      ticket.reference,
      ticket.customer_name,
      ticket.customer_email,
      ticket.subject,
      ticket.booking_reference_text,
      ticket.hotel_booking?.hotel_name,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(searchTerm.trim().toLowerCase());
  });

  const openCount = tickets.filter((ticket) => !['RESOLVED', 'CLOSED'].includes(ticket.status)).length;
  const codeRedCount = tickets.filter((ticket) => ticket.is_code_red).length;
  const waitingOnCustomerCount = tickets.filter((ticket) => ticket.status === 'WAITING_ON_CUSTOMER').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Live Support Operations</h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            Watch the active support queue, jump into realtime chat, and keep customers and hotel partners moving without leaving the admin portal.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 self-start"
          onClick={() => loadTickets(true)}
          isLoading={refreshing}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh queue
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Tickets</CardDescription>
            <CardTitle className="text-3xl">{tickets.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Queue</CardDescription>
            <CardTitle className="text-3xl text-amber-700">{openCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Code Red</CardDescription>
            <CardTitle className="text-3xl text-red-700">{codeRedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Waiting on Customer</CardDescription>
            <CardTitle className="text-3xl text-blue-700">{waitingOnCustomerCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px,1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="space-y-4 border-b border-gray-100 bg-gradient-to-br from-slate-50 to-white">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Headset className="h-6 w-6 text-orange-600" />
                Support Queue
              </CardTitle>
              <CardDescription className="mt-2">
                Search and triage the current live support workload.
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by reference, subject, guest, or booking"
                className="pl-11"
              />
            </div>
          </CardHeader>
          <CardContent className="max-h-[760px] overflow-y-auto p-0">
            {loading ? (
              <LoadingSpinner size="lg" text="Loading support queue..." className="py-12" />
            ) : visibleTickets.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No tickets match the current search.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {visibleTickets.map((ticket) => {
                  const isSelected = selectedRef === ticket.reference;
                  return (
                    <button
                      key={ticket.reference}
                      type="button"
                      onClick={() => setSelectedRef(ticket.reference)}
                      className={`w-full px-5 py-4 text-left transition ${
                        isSelected ? 'bg-orange-50/80' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-gray-900">{ticket.reference}</p>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(ticket.status)}`}>
                              {ticket.status.replace(/_/g, ' ')}
                            </span>
                            {ticket.is_code_red && (
                              <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                                Code red
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm font-medium text-gray-900">{ticket.subject}</p>
                          <p className="mt-1 text-sm text-gray-600">{ticket.customer_name || 'Anonymous guest'}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            Updated {formatDateTime(ticket.updated_at)}
                          </p>
                        </div>
                        <div className="mt-1 flex flex-col items-end gap-1 text-xs text-gray-500">
                          <span className="font-semibold text-gray-700">{ticket.issue_category_display}</span>
                          {ticket.hotel_booking?.hotel_name && (
                            <span className="max-w-[120px] text-right">{ticket.hotel_booking.hotel_name}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-orange-600 to-orange-500 text-white">
            {selectedTicket ? (
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <CardTitle className="text-2xl text-white">{selectedTicket.reference}</CardTitle>
                    <span className={`rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide ${selectedTicket.is_code_red ? 'text-red-100' : 'text-white'}`}>
                      {selectedTicket.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <CardDescription className="max-w-2xl text-orange-50">
                    {selectedTicket.subject}
                  </CardDescription>
                  <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-wide text-orange-100/90">
                    <span className="flex items-center gap-1">
                      {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                      {isConnected ? 'Realtime connected' : 'Realtime offline'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Circle className={`h-3 w-3 fill-current ${guestOnline ? 'text-emerald-200' : 'text-white/50'}`} />
                      {guestOnline ? 'Guest online' : 'Guest offline'}
                    </span>
                    {selectedTicket.expected_response_by && (
                      <span className="flex items-center gap-1">
                        <TimerReset className="h-3.5 w-3.5" />
                        SLA {formatDateTime(selectedTicket.expected_response_by)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-orange-50">
                  <p className="font-semibold text-white">{selectedTicket.customer_name || 'Anonymous guest'}</p>
                  <p>{selectedTicket.customer_email || 'No email on file'}</p>
                  <p>{selectedTicket.customer_phone || 'No phone on file'}</p>
                </div>
              </div>
            ) : (
              <div>
                <CardTitle className="text-2xl text-white">Support Conversation</CardTitle>
                <CardDescription className="mt-2 text-orange-50">
                  Pick a ticket from the queue to open its live chat room.
                </CardDescription>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex min-h-[760px] flex-col bg-slate-50 p-0">
            {error && (
              <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {!selectedTicket ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <div className="rounded-full bg-orange-100 p-4 text-orange-600">
                  <MessageSquareText className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-900">No ticket selected</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Choose a conversation from the left to join the realtime room and reply as support staff.
                  </p>
                </div>
              </div>
            ) : conversationLoading ? (
              <LoadingSpinner size="lg" text="Loading conversation..." className="flex-1 py-16" />
            ) : (
              <>
                <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
                  <div className="rounded-2xl border border-orange-100 bg-white p-4 text-sm text-gray-600 shadow-sm">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-orange-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Realtime OTA support room</p>
                        <p className="mt-1">
                          Booking-aware context is attached to every live reply, with presence and typing indicators powered by the backend support channel.
                        </p>
                      </div>
                    </div>
                  </div>

                  {messages.map((message) => {
                    const isMe = message.sender_type === 'ADMIN';
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${
                          isMe
                            ? `rounded-tr-none bg-orange-600 text-white ${message.pending ? 'opacity-70' : ''}`
                            : 'rounded-tl-none border border-slate-200 bg-white text-slate-800 shadow-sm'
                        }`}>
                          {!isMe && (
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider opacity-60">
                              {message.sender_name}
                            </p>
                          )}
                          <p className="leading-relaxed">{message.message}</p>
                          <p className={`mt-2 flex items-center gap-1 text-[10px] ${
                            isMe ? 'justify-end text-white/70' : 'text-slate-400'
                          }`}>
                            {formatDateTime(message.created_at)}
                            {isMe && message.pending && <Circle className="h-2.5 w-2.5 fill-current opacity-50" />}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-tl-none border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Guest is typing...
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 bg-white p-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex gap-3">
                      <div className="mt-1 rounded-full bg-orange-100 p-2 text-orange-600">
                        <Headset className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={inputMessage}
                          onChange={(event) => handleInputChange(event.target.value)}
                          onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && sendMessage()}
                          placeholder="Reply to the customer or partner..."
                          maxLength={2000}
                          disabled={!isConnected}
                          className="border-none bg-transparent px-0 py-0 shadow-none focus:ring-0"
                        />
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            Message is delivered in realtime to all connected participants.
                          </p>
                          <Button
                            onClick={sendMessage}
                            disabled={!inputMessage.trim() || !isConnected}
                            className="gap-2"
                          >
                            <Send className="h-4 w-4" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {selectedTicket.is_code_red && (
                    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
                      <div>
                        <p className="font-semibold">Priority handling recommended</p>
                        <p className="mt-1">
                          This ticket is flagged as code red. Keep replies crisp, confirm next action, and hand off fast if the issue touches payment or check-in risk.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
