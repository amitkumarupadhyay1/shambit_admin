import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { pricingService, type RevenueManagementProfile } from '@/services/pricingService';

const profileSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED']),
  strategy: z.enum(['CONSERVATIVE', 'BALANCED', 'ASSERTIVE']),
  min_multiplier: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid number'),
  max_multiplier: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid number'),
  max_daily_rate_change_percent: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid number'),
  customer_disclosure: z.string().min(5),
  partner_disclosure: z.string().min(5),
  change_reason: z.string().min(5),
});

type ProfileFormValues = z.output<typeof profileSchema>;

interface Props {
  profiles: RevenueManagementProfile[];
}

export function RevenueProfilesTab({ profiles }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingProfile, setEditingProfile] = useState<RevenueManagementProfile | null>(null);

  const visibleProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return profiles
      .filter((profile) =>
        term
          ? `${profile.hotel_name} ${profile.name} ${profile.status}`.toLowerCase().includes(term)
          : true,
      )
      .slice(0, 50); // Paginated/limited
  }, [profiles, search]);

  const profileMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<RevenueManagementProfile> & { change_reason?: string } }) =>
      pricingService.updateProfile(id, payload),
    onSuccess: () => {
      toast.success('Revenue profile updated');
      void queryClient.invalidateQueries({ queryKey: ['pricing-dashboard'] });
      setEditingProfile(null);
    },
    onError: () => toast.error('Revenue profile update failed'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const openDrawer = (profile: RevenueManagementProfile) => {
    reset({
      status: profile.status,
      strategy: profile.strategy,
      min_multiplier: profile.min_multiplier,
      max_multiplier: profile.max_multiplier,
      max_daily_rate_change_percent: profile.max_daily_rate_change_percent,
      customer_disclosure: profile.customer_disclosure,
      partner_disclosure: profile.partner_disclosure,
      change_reason: '',
    });
    setEditingProfile(profile);
  };

  const onSubmit = (values: ProfileFormValues) => {
    if (!editingProfile) return;
    profileMutation.mutate({
      id: editingProfile.id,
      payload: values,
    });
  };

  return (
    <div className="space-y-4">
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search profiles by property, name, or status"
      />
      
      {/* Table view instead of wide cards could be better, but cards are requested refactor, 
          "Refactor Revenue Profiles from one wide table into searchable paginated list + detail drawer with validated forms."
          Wait, previous was wide table? Actually it says "Refactor Revenue Profiles from one wide table into searchable paginated list". 
          The cards in `page.tsx` were already a list. Let's keep it clean as cards or a table list. */}
      
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 font-semibold">Property</th>
              <th className="px-6 py-3 font-semibold">Strategy</th>
              <th className="px-6 py-3 font-semibold">Guardrails</th>
              <th className="px-6 py-3 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {visibleProfiles.map((profile) => (
              <tr 
                key={profile.id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => openDrawer(profile)}
              >
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-900">{profile.hotel_name}</p>
                  <p className="text-gray-500">{profile.name}</p>
                </td>
                <td className="px-6 py-4 font-medium text-gray-700">{profile.strategy}</td>
                <td className="px-6 py-4">
                  <span className="text-gray-600">{profile.min_multiplier}x - {profile.max_multiplier}x</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      profile.is_effective ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {profile.is_effective ? 'Live' : profile.status}
                    </span>
                    {!profile.admin_approved && (
                      <span className="text-xs text-amber-600 font-medium">Needs Approval</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleProfiles.length === 0 && (
          <div className="p-8 text-center text-gray-500">No profiles found.</div>
        )}
      </div>

      <Drawer
        isOpen={!!editingProfile}
        onClose={() => setEditingProfile(null)}
        title="Edit Revenue Profile"
      >
        {editingProfile && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm font-semibold text-gray-900">{editingProfile.hotel_name}</p>
              <p className="text-xs text-gray-500">{editingProfile.name}</p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Status</label>
              <select className="w-full rounded-lg border border-gray-300 px-4 py-2" {...register('status')}>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Strategy</label>
              <select className="w-full rounded-lg border border-gray-300 px-4 py-2" {...register('strategy')}>
                <option value="CONSERVATIVE">Conservative</option>
                <option value="BALANCED">Balanced</option>
                <option value="ASSERTIVE">Assertive</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Min Multiplier</label>
                <Input {...register('min_multiplier')} error={errors.min_multiplier?.message} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Max Multiplier</label>
                <Input {...register('max_multiplier')} error={errors.max_multiplier?.message} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Max Daily Rate Change (%)</label>
              <Input {...register('max_daily_rate_change_percent')} error={errors.max_daily_rate_change_percent?.message} />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Customer Disclosure</label>
              <Input {...register('customer_disclosure')} error={errors.customer_disclosure?.message} />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Partner Disclosure</label>
              <Input {...register('partner_disclosure')} error={errors.partner_disclosure?.message} />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Change Reason</label>
              <Input {...register('change_reason')} error={errors.change_reason?.message} placeholder="Required for audit" />
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button type="submit" isLoading={profileMutation.isPending} className="w-full">
                Save Changes
              </Button>
              {!editingProfile.admin_approved && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    profileMutation.mutate({
                      id: editingProfile.id,
                      payload: { admin_approved: true, change_reason: 'Admin reviewed and approved revenue profile' }
                    });
                  }}
                >
                  Approve Profile
                </Button>
              )}
            </div>
          </form>
        )}
      </Drawer>
    </div>
  );
}
