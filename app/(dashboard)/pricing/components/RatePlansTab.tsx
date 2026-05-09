import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { pricingService, type RatePlan, type PricingMetaOption } from '@/services/pricingService';

const ratePlanSchema = z.object({
  hotel: z.coerce.number().int().min(1, 'Hotel ID is required'),
  room_type: z.coerce.number().int().min(1, 'Room Type ID is required'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  plan_type: z.string().min(1, 'Plan type is required'),
  adjustment_type: z.string().min(1, 'Adjustment type is required'),
  adjustment_value: z.string().regex(/^-?\d+(\.\d{1,2})?$/, 'Must be a valid number'),
  min_length_of_stay: z.string().optional().or(z.literal('')),
  max_length_of_stay: z.string().optional().or(z.literal('')),
  requires_advance_purchase_days: z.string().optional().or(z.literal('')),
});

type RatePlanFormInput = z.input<typeof ratePlanSchema>;
type RatePlanFormValues = z.output<typeof ratePlanSchema>;

interface Props {
  ratePlans: RatePlan[];
  ratePlanTypes: PricingMetaOption[];
  ratePlanAdjustments: PricingMetaOption[];
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{children}</label>;
}

export function RatePlansTab({ ratePlans, ratePlanTypes, ratePlanAdjustments }: Props) {
  const queryClient = useQueryClient();

  const ratePlanMutation = useMutation({
    mutationFn: pricingService.createRatePlan,
    onSuccess: () => {
      toast.success('Rate plan saved');
      void queryClient.invalidateQueries({ queryKey: ['pricing-dashboard'] });
      reset();
    },
    onError: () => toast.error('Rate plan could not be saved'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RatePlanFormInput, unknown, RatePlanFormValues>({
    resolver: zodResolver(ratePlanSchema),
    defaultValues: {
      hotel: '',
      room_type: '',
      code: '',
      name: '',
      plan_type: 'BAR',
      adjustment_type: 'NONE',
      adjustment_value: '0.00',
      min_length_of_stay: '',
      max_length_of_stay: '',
      requires_advance_purchase_days: '',
    },
  });

  const onSubmit = (values: RatePlanFormValues) => {
    ratePlanMutation.mutate({
      hotel: values.hotel,
      room_type: values.room_type,
      code: values.code,
      name: values.name,
      plan_type: values.plan_type,
      adjustment_type: values.adjustment_type,
      adjustment_value: values.adjustment_value,
      min_length_of_stay: values.min_length_of_stay ? Number(values.min_length_of_stay) : null,
      max_length_of_stay: values.max_length_of_stay ? Number(values.max_length_of_stay) : null,
      requires_advance_purchase_days: values.requires_advance_purchase_days
        ? Number(values.requires_advance_purchase_days)
        : null,
      is_refundable: values.plan_type !== 'NON_REFUNDABLE',
      cancellation_deadline_hours: 24,
      requires_membership: values.plan_type === 'MEMBER',
      allowed_channels: [],
      inclusions: [],
      is_public: true,
      is_active: true,
    });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Create Rate Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <FieldLabel>Hotel ID</FieldLabel>
                <Input type="number" {...register('hotel')} error={errors.hotel?.message} placeholder="e.g. 1" />
              </div>
              <div>
                <FieldLabel>Room Type ID</FieldLabel>
                <Input type="number" {...register('room_type')} error={errors.room_type?.message} placeholder="e.g. 101" />
              </div>
              <div>
                <FieldLabel>Code</FieldLabel>
                <Input {...register('code')} error={errors.code?.message} placeholder="e.g. BAR" />
              </div>
              <div>
                <FieldLabel>Name</FieldLabel>
                <Input {...register('name')} error={errors.name?.message} placeholder="e.g. Best Available Rate" />
              </div>
              <div>
                <FieldLabel>Plan Type</FieldLabel>
                <select className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" {...register('plan_type')}>
                  {ratePlanTypes.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Adjustment Type</FieldLabel>
                <select className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" {...register('adjustment_type')}>
                  {ratePlanAdjustments.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Adjustment Value</FieldLabel>
                <Input {...register('adjustment_value')} error={errors.adjustment_value?.message} placeholder="-10.00" />
              </div>
              <div>
                <FieldLabel>Min LOS</FieldLabel>
                <Input type="number" {...register('min_length_of_stay')} error={errors.min_length_of_stay?.message} placeholder="e.g. 2" />
              </div>
              <div>
                <FieldLabel>Advance Purchase Days</FieldLabel>
                <Input type="number" {...register('requires_advance_purchase_days')} error={errors.requires_advance_purchase_days?.message} placeholder="e.g. 14" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={ratePlanMutation.isPending}>Save Rate Plan</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 xl:grid-cols-2">
        {ratePlans.map((plan) => (
          <Card key={plan.id} className={plan.is_active ? '' : 'opacity-75'}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{plan.name}</p>
                  <p className="text-sm text-gray-500">{plan.hotel_name} · {plan.room_type_name}</p>
                  <p className="mt-2 text-sm text-gray-700">
                    <span className="font-medium">{plan.plan_type}</span> · {plan.adjustment_type} {plan.adjustment_value}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  plan.is_active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {plan.code}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
