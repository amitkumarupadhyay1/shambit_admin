import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { pricingService, type PricingSlab, type PricingComponent } from '@/services/pricingService';

const slabSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  min_tariff: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid amount'),
  max_tariff: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid amount').optional().or(z.literal('')),
  property_categories: z.string().min(2, 'Must provide at least one category (e.g. HOTEL)'),
  effective_from: z.string().optional().or(z.literal('')),
  effective_to: z.string().optional().or(z.literal('')),
  change_reason: z.string().min(5, 'A reason is required for the audit log'),
}).refine(data => {
  if (data.max_tariff && parseFloat(data.max_tariff) > 0) {
    return parseFloat(data.max_tariff) > parseFloat(data.min_tariff);
  }
  return true;
}, {
  message: "Max tariff must be greater than min tariff",
  path: ["max_tariff"],
});

type SlabFormValues = z.infer<typeof slabSchema>;

interface Props {
  slabs: PricingSlab[];
  components: PricingComponent[];
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

export function GstSlabsTab({ slabs, components }: Props) {
  const queryClient = useQueryClient();
  const [selectedComponentIds, setSelectedComponentIds] = useState<number[]>([]);

  const activeComponents = components.filter((c) => c.is_active);

  const slabMutation = useMutation({
    mutationFn: pricingService.createSlab,
    onSuccess: () => {
      toast.success('GST slab saved');
      void queryClient.invalidateQueries({ queryKey: ['pricing-dashboard'] });
      reset();
      setSelectedComponentIds([]);
    },
    onError: () => toast.error('GST slab could not be saved'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SlabFormValues>({
    resolver: zodResolver(slabSchema),
    defaultValues: {
      name: '',
      min_tariff: '0.00',
      max_tariff: '7500.00',
      property_categories: 'HOTEL,RESORT,HOMESTAY',
      effective_from: '',
      effective_to: '',
      change_reason: 'GST slab configuration update',
    },
  });

  const onSubmit = (values: SlabFormValues) => {
    if (selectedComponentIds.length === 0) {
      toast.error('Please select at least one tax component');
      return;
    }

    // Overlapping slab check (client-side validation)
    const newMin = parseFloat(values.min_tariff);
    const newMax = values.max_tariff ? parseFloat(values.max_tariff) : Infinity;
    const cats = values.property_categories.split(',').map(c => c.trim().toUpperCase());
    
    // Simplistic overlap check for active slabs
    const hasOverlap = slabs.filter(s => s.is_active).some(slab => {
      const slabCats = slab.property_categories || [];
      const hasCatOverlap = slabCats.some(c => cats.includes(c));
      if (!hasCatOverlap) return false;

      const sMin = parseFloat(slab.min_tariff);
      const sMax = slab.max_tariff ? parseFloat(slab.max_tariff) : Infinity;
      
      // If ranges overlap
      return Math.max(newMin, sMin) < Math.min(newMax, sMax);
    });

    if (hasOverlap) {
      toast.error('Warning: This slab overlaps with an existing active slab for the same property categories.');
      // In a real app we might still allow it if we want to override via effective dates, but let's warn.
    }

    slabMutation.mutate({
      name: values.name,
      min_tariff: values.min_tariff,
      max_tariff: values.max_tariff || '0.00',
      property_categories: cats,
      effective_from: values.effective_from || null,
      effective_to: values.effective_to || null,
      change_reason: values.change_reason,
      component_ids: selectedComponentIds,
      is_active: true,
    });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Create GST Slab</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <FieldLabel>Name</FieldLabel>
                <Input {...register('name')} error={errors.name?.message} placeholder="Slab name (e.g. 12% GST)" />
              </div>
              <div>
                <FieldLabel>Min Tariff</FieldLabel>
                <Input {...register('min_tariff')} error={errors.min_tariff?.message} placeholder="0.00" />
              </div>
              <div>
                <FieldLabel>Max Tariff</FieldLabel>
                <Input {...register('max_tariff')} error={errors.max_tariff?.message} placeholder="7500.00" />
              </div>
              <div>
                <FieldLabel>Property Categories</FieldLabel>
                <Input {...register('property_categories')} error={errors.property_categories?.message} placeholder="HOTEL,RESORT" />
              </div>
              <div>
                <FieldLabel>Effective From</FieldLabel>
                <Input type="date" {...register('effective_from')} error={errors.effective_from?.message} />
              </div>
              <div>
                <FieldLabel>Effective To</FieldLabel>
                <Input type="date" {...register('effective_to')} error={errors.effective_to?.message} />
              </div>
              
              <div className="md:col-span-3">
                <FieldLabel>Tax Components</FieldLabel>
                <div className="grid gap-2 md:grid-cols-3 mt-1">
                  {activeComponents.map((component) => (
                    <label key={component.id} className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedComponentIds.includes(component.id)}
                        onChange={(event) =>
                          setSelectedComponentIds((current) =>
                            event.target.checked
                              ? [...current, component.id]
                              : current.filter((id) => id !== component.id),
                          )
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-700">{component.name}</span>
                    </label>
                  ))}
                </div>
                {activeComponents.length === 0 && (
                  <p className="text-sm text-amber-600 mt-2">No active tax components found. Create components first.</p>
                )}
              </div>

              <div className="md:col-span-3">
                <FieldLabel>Change Reason</FieldLabel>
                <Input {...register('change_reason')} error={errors.change_reason?.message} placeholder="Required for audit logs" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={slabMutation.isPending}>Save Slab</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 xl:grid-cols-2">
        {slabs.map((slab) => (
          <Card key={slab.id} className={slab.is_active ? '' : 'opacity-75'}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{slab.name}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {money(slab.min_tariff)} to {parseFloat(slab.max_tariff) > 0 ? money(slab.max_tariff) : 'No upper limit'}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  slab.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {slab.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {slab.components.map((component) => (
                  <span key={component.id} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {component.code}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
