import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { IndianRupee, ListChecks, ShieldCheck, Activity } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { pricingService, type PricingSimulationResult, type PricingMetaOption } from '@/services/pricingService';

const simulationSchema = z.object({
  room_type_id: z.coerce.number().int().min(1, 'Room Type ID is required'),
  check_in: z.string().min(1, 'Check-in date is required'),
  check_out: z.string().min(1, 'Check-out date is required'),
  num_rooms: z.coerce.number().int().min(1, 'At least 1 room is required'),
  guest_state: z.string().optional(),
});

type SimulationFormInput = z.input<typeof simulationSchema>;
type SimulationFormValues = z.output<typeof simulationSchema>;

interface Props {
  gstStates: PricingMetaOption[];
}

function money(value: string | number | undefined | null) {
  if (!value) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{children}</label>;
}

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
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
      {label}
    </div>
  );
}

export function SimulatorTab({ gstStates }: Props) {
  const queryClient = useQueryClient();
  const [simulation, setSimulation] = useState<PricingSimulationResult | null>(null);

  const simulationMutation = useMutation({
    mutationFn: pricingService.simulate,
    onSuccess: (result) => {
      setSimulation(result);
      toast.success('Simulation complete');
      void queryClient.invalidateQueries({ queryKey: ['pricing-dashboard'] });
    },
    onError: () => toast.error('Simulation failed. Check inputs and server logs.'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SimulationFormInput, unknown, SimulationFormValues>({
    resolver: zodResolver(simulationSchema),
    defaultValues: {
      room_type_id: '',
      check_in: '',
      check_out: '',
      num_rooms: 1,
      guest_state: '09',
    },
  });

  const onSubmit = (values: SimulationFormValues) => {
    simulationMutation.mutate({
      room_type_id: values.room_type_id,
      check_in: values.check_in,
      check_out: values.check_out,
      num_rooms: values.num_rooms,
      guest_state: values.guest_state,
    });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Pricing Simulator</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <FieldLabel>Room Type ID</FieldLabel>
              <Input type="number" {...register('room_type_id')} error={errors.room_type_id?.message} placeholder="e.g. 101" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Check In</FieldLabel>
                <Input type="date" {...register('check_in')} error={errors.check_in?.message} />
              </div>
              <div>
                <FieldLabel>Check Out</FieldLabel>
                <Input type="date" {...register('check_out')} error={errors.check_out?.message} />
              </div>
            </div>
            <div>
              <FieldLabel>Number of Rooms</FieldLabel>
              <Input type="number" {...register('num_rooms')} error={errors.num_rooms?.message} placeholder="1" />
            </div>
            <div>
              <FieldLabel>Guest State (GST)</FieldLabel>
              <select className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" {...register('guest_state')}>
                {gstStates.map((state) => (
                  <option key={state.code} value={state.code}>{state.code} - {state.label}</option>
                ))}
              </select>
            </div>
            <Button type="submit" isLoading={simulationMutation.isPending} className="w-full">
              Run Simulation
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Simulation Result</CardTitle>
        </CardHeader>
        <CardContent>
          {!simulation ? (
            <EmptyState label="Run a simulation to see customer payable, GST, platform fees, and quote reference." />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard icon={IndianRupee} label="Payable" value={money(simulation.total_amount)} />
                <MetricCard icon={ListChecks} label="Tax Basis" value={money(simulation.room_taxable_value)} />
                <MetricCard icon={ShieldCheck} label="GST" value={money(simulation.hotel_gst_amount)} />
                <MetricCard icon={Activity} label="Platform Fee" value={money(simulation.platform_fee_amount)} />
              </div>
              
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex flex-col gap-1">
                <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Calculation Reference</span>
                <span className="font-mono text-sm text-blue-900">{simulation.quote_reference || 'Not generated'}</span>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Component Breakdown</h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr className="text-left text-xs uppercase text-gray-500">
                        <th className="px-4 py-3 font-semibold">Code</th>
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold">Type</th>
                        <th className="px-4 py-3 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {simulation.component_breakdown.map((component, idx) => (
                        <tr key={`${component.code}-${idx}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{component.code}</td>
                          <td className="px-4 py-3 text-gray-600">{component.name}</td>
                          <td className="px-4 py-3 text-gray-600">{component.component_type}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">{money(component.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {simulation.dynamic_pricing?.enabled && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Dynamic Pricing Details</h3>
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm">
                    <p className="font-medium text-indigo-900 mb-2">
                      Total Adjustment: {money(simulation.dynamic_pricing.total_adjustment_amount)}
                    </p>
                    {simulation.dynamic_pricing.factors.length > 0 && (
                      <div className="mb-2">
                        <span className="font-semibold text-indigo-800">Factors Applied: </span>
                        {simulation.dynamic_pricing.factors.map(f => f.label).join(', ')}
                      </div>
                    )}
                    {simulation.dynamic_pricing.guardrails.length > 0 && (
                      <div>
                        <span className="font-semibold text-amber-600">Guardrails Hit: </span>
                        <ul className="list-disc pl-5 mt-1 text-amber-700">
                          {simulation.dynamic_pricing.guardrails.map((g, i) => (
                            <li key={i}>{g.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
