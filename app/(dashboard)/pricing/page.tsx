'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  FileSearch,
  IndianRupee,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { pricingService } from '@/services/pricingService';

import { RevenueProfilesTab } from './components/RevenueProfilesTab';
import { TaxAndFeesTab } from './components/TaxAndFeesTab';
import { GstSlabsTab } from './components/GstSlabsTab';
import { RuleSetsTab } from './components/RuleSetsTab';
import { RatePlansTab } from './components/RatePlansTab';
import { DemandEventsTab } from './components/DemandEventsTab';
import { SimulatorTab } from './components/SimulatorTab';
import { AuditLogsTab } from './components/AuditLogsTab';

type TabId =
  | 'overview'
  | 'profiles'
  | 'components'
  | 'slabs'
  | 'rules'
  | 'rate-plans'
  | 'events'
  | 'simulator'
  | 'audit';

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'profiles', label: 'Revenue Profiles' },
  { id: 'components', label: 'Tax & Fees' },
  { id: 'slabs', label: 'GST Slabs' },
  { id: 'rules', label: 'Rule Sets' },
  { id: 'rate-plans', label: 'Rate Plans' },
  { id: 'events', label: 'Demand Events' },
  { id: 'simulator', label: 'Simulator' },
  { id: 'audit', label: 'Audit Logs' },
];

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <Icon className="mb-3 h-5 w-5 text-blue-600" />
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const dashboardQuery = useQuery({
    queryKey: ['pricing-dashboard'],
    queryFn: pricingService.getDashboard,
  });

  const data = dashboardQuery.data;

  const metrics = useMemo(() => {
    if (!data) {
      return {
        liveProfiles: 0,
        pendingProfiles: 0,
        activeComponents: 0,
        activeEvents: 0,
        guardrailLogs: 0,
        recentErrors: 0,
      };
    }
    return {
      liveProfiles: data.profiles.filter((profile) => profile.is_effective).length,
      pendingProfiles: data.profiles.filter(
        (profile) => profile.partner_opted_in && !profile.admin_approved,
      ).length,
      activeComponents: data.components.filter((component) => component.is_active).length,
      activeEvents: data.demandEvents.filter((event) => event.is_active).length,
      guardrailLogs: data.calculationLogs.filter((log) => log.context === 'ADMIN_SIMULATION').length,
      recentErrors: data.auditLogs.filter((log) => log.action === 'DEACTIVATE').length,
    };
  }, [data]);

  if (dashboardQuery.isLoading || !data) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        Pricing configuration could not be loaded.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Pricing Engine</h1>
          <p className="mt-2 text-gray-600">
            Production controls for GST, transparent pricing, partner-friendly revenue rules, and auditability.
          </p>
        </div>
        <Button variant="outline" onClick={() => void dashboardQuery.refetch()} isLoading={dashboardQuery.isFetching}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-2">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard icon={CheckCircle2} label="Live profiles" value={metrics.liveProfiles} />
            <MetricCard icon={ShieldCheck} label="Pending approval" value={metrics.pendingProfiles} />
            <MetricCard icon={IndianRupee} label="Active tax/fee rules" value={metrics.activeComponents} />
            <MetricCard icon={CalendarDays} label="Active events" value={metrics.activeEvents} />
            <MetricCard icon={FileSearch} label="Simulator logs" value={metrics.guardrailLogs} />
            <MetricCard icon={AlertTriangle} label="Recent deactivations" value={metrics.recentErrors} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Production Gate Status</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
                Quote references are generated for pricing simulations and customer quote calculations.
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-900">
                Tax-critical records require change reasons and deactivate instead of hard delete.
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                Competitor pricing signals use verified permitted-source snapshots only.
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800">
                Admin access now depends on backend staff/superuser flags.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'profiles' && (
        <RevenueProfilesTab profiles={data.profiles} />
      )}

      {activeTab === 'components' && (
        <TaxAndFeesTab 
          components={data.components} 
          componentTypes={data.meta.component_types} 
          formulaTypes={data.meta.formula_types} 
        />
      )}

      {activeTab === 'slabs' && (
        <GstSlabsTab 
          slabs={data.slabs} 
          components={data.components} 
        />
      )}

      {activeTab === 'rules' && (
        <RuleSetsTab 
          ruleSets={data.ruleSets} 
          slabs={data.slabs} 
          gstStates={data.meta.gst_states} 
        />
      )}

      {activeTab === 'rate-plans' && (
        <RatePlansTab 
          ratePlans={data.ratePlans} 
          ratePlanTypes={data.meta.rate_plan_types} 
          ratePlanAdjustments={data.meta.rate_plan_adjustments} 
        />
      )}

      {activeTab === 'events' && (
        <DemandEventsTab demandEvents={data.demandEvents} />
      )}

      {activeTab === 'simulator' && (
        <SimulatorTab gstStates={data.meta.gst_states} />
      )}

      {activeTab === 'audit' && (
        <AuditLogsTab 
          auditLogs={data.auditLogs} 
          calculationLogs={data.calculationLogs} 
        />
      )}
    </div>
  );
}
