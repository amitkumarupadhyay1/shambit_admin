import { AlertTriangle, Clock3, Inbox, MessageCircle } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import type { AdminSupportTicket } from '@/services/support';
import { isTerminalStatus } from './supportFormat';

interface SupportMetricsProps {
  tickets: AdminSupportTicket[];
}

export function SupportMetrics({ tickets }: SupportMetricsProps) {
  const activeCount = tickets.filter((ticket) => !isTerminalStatus(ticket.status)).length;
  const codeRedCount = tickets.filter((ticket) => ticket.is_code_red).length;
  const unreadCount = tickets.reduce(
    (sum, ticket) => sum + (ticket.unread_message_count ?? 0),
    0
  );
  const cards = [
    { label: 'Total Tickets', value: tickets.length, icon: Inbox, tone: 'text-slate-700' },
    { label: 'Active Queue', value: activeCount, icon: MessageCircle, tone: 'text-amber-700' },
    { label: 'Unread Messages', value: unreadCount, icon: Clock3, tone: 'text-blue-700' },
    { label: 'Code Red', value: codeRedCount, icon: AlertTriangle, tone: 'text-red-700' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="rounded-lg hover:shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className={`mt-2 text-3xl ${card.tone}`}>{card.value}</CardTitle>
            </div>
            <card.icon className={`h-5 w-5 ${card.tone}`} />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
