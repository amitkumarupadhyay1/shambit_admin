import React from 'react';
import { B2BContract, HotelPartnerProperty, B2BGlobalRatePlan } from '@/types/property';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  property: HotelPartnerProperty;
  contract: Partial<B2BContract>;
  onChange: (updates: Partial<B2BContract>) => void;
}

export default function B2BGlobalRateManager({ property, contract, onChange }: Props) {
  const globalRatePlans = contract.global_rate_plans || [];
  const synchronizedRooms = (property.room_types || []).filter(
    room => typeof room.approved_room_type_id === 'number'
  );

  const defaultEligibleRooms = () => synchronizedRooms.map((room, index) => ({
    room_type: room.approved_room_type_id as number,
    allocation_priority: index + 1,
    max_rooms_per_booking: null,
  }));

  const handleAdd = () => {
    const newPlan: B2BGlobalRatePlan = {
      name: 'New Global Rate Plan',
      is_active: true,
      hotel_net_rate_per_room_per_night: '0.00',
      tax_percent: '12.00',
      min_rooms: 5,
      allocation_mode: 'AUTO_ALLOCATE',
      blackout_dates: [],
      terms_and_conditions: '',
      eligible_rooms: defaultEligibleRooms()
    };
    onChange({ global_rate_plans: [...globalRatePlans, newPlan] });
  };

  const handleUpdate = (
    index: number,
    field: keyof B2BGlobalRatePlan,
    value: B2BGlobalRatePlan[keyof B2BGlobalRatePlan]
  ) => {
    const updated = [...globalRatePlans];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ global_rate_plans: updated });
  };

  const handleRemove = (index: number) => {
    const updated = globalRatePlans.filter((_, i) => i !== index);
    onChange({ global_rate_plans: updated });
  };

  const handleEligibleRoomToggle = (planIndex: number, roomTypeId: number) => {
    const plan = globalRatePlans[planIndex];
    const current = plan.eligible_rooms || [];
    const isSelected = current.some(room => room.room_type === roomTypeId);
    const eligibleRooms = isSelected
      ? current.filter(room => room.room_type !== roomTypeId)
      : [
          ...current,
          {
            room_type: roomTypeId,
            allocation_priority: current.length + 1,
            max_rooms_per_booking: null,
          },
        ];
    handleUpdate(planIndex, 'eligible_rooms', eligibleRooms);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black text-gray-900 tracking-tight">Global / Bulk B2B Rates</h3>
          <p className="text-xs text-gray-500 font-medium mt-1">Configure bulk booking rates that apply across multiple room pools.</p>
        </div>
        <Button onClick={handleAdd} size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold gap-2">
          <Plus className="w-4 h-4" />
          Add Global Rate
        </Button>
      </div>

      <div className="space-y-6">
        {globalRatePlans.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-gray-300 rounded-xl bg-gray-50 text-gray-500 text-sm font-medium">
            No global rate plans configured.
          </div>
        ) : globalRatePlans.map((plan, idx) => (
          <div key={idx} className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-gray-900">Rate Plan #{idx + 1}</h4>
              <Button variant="ghost" size="sm" onClick={() => handleRemove(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4" /> Remove
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan Name</label>
                <Input
                  value={plan.name}
                  onChange={(e) => handleUpdate(idx, 'name', e.target.value)}
                  className="h-10 text-sm font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Rate (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={plan.hotel_net_rate_per_room_per_night}
                  onChange={(e) => handleUpdate(idx, 'hotel_net_rate_per_room_per_night', e.target.value)}
                  className="h-10 text-sm font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tax (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={plan.tax_percent}
                  onChange={(e) => handleUpdate(idx, 'tax_percent', e.target.value)}
                  className="h-10 text-sm font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min Rooms</label>
                <Input
                  type="number"
                  min="1"
                  value={Number.isFinite(plan.min_rooms) ? plan.min_rooms : ''}
                  onChange={(e) => {
                    const parsed = Number.parseInt(e.target.value, 10);
                    handleUpdate(idx, 'min_rooms', Number.isFinite(parsed) ? parsed : 1);
                  }}
                  className="h-10 text-sm font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Max Rooms</label>
                <Input
                  type="number"
                  value={plan.max_rooms || ''}
                  onChange={(e) => handleUpdate(idx, 'max_rooms', e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="h-10 text-sm font-bold"
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Allocation Mode</label>
                <select
                  value={plan.allocation_mode}
                  onChange={(e) => handleUpdate(idx, 'allocation_mode', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 text-sm font-semibold h-10 px-3 bg-white"
                >
                  <option value="AUTO_ALLOCATE">Auto Allocate</option>
                  <option value="MANUAL_CONFIRMATION">Manual Confirmation</option>
                </select>
              </div>
              <div className="space-y-1 md:col-span-2 xl:col-span-4">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Eligible Rooms (select at least one)</label>
                 <div className="flex flex-wrap gap-2 mt-1">
                    {synchronizedRooms.map(rt => {
                      const roomTypeId = rt.approved_room_type_id as number;
                      const selected = (plan.eligible_rooms || []).some(room => room.room_type === roomTypeId);
                      return (
                        <button
                          type="button"
                          key={rt.id}
                          onClick={() => handleEligibleRoomToggle(idx, roomTypeId)}
                          className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
                            selected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                          }`}
                        >
                            {rt.room_name}
                        </button>
                      );
                    })}
                    {synchronizedRooms.length === 0 && (
                      <p className="text-xs font-semibold text-amber-600">
                        No synchronized hotel rooms are available. Re-approve or synchronize this property first.
                      </p>
                    )}
                 </div>
              </div>
            </div>

            {/* Rate Preview Table inside the global rate card */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <h5 className="text-[10px] font-black uppercase text-gray-400 mb-2">Rate Calculation Preview</h5>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      <th className="p-3 border-b border-r border-gray-200">Hotel Net</th>
                      <th className="p-3 border-b border-r border-gray-200 text-right">+ ShamBit Profit</th>
                      <th className="p-3 border-b border-r border-gray-200 text-right text-indigo-600">+ Agent TAC</th>
                      <th className="p-3 border-b border-gray-200 text-right text-emerald-700">= Final B2B Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const base = parseFloat(plan.hotel_net_rate_per_room_per_night) || 0;
                      // Simple preview logic based on current contract state
                      let profit = 0;
                      const profitVal = parseFloat(contract.shambit_profit_margin || '0');
                      if (contract.profit_margin_type === 'PERCENTAGE') {
                        profit = base * (profitVal / 100);
                      } else {
                        profit = profitVal;
                      }

                      let tac = 0;
                      const tacVal = parseFloat(contract.value || '0');
                      const baseForTac = contract.commission_type === 'PERCENTAGE' ? (base + profit) : 1;
                      
                      if (contract.commission_type === 'PERCENTAGE') {
                         tac = baseForTac * (tacVal / 100);
                      } else {
                         tac = tacVal;
                      }

                      let finalPrice = base + profit;
                      if (contract.agent_deduction_strategy === 'ADD_TO_SELLING_PRICE') {
                        finalPrice += tac;
                      }

                      return (
                        <tr>
                          <td className="p-3 border-r border-gray-200 font-bold text-sm">₹{base.toFixed(2)}</td>
                          <td className="p-3 border-r border-gray-200 text-right font-medium text-blue-600 text-sm">+ ₹{profit.toFixed(2)}</td>
                          <td className="p-3 border-r border-gray-200 text-right font-medium text-indigo-600 text-sm">
                            {contract.agent_deduction_strategy === 'DEDUCT_FROM_PROFIT' ? `- ₹${tac.toFixed(2)} (from profit)` : `+ ₹${tac.toFixed(2)}`}
                          </td>
                          <td className="p-3 text-right font-black text-emerald-700 text-sm">₹{finalPrice.toFixed(2)}</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
