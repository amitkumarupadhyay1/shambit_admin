import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { pricingService, type PricingComponent, type PricingMetaOption } from '@/services/pricingService';

const componentSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  component_type: z.enum(['TAX', 'FEE', 'DISCOUNT', 'SURCHARGE']),
  formula_type: z.enum(['PERCENTAGE', 'FIXED', 'PERCENTAGE_OF_TOTAL']),
  value: z.string().min(1),
  sac_hsn_code: z.string().optional(),
  is_taxable: z.boolean().default(false),
  is_deductible_from_tax_base: z.boolean().default(false),
  is_withheld: z.boolean().default(false),
  effective_from: z.string().optional().or(z.literal('')),
  effective_to: z.string().optional().or(z.literal('')),
  display_priority: z.coerce.number().int().min(0).default(0),
  change_reason: z.string().min(5),
});

type ComponentFormInput = z.input<typeof componentSchema>;
type ComponentFormValues = z.output<typeof componentSchema>;

interface Props {
  components: PricingComponent[];
  componentTypes: PricingMetaOption[];
  formulaTypes: PricingMetaOption[];
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{children}</label>;
}

export function TaxAndFeesTab({ components, componentTypes, formulaTypes }: Props) {
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: pricingService.createComponent,
    onSuccess: () => {
      toast.success('Tax or fee component saved');
      reset();
      void queryClient.invalidateQueries({ queryKey: ['pricing-dashboard'] });
    },
    onError: () => toast.error('Component could not be saved'),
  });

  const deactivateComponentMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      pricingService.deactivateComponent(id, reason),
    onSuccess: () => {
      toast.success('Component deactivated');
      void queryClient.invalidateQueries({ queryKey: ['pricing-dashboard'] });
    },
    onError: () => toast.error('Component could not be deactivated'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ComponentFormInput, unknown, ComponentFormValues>({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      component_type: 'TAX',
      formula_type: 'PERCENTAGE',
      value: '0.00',
      display_priority: 0,
      is_taxable: false,
      is_deductible_from_tax_base: false,
      is_withheld: false,
      change_reason: 'Admin pricing configuration update',
    },
  });

  const onSubmit = (values: ComponentFormValues) => {
    const payload: Partial<PricingComponent> & { change_reason: string } = {
      ...values,
      effective_from: values.effective_from || null,
      effective_to: values.effective_to || null,
      sac_hsn_code: values.sac_hsn_code || '',
      is_active: true,
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Create Tax/Fee Component</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <FieldLabel>Code</FieldLabel>
              <Input {...register('code')} error={errors.code?.message} placeholder="CGST_6" />
            </div>
            <div>
              <FieldLabel>Name</FieldLabel>
              <Input {...register('name')} error={errors.name?.message} placeholder="CGST 6%" />
            </div>
            <div>
              <FieldLabel>Value</FieldLabel>
              <Input {...register('value')} error={errors.value?.message} placeholder="6.00" />
            </div>
            <div>
              <FieldLabel>Component Type</FieldLabel>
              <select className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" {...register('component_type')}>
                {componentTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Formula</FieldLabel>
              <select className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" {...register('formula_type')}>
                {formulaTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>SAC/HSN</FieldLabel>
              <Input {...register('sac_hsn_code')} placeholder="9963" />
            </div>
            <div>
              <FieldLabel>Effective From</FieldLabel>
              <Input type="date" {...register('effective_from')} />
            </div>
            <div>
              <FieldLabel>Effective To</FieldLabel>
              <Input type="date" {...register('effective_to')} />
            </div>
            <div>
              <FieldLabel>Display Priority</FieldLabel>
              <Input type="number" {...register('display_priority')} />
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
              <input type="checkbox" {...register('is_taxable')} />
              Taxable
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
              <input type="checkbox" {...register('is_deductible_from_tax_base')} />
              Deducts from tax base
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
              <input type="checkbox" {...register('is_withheld')} />
              Platform withheld
            </label>
            <div className="md:col-span-2">
              <FieldLabel>Change reason</FieldLabel>
              <Input {...register('change_reason')} error={errors.change_reason?.message} />
            </div>
            <div className="flex items-end">
              <Button type="submit" isLoading={createMutation.isPending}>
                Save Component
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 xl:grid-cols-2">
        {components.map((component: PricingComponent) => (
          <Card key={component.id} className={component.is_active ? '' : 'opacity-75'}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{component.name}</p>
                  <p className="text-sm text-gray-500">{component.code}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  component.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {component.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                <span>{component.component_type}</span>
                <span>{component.formula_type}</span>
                <span className="font-medium text-gray-900">{component.value}</span>
                <span>{component.is_withheld ? 'Withheld' : 'Hotel-visible'}</span>
              </div>
              {component.is_active && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    deactivateComponentMutation.mutate({
                      id: component.id,
                      reason: 'Admin expired pricing component from control center',
                    })
                  }
                >
                  Deactivate
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
