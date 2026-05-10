'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock3,
  Loader2,
  MessageSquareText,
  RefreshCcw,
  RotateCcw,
  Send,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { cn, formatDateTime } from '@/lib/utils';
import type { AdminSupportTicket } from '@/services/support';
import type { useAdminSupportConversation } from '../hooks/useAdminSupportConversation';
import {
  getSenderLabel,
  getStatusLabel,
  getStatusTone,
  isTerminalStatus,
} from './supportFormat';

type ConversationState = ReturnType<typeof useAdminSupportConversation>;

interface SupportConversationProps {
  ticket: AdminSupportTicket | null;
  conversation: ConversationState;
}

const TYPING_DEBOUNCE_MS = 1_500;

const connectionLabels: Record<ConversationState['connectionState'], string> = {
  idle: 'Idle',
  connecting: 'Connecting',
  connected: 'Connected',
  reconnecting: 'Reconnecting',
  offline: 'Offline',
};

export function SupportConversation({ ticket, conversation }: SupportConversationProps) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottom = useRef(true);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSendingTyping = useRef(false);
  const previousTicketRef = useRef<string | null>(null);

  const participantCounts = conversation.presence?.participant_counts ?? {};
  const customerOnline =
    Boolean((participantCounts.CUSTOMER ?? 0) + (participantCounts.PARTNER ?? 0)) ||
    Boolean(conversation.presence?.is_online);
  const activeOperators = participantCounts.ADMIN ?? 0;
  const isTerminal = ticket ? isTerminalStatus(ticket.status) : false;
  const canSend = Boolean(ticket && conversation.isConnected && !isTerminal && draft.trim());
  const sendTyping = conversation.sendTyping;

  const typingLabel = useMemo(() => {
    if (!conversation.typingSender) return null;
    return `${getSenderLabel(conversation.typingSender)} is typing`;
  }, [conversation.typingSender]);

  useEffect(() => {
    if (previousTicketRef.current !== ticket?.reference) {
      previousTicketRef.current = ticket?.reference ?? null;
      setDraft('');
      shouldStickToBottom.current = true;
    }
  }, [ticket?.reference]);

  useEffect(() => {
    if (!scrollRef.current || !shouldStickToBottom.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [conversation.messages.length, ticket?.reference, typingLabel]);

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (isSendingTyping.current) sendTyping(false);
    };
  }, [sendTyping]);

  const stopTypingSoon = () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      if (isSendingTyping.current) {
        conversation.sendTyping(false);
        isSendingTyping.current = false;
      }
    }, TYPING_DEBOUNCE_MS);
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);

    if (!ticket || isTerminal || !conversation.isConnected) return;

    if (!value.trim()) {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (isSendingTyping.current) {
        conversation.sendTyping(false);
        isSendingTyping.current = false;
      }
      return;
    }

    if (!isSendingTyping.current) {
      conversation.sendTyping(true);
      isSendingTyping.current = true;
    }
    stopTypingSoon();
  };

  const sendCurrentDraft = () => {
    if (!canSend) return;
    const wasSent = conversation.sendMessage(draft);
    if (!wasSent) return;

    setDraft('');
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (isSendingTyping.current) {
      conversation.sendTyping(false);
      isSendingTyping.current = false;
    }
    shouldStickToBottom.current = true;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    sendCurrentDraft();
  };

  const handleScroll = () => {
    const node = scrollRef.current;
    if (!node) return;
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    shouldStickToBottom.current = distanceFromBottom < 80;
  };

  if (!ticket) {
    return (
      <Card className="overflow-hidden rounded-lg hover:shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-xl">Conversation</CardTitle>
          <CardDescription>Select a ticket from the queue.</CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-[560px] flex-col items-center justify-center gap-4 bg-slate-50 p-8 text-center">
          <div className="rounded-full bg-orange-100 p-4 text-orange-600">
            <MessageSquareText className="h-8 w-8" />
          </div>
          <p className="text-sm text-slate-600">No ticket selected.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-lg hover:shadow-sm">
      <CardHeader className="border-b border-gray-100 bg-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl">{ticket.reference}</CardTitle>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(ticket.status)}`}
              >
                {getStatusLabel(ticket.status)}
              </span>
              {ticket.is_code_red && (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Code red
                </span>
              )}
            </div>
            <CardDescription className="mt-2 truncate">{ticket.subject}</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium',
                conversation.isConnected
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              )}
            >
              {conversation.isConnected ? (
                <Wifi className="h-3.5 w-3.5" />
              ) : (
                <WifiOff className="h-3.5 w-3.5" />
              )}
              {connectionLabels[conversation.connectionState]}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium',
                customerOnline
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              )}
            >
              <Circle className={cn('h-2.5 w-2.5', customerOnline && 'fill-current')} />
              Guest {customerOnline ? 'online' : 'offline'}
            </span>
            {activeOperators > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 font-medium text-orange-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                {activeOperators} admin{activeOperators === 1 ? '' : 's'}
              </span>
            )}
            {ticket.expected_response_by && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-700">
                <Clock3 className="h-3.5 w-3.5" />
                {formatDateTime(ticket.expected_response_by)}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-[calc(100vh-295px)] flex-col bg-slate-50 p-0">
        {conversation.error && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
            {conversation.error}
          </div>
        )}

        {conversation.historyLoading ? (
          <LoadingSpinner size="lg" text="Loading conversation..." className="flex-1 py-16" />
        ) : (
          <>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 space-y-4 overflow-y-auto p-5"
            >
              {conversation.hasOlderMessages && (
                <div className="flex justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    isLoading={conversation.olderLoading}
                    onClick={() => {
                      shouldStickToBottom.current = false;
                      void conversation.loadOlderMessages();
                    }}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Older messages
                  </Button>
                </div>
              )}

              {conversation.messages.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  No messages yet.
                </div>
              ) : (
                conversation.messages.map((message) => {
                  const isMe = message.sender_type === 'ADMIN';
                  const isSystem = message.sender_type === 'SYSTEM';

                  if (isSystem) {
                    return (
                      <div key={message.id} className="flex justify-center">
                        <div className="max-w-[80%] rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-xs text-slate-500">
                          {message.message}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={message.id}
                      className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[82%] rounded-lg px-4 py-3 text-sm shadow-sm',
                          isMe
                            ? 'rounded-tr-sm bg-orange-600 text-white'
                            : 'rounded-tl-sm border border-slate-200 bg-white text-slate-800',
                          message.pending && 'opacity-70',
                          message.failed && 'border border-red-200 bg-red-50 text-red-800'
                        )}
                      >
                        <div
                          className={cn(
                            'mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide',
                            isMe ? 'justify-end text-white/70' : 'text-slate-500'
                          )}
                        >
                          <span>{isMe ? 'Support' : message.sender_name}</span>
                          {!isMe && (
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">
                              {getSenderLabel(message.sender_type)}
                            </span>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{message.message}</p>
                        <div
                          className={cn(
                            'mt-2 flex items-center gap-2 text-[10px]',
                            isMe ? 'justify-end text-white/70' : 'text-slate-400',
                            message.failed && 'text-red-700'
                          )}
                        >
                          <span>{formatDateTime(message.created_at)}</span>
                          {message.pending && (
                            <span className="inline-flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Sending
                            </span>
                          )}
                          {message.failed && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 font-semibold text-red-700"
                              onClick={() =>
                                conversation.sendMessage(
                                  message.message,
                                  String(message.client_msg_id ?? message.id)
                                )
                              }
                            >
                              <RotateCcw className="h-3 w-3" />
                              Retry
                            </button>
                          )}
                          {isMe && !message.pending && !message.failed && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {typingLabel && (
                <div className="flex justify-start">
                  <div className="rounded-lg rounded-tl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {typingLabel}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 bg-white p-5">
              {isTerminal && (
                <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  This ticket is {getStatusLabel(ticket.status).toLowerCase()}.
                </div>
              )}
              <div className="flex gap-3">
                <Textarea
                  value={draft}
                  onChange={(event) => handleDraftChange(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    conversation.isConnected
                      ? 'Reply to this conversation'
                      : 'Realtime connection unavailable'
                  }
                  rows={3}
                  maxLength={2000}
                  disabled={!conversation.isConnected || isTerminal}
                  className="min-h-24 resize-none"
                />
                <Button
                  onClick={sendCurrentDraft}
                  disabled={!canSend}
                  className="h-24 w-24 flex-col gap-1"
                >
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>{draft.length}/2000</span>
                {conversation.connectionState === 'reconnecting' && (
                  <span>Reconnecting to live room.</span>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
