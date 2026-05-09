import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { pricingService, type LocalDemandEvent } from '@/services/pricingService';

const eventSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  city: z.string().optional().or(z.literal('')),
  hotel: z.string().optional().or(z.literal('')),
  starts_on: z.string().min(1, 'Start date is required'),
  ends_on: z.string().min(1, 'End date is required'),
  impact_multiplier: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid multiplier'),
  source_label: z.string().min(2, 'Source label is required'),
  source_url: z.string().url('Must be a valid URL'),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface Props {
  demandEvents: LocalDemandEvent[];
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{children}</label>;
}

export function DemandEventsTab({ demandEvents }: Props) {
  const queryClient = useQueryClient();

  const eventMutation = useMutation({
    mutationFn: pricingService.createDemandEvent,
    onSuccess: () => {
      toast.success('Demand event saved');
      void queryClient.invalidateQueries({ queryKey: ['pricing-dashboard'] });
      reset();
    },
    onError: () => toast.error('Demand event could not be saved'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      city: '',
      hotel: '',
      starts_on: '',
      ends_on: '',
      impact_multiplier: '1.10',
      source_label: '',
      source_url: '',
    },
  });

  const onSubmit = (values: EventFormValues) => {
    eventMutation.mutate({
      name: values.name,
      city: values.city ? Number(values.city) : null,
      hotel: values.hotel ? Number(values.hotel) : null,
      starts_on: values.starts_on,
      ends_on: values.ends_on,
      impact_multiplier: values.impact_multiplier,
      source_label: values.source_label,
      source_url: values.source_url,
      is_active: true,
    });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Create Demand Event</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <FieldLabel>Name</FieldLabel>
                <Input {...register('name')} error={errors.name?.message} placeholder="e.g. Diwali Peak" />
              </div>
              <div>
                <FieldLabel>City ID (Optional)</FieldLabel>
                <Input type="number" {...register('city')} error={errors.city?.message} placeholder="e.g. 1" />
              </div>
              <div>
                <FieldLabel>Hotel ID (Optional)</FieldLabel>
                <Input type="number" {...register('hotel')} error={errors.hotel?.message} placeholder="e.g. 10" />
              </div>
              <div>
                <FieldLabel>Starts On</FieldLabel>
                <Input type="date" {...register('starts_on')} error={errors.starts_on?.message} />
              </div>
              <div>
                <FieldLabel>Ends On</FieldLabel>
                <Input type="date" {...register('ends_on')} error={errors.ends_on?.message} />
              </div>
              <div>
                <FieldLabel>Impact Multiplier</FieldLabel>
                <Input {...register('impact_multiplier')} error={errors.impact_multiplier?.message} placeholder="1.15" />
              </div>
              <div className="md:col-span-1">
                <FieldLabel>Source Label</FieldLabel>
                <Input {...register('source_label')} error={errors.source_label?.message} placeholder="e.g. Festival Calendar" />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Source URL</FieldLabel>
                <Input {...register('source_url')} error={errors.source_url?.message} placeholder="https://..." />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={eventMutation.isPending}>Save Event</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 xl:grid-cols-2">
        {demandEvents.map((event) => (
          <Card key={event.id} className={event.is_active ? '' : 'opacity-75'}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{event.name}</p>
                  <p className="text-sm text-gray-500">{event.starts_on} to {event.ends_on}</p>
                  <p className="mt-2 text-sm text-gray-700">
                    Impact <span className="font-bold">{event.impact_multiplier}x</span>
                  </p>
                  {(event.city_name || event.hotel_name) && (
                    <p className="mt-1 text-xs text-gray-500">
                      Scope: {[event.city_name, event.hotel_name].filter(Boolean).join(' / ')}
                    </p>
                  )}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  event.is_active ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {event.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
