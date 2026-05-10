import type { SupportSenderType, SupportTicketStatus } from '@/services/support';

export const statusLabels: Record<SupportTicketStatus, string> = {
  OPEN: 'Open',
  IN_REVIEW: 'Support reviewing',
  WAITING_ON_HOTEL: 'Waiting on hotel',
  WAITING_ON_CUSTOMER: 'Waiting on customer',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const statusTone: Record<SupportTicketStatus, string> = {
  OPEN: 'border-red-200 bg-red-50 text-red-700',
  IN_REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
  WAITING_ON_HOTEL: 'border-violet-200 bg-violet-50 text-violet-700',
  WAITING_ON_CUSTOMER: 'border-blue-200 bg-blue-50 text-blue-700',
  RESOLVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CLOSED: 'border-slate-200 bg-slate-100 text-slate-700',
};

export const statusActionLabels: Record<SupportTicketStatus, string> = {
  OPEN: 'Reopen',
  IN_REVIEW: 'Review',
  WAITING_ON_HOTEL: 'Ask hotel',
  WAITING_ON_CUSTOMER: 'Ask customer',
  RESOLVED: 'Resolve',
  CLOSED: 'Close',
};

export function getStatusTone(status: string): string {
  return statusTone[status as SupportTicketStatus] ?? 'border-slate-200 bg-slate-100 text-slate-700';
}

export function getStatusLabel(status: string): string {
  return statusLabels[status as SupportTicketStatus] ?? status.replace(/_/g, ' ');
}

export function getSenderLabel(senderType: SupportSenderType): string {
  const labels: Record<SupportSenderType, string> = {
    CUSTOMER: 'Customer',
    PARTNER: 'Hotel partner',
    ADMIN: 'Support',
    SYSTEM: 'System',
  };
  return labels[senderType];
}

export function isTerminalStatus(status: SupportTicketStatus): boolean {
  return status === 'RESOLVED' || status === 'CLOSED';
}
