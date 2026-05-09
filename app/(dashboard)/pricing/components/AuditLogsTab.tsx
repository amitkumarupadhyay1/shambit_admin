import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { type PricingAdminAuditLog, type PricingCalculationLog } from '@/services/pricingService';

interface Props {
  auditLogs: PricingAdminAuditLog[];
  calculationLogs: PricingCalculationLog[];
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
      {label}
    </div>
  );
}

function money(value: string | number | undefined | null) {
  if (!value) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function AuditLogsTab({ auditLogs, calculationLogs }: Props) {
  const [adminSearch, setAdminSearch] = useState('');
  const [adminFilterAction, setAdminFilterAction] = useState('ALL');
  const [adminFilterModel, setAdminFilterModel] = useState('ALL');

  const [calcSearch, setCalcSearch] = useState('');

  const filteredAuditLogs = useMemo(() => {
    let result = auditLogs;
    
    if (adminFilterAction !== 'ALL') {
      result = result.filter(log => log.action === adminFilterAction);
    }
    
    if (adminFilterModel !== 'ALL') {
      result = result.filter(log => log.model_name === adminFilterModel);
    }

    if (adminSearch) {
      const term = adminSearch.toLowerCase();
      result = result.filter(log => 
        (log.actor_email || '').toLowerCase().includes(term) ||
        (log.hotel_name || '').toLowerCase().includes(term) ||
        (log.quote_reference || '').toLowerCase().includes(term) ||
        (log.change_reason || '').toLowerCase().includes(term)
      );
    }

    return result.slice(0, 100);
  }, [auditLogs, adminSearch, adminFilterAction, adminFilterModel]);

  const filteredCalcLogs = useMemo(() => {
    let result = calculationLogs;

    if (calcSearch) {
      const term = calcSearch.toLowerCase();
      result = result.filter(log => 
        (log.quote_reference || '').toLowerCase().includes(term) ||
        (log.hotel_name || '').toLowerCase().includes(term) ||
        (log.context || '').toLowerCase().includes(term)
      );
    }

    return result.slice(0, 100);
  }, [calculationLogs, calcSearch]);

  const uniqueActions = Array.from(new Set(auditLogs.map(l => l.action)));
  const uniqueModels = Array.from(new Set(auditLogs.map(l => l.model_name)));

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Admin Audit Logs</CardTitle>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Input 
              placeholder="Search actor, reason, ref..." 
              value={adminSearch} 
              onChange={e => setAdminSearch(e.target.value)} 
            />
            <select 
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={adminFilterAction}
              onChange={e => setAdminFilterAction(e.target.value)}
            >
              <option value="ALL">All Actions</option>
              {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select 
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={adminFilterModel}
              onChange={e => setAdminFilterModel(e.target.value)}
            >
              <option value="ALL">All Models</option>
              {uniqueModels.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[800px] overflow-y-auto">
          {filteredAuditLogs.length === 0 ? <EmptyState label="No matching admin audit events." /> : filteredAuditLogs.map((log) => (
            <div key={log.id} className="rounded-lg border border-gray-200 p-4 text-sm bg-white hover:border-gray-300 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-gray-900">
                  <span className={`inline-block mr-2 px-2 py-0.5 rounded text-xs font-bold ${
                    log.action === 'DEACTIVATE' || log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                    log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {log.action}
                  </span>
                  {log.model_name} #{log.object_id}
                </p>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              <p className="text-gray-600 mb-1">
                By: <span className="font-medium text-gray-900">{log.actor_email || 'System'}</span>
                {log.hotel_name && ` · Hotel: ${log.hotel_name}`}
              </p>
              {log.quote_reference && (
                <p className="text-xs text-blue-600 font-mono mb-2">Ref: {log.quote_reference}</p>
              )}
              {log.change_reason && (
                <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-100 text-gray-700 italic">
                  &quot;{log.change_reason}&quot;
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Calculation Logs</CardTitle>
          <div className="mt-4">
            <Input 
              placeholder="Search quote reference, hotel, or context..." 
              value={calcSearch} 
              onChange={e => setCalcSearch(e.target.value)} 
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[800px] overflow-y-auto">
          {filteredCalcLogs.length === 0 ? <EmptyState label="No matching pricing calculation logs." /> : filteredCalcLogs.map((log) => (
            <div key={log.id} className="rounded-lg border border-gray-200 p-4 text-sm bg-white hover:border-gray-300 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-gray-900 font-mono">{log.quote_reference}</p>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-xs font-medium">
                  {log.context}
                </span>
                {log.hotel_name && (
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 text-xs font-medium">
                    {log.hotel_name}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Payable</p>
                  <p className="font-semibold text-gray-900">{money(log.final_payable_amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tax Basis</p>
                  <p className="font-medium text-gray-700">{money(log.tax_basis_amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Platform Fee</p>
                  <p className="font-medium text-gray-700">{money(log.platform_fee_amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Partner Payout</p>
                  <p className="font-medium text-gray-700">{money(log.partner_payout_amount)}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
