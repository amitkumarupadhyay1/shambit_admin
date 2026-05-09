import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { pricingService, type PricingRuleSet, type PricingSlab, type PricingMetaOption } from '@/services/pricingService';

const ruleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  priority: z.coerce.number().int().min(0, 'Priority must be non-negative'),
  condition_type: z.enum(['INTRA', 'INTER', 'GLOBAL', 'HOTEL_STATE']),
  state_code: z.string().optional(),
  effective_from: z.string().optional().or(z.literal('')),
  effective_to: z.string().optional().or(z.literal('')),
  change_reason: z.string().min(5, 'A reason is required for the audit log'),
}).refine(data => {
  if (data.condition_type === 'HOTEL_STATE' && !data.state_code) {
    return false;
  }
  return true;
}, {
  message: "State code is required for Hotel State condition",
  path: ["state_code"],
});

type RuleFormInput = z.input<typeof ruleSchema>;
type RuleFormValues = z.output<typeof ruleSchema>;

interface Props {
  ruleSets: PricingRuleSet[];
  slabs: PricingSlab[];
  gstStates: PricingMetaOption[];
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{children}</label>;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
      {label}
    </div>
  );
}

export function RuleSetsTab({ ruleSets, slabs, gstStates }: Props) {
  const queryClient = useQueryClient();
  const [selectedSlabIds, setSelectedSlabIds] = useState<number[]>([]);

  const activeSlabs = slabs.filter((s) => s.is_active);

  const ruleMutation = useMutation({
    mutationFn: pricingService.createRuleSet,
    onSuccess: () => {
      toast.success('Rule set saved');
      void queryClient.invalidateQueries({ queryKey: ['pricing-dashboard'] });
      reset();
      setSelectedSlabIds([]);
    },
    onError: () => toast.error('Rule set could not be saved'),
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<RuleFormInput, unknown, RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: '',
      priority: '',
      condition_type: 'INTRA',
      state_code: '09',
      effective_from: '',
      effective_to: '',
      change_reason: 'GST rule set configuration update',
    },
  });

  const conditionType = useWatch({ control, name: 'condition_type' });

  const onSubmit = (values: RuleFormValues) => {
    if (selectedSlabIds.length === 0) {
      toast.error('Please select at least one slab');
      return;
    }

    let conditionJson: Record<string, string | boolean | string[]> = {};
    if (values.condition_type === 'INTRA') {
      conditionJson = { same_state: true };
    } else if (values.condition_type === 'INTER') {
      conditionJson = { same_state: false };
    } else if (values.condition_type === 'HOTEL_STATE') {
      conditionJson = { hotel_state: values.state_code! };
    }

    ruleMutation.mutate({
      name: values.name,
      priority: values.priority,
      condition_json: conditionJson,
      is_active: true,
      effective_from: values.effective_from || null,
      effective_to: values.effective_to || null,
      slab_ids: selectedSlabIds,
      change_reason: values.change_reason,
    });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Create Rule Set</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <FieldLabel>Name</FieldLabel>
                <Input {...register('name')} error={errors.name?.message} placeholder="e.g. Intra-state GST" />
              </div>
              <div>
                <FieldLabel>Priority</FieldLabel>
                <Input type="number" {...register('priority')} error={errors.priority?.message} placeholder="10" />
              </div>
              <div>
                <FieldLabel>Condition Type</FieldLabel>
                <select className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" {...register('condition_type')}>
                  <option value="INTRA">Intra-state</option>
                  <option value="INTER">Inter-state</option>
                  <option value="GLOBAL">Global</option>
                  <option value="HOTEL_STATE">Hotel state</option>
                </select>
              </div>

              {conditionType === 'HOTEL_STATE' && (
                <div>
                  <FieldLabel>State Code</FieldLabel>
                  <select className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" {...register('state_code')}>
                    {gstStates.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.code} - {state.label}
                      </option>
                    ))}
                  </select>
                  {errors.state_code && <p className="text-sm text-red-500 mt-1">{errors.state_code.message}</p>}
                </div>
              )}

              <div>
                <FieldLabel>Effective From</FieldLabel>
                <Input type="date" {...register('effective_from')} error={errors.effective_from?.message} />
              </div>
              <div>
                <FieldLabel>Effective To</FieldLabel>
                <Input type="date" {...register('effective_to')} error={errors.effective_to?.message} />
              </div>
              
              <div className="md:col-span-3">
                <FieldLabel>Applicable Slabs</FieldLabel>
                <div className="grid gap-2 md:grid-cols-3 mt-1">
                  {activeSlabs.map((slab) => (
                    <label key={slab.id} className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedSlabIds.includes(slab.id)}
                        onChange={(event) =>
                          setSelectedSlabIds((current) =>
                            event.target.checked
                              ? [...current, slab.id]
                              : current.filter((id) => id !== slab.id),
                          )
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-700">{slab.name}</span>
                    </label>
                  ))}
                </div>
                {activeSlabs.length === 0 && (
                  <p className="text-sm text-amber-600 mt-2">No active slabs found. Create slabs first.</p>
                )}
              </div>

              <div className="md:col-span-3">
                <FieldLabel>Change Reason</FieldLabel>
                <Input {...register('change_reason')} error={errors.change_reason?.message} placeholder="Required for audit logs" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={ruleMutation.isPending}>Save Rule Set</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {ruleSets.length === 0 ? <EmptyState label="No rule sets configured." /> : (
        <div className="grid gap-4 xl:grid-cols-2">
          {ruleSets.map((rule) => (
            <Card key={rule.id} className={rule.is_active ? '' : 'opacity-75'}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{rule.name}</p>
                    <p className="text-sm text-gray-500">Priority {rule.priority}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    rule.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs border border-gray-200 text-gray-700">
                  {JSON.stringify(rule.condition_json, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
