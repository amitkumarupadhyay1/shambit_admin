'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAuthToken, getWsUrl } from '@/lib/api';
import {
  supportService,
  type AdminSupportChatMessage,
  type AdminSupportPresence,
  type SupportSenderType,
} from '@/services/support';

export interface AdminChatMessage extends Omit<AdminSupportChatMessage, 'id'> {
  id: number | string;
  client_msg_id?: string;
  pending?: boolean;
  failed?: boolean;
  server_msg_id?: number;
}

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'offline';

const PING_INTERVAL_MS = 25_000;
const RECONNECT_DELAYS_MS = [1_000, 2_500, 5_000, 10_000];
const ACK_TIMEOUT_MS = 15_000;

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12);
}

function uniqueByMessageId(messages: AdminChatMessage[]): AdminChatMessage[] {
  const seen = new Set<number | string>();
  const deduped: AdminChatMessage[] = [];
  for (const message of messages) {
    const key = typeof message.id === 'number' ? message.id : message.server_msg_id ?? message.id;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(message);
  }
  return deduped;
}

export function useAdminSupportConversation(
  ticketRef: string | null,
  ticketId: number | null,
  onActivity?: () => void
) {
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [olderHistoryUrl, setOlderHistoryUrl] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [presence, setPresence] = useState<AdminSupportPresence | null>(null);
  const [typingSender, setTypingSender] = useState<SupportSenderType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ackTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const confirmedIds = useRef<Set<number>>(new Set());
  const reconnectAttempt = useRef(0);
  const shouldReconnect = useRef(false);
  const connectRef = useRef<() => void>(() => undefined);
  const onActivityRef = useRef(onActivity);

  useEffect(() => {
    onActivityRef.current = onActivity;
  }, [onActivity]);

  const clearAckTimer = useCallback((clientMsgId: string | number) => {
    const key = String(clientMsgId);
    const timer = ackTimers.current.get(key);
    if (timer) {
      clearTimeout(timer);
      ackTimers.current.delete(key);
    }
  }, []);

  const markPendingAsFailed = useCallback(() => {
    ackTimers.current.forEach((timer) => clearTimeout(timer));
    ackTimers.current.clear();
    setMessages((prev) =>
      prev.map((message) =>
        message.pending ? { ...message, pending: false, failed: true } : message
      )
    );
  }, []);

  const fetchPresence = useCallback(async () => {
    if (!ticketRef) return;
    try {
      setPresence(await supportService.getChatPresence(ticketRef));
    } catch {
      // Presence is advisory; don't interrupt the operator if it fails.
    }
  }, [ticketRef]);

  const markRead = useCallback(async () => {
    if (!ticketRef) return;
    try {
      await supportService.markChatMessagesRead(ticketRef);
      onActivityRef.current?.();
    } catch {
      // Read receipts should be best-effort.
    }
  }, [ticketRef]);

  useEffect(() => {
    if (!ticketRef) {
      setMessages([]);
      setOlderHistoryUrl(null);
      setPresence(null);
      setConnectionState('idle');
      return;
    }

    let cancelled = false;
    setHistoryLoading(true);
    setError(null);
    confirmedIds.current.clear();

    supportService
      .getChatHistory(ticketRef, { pageSize: 50 })
      .then((page) => {
        if (cancelled) return;
        setMessages(page.messages.map((message) => ({ ...message, pending: false })));
        setOlderHistoryUrl(page.next);
        void fetchPresence();
        void markRead();
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load this conversation.');
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchPresence, markRead, ticketRef]);

  const handleServerEvent = useCallback(
    (data: Record<string, unknown>) => {
      switch (data.type) {
        case 'chat_message': {
          const serverId = data.server_msg_id as number;
          if (confirmedIds.current.has(serverId)) break;
          const senderType = data.sender_type as SupportSenderType;
          setMessages((prev) =>
            uniqueByMessageId([
              ...prev,
              {
                id: serverId,
                ticket: ticketId ?? 0,
                sender: (data.sender_id as number | null) ?? null,
                sender_name: (data.sender_name as string) ?? 'Unknown',
                sender_type: senderType,
                message: (data.message as string) ?? '',
                context_data: (data.context_data as Record<string, unknown>) ?? {},
                is_read: senderType === 'ADMIN',
                created_at: (data.created_at as string) ?? new Date().toISOString(),
              },
            ])
          );
          if (senderType !== 'ADMIN') {
            void markRead();
          }
          onActivityRef.current?.();
          break;
        }

        case 'message_ack': {
          const clientMsgId = data.client_msg_id as string | number;
          const serverId = data.server_msg_id as number;
          confirmedIds.current.add(serverId);
          clearAckTimer(clientMsgId);
          setMessages((prev) =>
            uniqueByMessageId(
              prev.map((message) =>
                message.id === clientMsgId || message.client_msg_id === String(clientMsgId)
                  ? {
                      ...message,
                      id: serverId,
                      server_msg_id: serverId,
                      pending: false,
                      failed: false,
                      created_at: data.created_at as string,
                    }
                  : message
              )
            )
          );
          onActivityRef.current?.();
          break;
        }

        case 'typing_event': {
          const senderType = data.sender_type as SupportSenderType;
          if (senderType !== 'ADMIN') {
            setTypingSender(data.is_typing ? senderType : null);
            if (data.is_typing) {
              setTimeout(() => setTypingSender(null), 3_000);
            }
          }
          break;
        }

        case 'presence_update':
          setPresence({
            is_online: Boolean(data.is_online),
            last_seen: (data.last_seen as string | null) ?? null,
            active_count: data.active_count as number | undefined,
            sender_type: data.sender_type as string | undefined,
            participant_counts: data.participant_counts as AdminSupportPresence['participant_counts'],
          });
          break;

        case 'error':
          if (data.code === 'RATE_LIMIT_EXCEEDED') {
            setError('Rate limit reached. Wait a moment before replying again.');
          } else if (data.code === 'MESSAGE_TOO_LONG') {
            setError(`Reply too long. Max ${data.max} characters.`);
          } else {
            setError((data.message as string) ?? 'An unexpected chat error occurred.');
          }
          setTimeout(() => setError(null), 4_000);
          break;

        default:
          break;
      }
    },
    [clearAckTimer, markRead, ticketId]
  );

  const connect = useCallback(() => {
    if (!ticketRef || ws.current) return;

    const token = getAuthToken();
    if (!token) {
      setError('Admin token missing. Please sign in again.');
      setConnectionState('offline');
      return;
    }

    shouldReconnect.current = true;
    setConnectionState(reconnectAttempt.current > 0 ? 'reconnecting' : 'connecting');

    const socket = new WebSocket(getWsUrl(ticketRef, token));
    ws.current = socket;

    socket.onopen = () => {
      if (ws.current !== socket) return;
      reconnectAttempt.current = 0;
      setConnectionState('connected');
      setError(null);
      pingTimer.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, PING_INTERVAL_MS);
      void markRead();
      void fetchPresence();
    };

    socket.onmessage = (event) => {
      if (ws.current !== socket) return;
      try {
        handleServerEvent(JSON.parse(event.data));
      } catch {
        setError('Received an unreadable realtime event.');
      }
    };

    socket.onerror = () => {
      if (ws.current !== socket) return;
      setError('Realtime connection problem. Reconnecting if possible.');
    };

    socket.onclose = (event) => {
      if (ws.current !== socket) return;
      if (pingTimer.current) clearInterval(pingTimer.current);
      pingTimer.current = null;
      ws.current = null;
      setConnectionState('offline');

      if (event.code === 4003) {
        setError('Access denied to this support room.');
        shouldReconnect.current = false;
      } else if (event.code === 4004) {
        setError('Support room not found.');
        shouldReconnect.current = false;
      }

      if (shouldReconnect.current) {
        const delay = RECONNECT_DELAYS_MS[
          Math.min(reconnectAttempt.current, RECONNECT_DELAYS_MS.length - 1)
        ];
        reconnectAttempt.current += 1;
        reconnectTimer.current = setTimeout(() => connectRef.current(), delay);
      } else {
        markPendingAsFailed();
      }
    };
  }, [fetchPresence, handleServerEvent, markPendingAsFailed, markRead, ticketRef]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    shouldReconnect.current = Boolean(ticketRef);
    reconnectAttempt.current = 0;
    const pendingAckTimers = ackTimers.current;
    connect();

    return () => {
      shouldReconnect.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (pingTimer.current) clearInterval(pingTimer.current);
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      pendingAckTimers.forEach((timer) => clearTimeout(timer));
      pendingAckTimers.clear();
    };
  }, [connect, ticketRef]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ type: isTyping ? 'typing_start' : 'typing_stop' }));
  }, []);

  const sendMessage = useCallback(
    (text: string, existingClientId?: string) => {
      const trimmed = text.trim();
      if (!trimmed || !ticketRef) return false;
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        setError('Realtime is offline. Reconnect before sending.');
        return false;
      }

      const clientMsgId = existingClientId ?? randomId();
      const contextData = {
        portal: 'admin',
        ticket_reference: ticketRef,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      };

      setMessages((prev) => {
        if (existingClientId) {
          return prev.map((message) =>
            message.client_msg_id === existingClientId || message.id === existingClientId
              ? { ...message, pending: true, failed: false }
              : message
          );
        }
        return [
          ...prev,
          {
            id: clientMsgId,
            client_msg_id: clientMsgId,
            ticket: ticketId ?? 0,
            sender: null,
            sender_name: 'Support Team',
            sender_type: 'ADMIN',
            message: trimmed,
            context_data: contextData,
            is_read: false,
            created_at: new Date().toISOString(),
            pending: true,
          },
        ];
      });

      ws.current.send(
        JSON.stringify({
          type: 'message',
          message: trimmed,
          client_msg_id: clientMsgId,
          context_data: contextData,
        })
      );

      const ackTimer = setTimeout(() => {
        setMessages((prev) =>
          prev.map((message) =>
            message.client_msg_id === clientMsgId || message.id === clientMsgId
              ? { ...message, pending: false, failed: true }
              : message
          )
        );
        ackTimers.current.delete(clientMsgId);
      }, ACK_TIMEOUT_MS);
      ackTimers.current.set(clientMsgId, ackTimer);
      return true;
    },
    [ticketId, ticketRef]
  );

  const loadOlderMessages = useCallback(async () => {
    if (!ticketRef || !olderHistoryUrl || olderLoading) return;
    setOlderLoading(true);
    try {
      const page = await supportService.getChatHistory(ticketRef, { url: olderHistoryUrl });
      setMessages((prev) =>
        uniqueByMessageId([
          ...page.messages.map((message) => ({ ...message, pending: false })),
          ...prev,
        ])
      );
      setOlderHistoryUrl(page.next);
    } catch {
      setError('Unable to load older messages.');
    } finally {
      setOlderLoading(false);
    }
  }, [olderHistoryUrl, olderLoading, ticketRef]);

  return {
    messages,
    historyLoading,
    olderLoading,
    hasOlderMessages: Boolean(olderHistoryUrl),
    connectionState,
    isConnected: connectionState === 'connected',
    presence,
    typingSender,
    error,
    setError,
    sendTyping,
    sendMessage,
    loadOlderMessages,
  };
}
