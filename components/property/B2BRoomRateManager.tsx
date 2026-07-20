import React from 'react';
import { B2BContract, HotelPartnerProperty, B2BRoomRatePlan } from '@/types/property';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  property: HotelPartnerProperty;
  contract: Partial<B2BContract>;
  onChange: (updates: Partial<B2BContract>) => void;
}

export default function B2BRoomRateManager({ property, contract, onChange }: Props) {
  const roomRatePlans = contract.room_rate_plans || [];
  const synchronizedRooms = (property.room_types || []).filter(
    room => typeof room.approved_room_type_id === 'number'
  );

  const handleAdd = () => {
    const usedRoomIds = new Set(roomRatePlans.map(plan => Number(plan.room_type)));
    const defaultRoomId = synchronizedRooms.find(room => !usedRoomIds.has(Number(room.approved_room_type_id)))?.approved_room_type_id || 0;
    if (!defaultRoomId) return;
    const newPlan: B2BRoomRatePlan = {
      room_type: defaultRoomId,
      rate_mode: 'PERCENTAGE_DISCOUNT',
      value: '0.00',
      is_active: true,
    };
    onChange({ room_rate_plans: [...roomRatePlans, newPlan] });
  };

  const handleUpdate = (
    index: number,
    field: keyof B2BRoomRatePlan,
    value: B2BRoomRatePlan[keyof B2BRoomRatePlan]
  ) => {
    const updated = [...roomRatePlans];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ room_rate_plans: updated });
  };

  const handleRemove = (index: number) => {
    const updated = roomRatePlans.filter((_, i) => i !== index);
    onChange({ room_rate_plans: updated });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black text-gray-900 tracking-tight">Room-wise B2B Rates</h3>
          <p className="text-xs text-gray-500 font-medium mt-1">Configure specific net rates or discounts for individual rooms.</p>
        </div>
        <Button onClick={handleAdd} disabled={roomRatePlans.length >= synchronizedRooms.length} size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold gap-2">
          <Plus className="w-4 h-4" />
          Add Rate Plan
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <th className="p-4 border-b border-r border-gray-200">Room Type</th>
              <th className="p-4 border-b border-r border-gray-200">Rate Mode</th>
              <th className="p-4 border-b border-r border-gray-200">Value (₹/%)</th>
              <th className="p-4 border-b border-r border-gray-200">Rate Valid From</th>
              <th className="p-4 border-b border-r border-gray-200">Rate Valid To</th>
              <th className="p-4 border-b border-r border-gray-200 text-center">Status</th>
              <th className="p-4 border-b border-gray-200 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roomRatePlans.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 text-sm font-medium">
                  No room-wise rate plans configured.
                </td>
              </tr>
            ) : roomRatePlans.map((plan, idx) => (
              <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50/50">
                <td className="p-4 border-r border-gray-200">
                  <select
                    value={plan.room_type}
                    onChange={(e) => handleUpdate(idx, 'room_type', parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-gray-200 text-sm font-semibold h-10 px-3 bg-white"
                  >
                    {synchronizedRooms.map(rt => (
                      <option
                        key={rt.id}
                        value={rt.approved_room_type_id as number}
                        disabled={roomRatePlans.some((other, otherIndex) => otherIndex !== idx && Number(other.room_type) === Number(rt.approved_room_type_id))}
                      >{rt.room_name}</option>
                    ))}
                  </select>
                </td>
                <td className="p-4 border-r border-gray-200">
                  <Input type="date" value={plan.effective_from || ''} onChange={(e) => handleUpdate(idx, 'effective_from', e.target.value || null)} className="h-10 text-sm" />
                </td>
                <td className="p-4 border-r border-gray-200">
                  <Input type="date" value={plan.effective_to || ''} onChange={(e) => handleUpdate(idx, 'effective_to', e.target.value || null)} className="h-10 text-sm" />
                </td>
                <td className="p-4 border-r border-gray-200">
                  <select
                    value={plan.rate_mode}
                    onChange={(e) => handleUpdate(idx, 'rate_mode', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 text-sm font-semibold h-10 px-3 bg-white"
                  >
                    <option value="PERCENTAGE_DISCOUNT">Percentage Discount (%)</option>
                    <option value="FLAT_DISCOUNT">Flat Discount (₹)</option>
                    <option value="FIXED_NET_RATE">Fixed Net Rate (₹)</option>
                  </select>
                </td>
                <td className="p-4 border-r border-gray-200">
                  <Input
                    type="number"
                    step="0.01"
                    value={plan.value}
                    onChange={(e) => handleUpdate(idx, 'value', e.target.value)}
                    className="h-10 text-sm font-bold"
                  />
                </td>
                <td className="p-4 border-r border-gray-200 text-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plan.is_active}
                      onChange={(e) => handleUpdate(idx, 'is_active', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleRemove(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
