'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminPropertyService } from '@/services/adminPropertyService';
import type { HotelPartnerProperty, B2BContract, B2BRoomRatePlan } from '@/types/property';
import { Loader2, ArrowRight, Save, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  property: HotelPartnerProperty;
  onNext?: () => void;
  onBack?: () => void;
}

export default function B2CConfigurationStep({ property, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState<B2BContract | null>(null);
  
  type RoomDiscountConfig = { value: string; type: 'PERCENTAGE' | 'FLAT' | 'FIXED_NET_RATE' };
  const [roomDiscounts, setRoomDiscounts] = useState<Record<string, RoomDiscountConfig>>({});

  useEffect(() => {
    const fetchContract = async () => {
      if (!property.promoted_hotel) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const existing = await adminPropertyService.getB2BContract(property.promoted_hotel);
        if (existing) {
          setContract(existing);
          try {
            const parsed = existing.shambit_discount_rate || {};
            if (typeof parsed === 'object' && Object.keys(parsed).length > 0) {
              setRoomDiscounts(parsed);
            } else {
              throw new Error('Legacy or empty');
            }
          } catch {
            const initialMap: Record<string, RoomDiscountConfig> = { "global": { value: '0.00', type: 'PERCENTAGE' } };
            property.room_types?.forEach(rt => {
              const key = rt.approved_room_type_id ? rt.approved_room_type_id.toString() : rt.id.toString();
              initialMap[key] = { value: '0.00', type: 'PERCENTAGE' };
            });
            setRoomDiscounts(initialMap);
          }
        } else {
          const initialMap: Record<string, RoomDiscountConfig> = { "global": { value: '0.00', type: 'PERCENTAGE' } };
          property.room_types?.forEach(rt => {
            const key = rt.approved_room_type_id ? rt.approved_room_type_id.toString() : rt.id.toString();
            initialMap[key] = { value: '0.00', type: 'PERCENTAGE' };
          });
          setRoomDiscounts(initialMap);
        }
      } catch {
        toast.error('Failed to load B2B Contract details');
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [property.promoted_hotel, property.room_types]);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!property.promoted_hotel) throw new Error("Property must be promoted first.");
      const room_rate_plans: B2BRoomRatePlan[] = [];
      Object.entries(roomDiscounts).forEach(([roomIdStr, config]) => {
        if (roomIdStr !== "global") {
          room_rate_plans.push({
             room_type: parseInt(roomIdStr, 10),
             rate_mode: config.type === 'FLAT' ? 'FLAT_DISCOUNT' : config.type === 'FIXED_NET_RATE' ? 'FIXED_NET_RATE' : 'PERCENTAGE_DISCOUNT',
             value: config.value,
             is_active: true
          });
        }
      });

      const payload: Partial<B2BContract> = {
        hotel: property.promoted_hotel,
        shambit_discount_rate: roomDiscounts,
        room_rate_plans: room_rate_plans,
        global_rate_plans: [], // To be managed by B2BGlobalRateManager later
      };

      if (contract?.id) {
        await adminPropertyService.updateB2BContract(contract.id, payload);
        toast.success('B2B Contract updated');
      } else {
        const newPayload: Partial<B2BContract> = {
          hotel: property.promoted_hotel,
          commission_type: 'PERCENTAGE',
          value: '0.00',
          shambit_discount_rate: roomDiscounts,
          shambit_profit_margin: '0.00',
          is_active: false,
          room_rate_plans: room_rate_plans,
          global_rate_plans: [],
        };
        const savedContract = await adminPropertyService.createB2BContract(newPayload);
        setContract(savedContract);
        toast.success('B2B Contract created');
      }
      if (onNext) onNext();
    } catch {
      toast.error('Failed to save B2B Contract');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-[24px] border-gray-200 overflow-hidden shadow-sm mt-8">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">B2C to Admin Configuration</h2>
        <p className="text-sm text-gray-500 font-medium">Configure the negotiated hotel price for ShamBit based on the public B2C price.</p>
      </div>

      <Card className="rounded-[24px] border-gray-200 overflow-hidden shadow-sm">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base font-black uppercase tracking-tight">ShamBit Discount Rate</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-4 border-b border-r border-gray-200 text-xs font-black uppercase tracking-widest text-gray-500">Room Type</th>
                  <th className="p-4 border-b border-r border-gray-200 text-xs font-black uppercase tracking-widest text-gray-500 text-right">B2C Price</th>
                  <th className="p-4 border-b border-r border-gray-200 text-xs font-black uppercase tracking-widest text-gray-500">Discount Type</th>
                  <th className="p-4 border-b border-r border-gray-200 text-xs font-black uppercase tracking-widest text-gray-500">Value</th>
                  <th className="p-4 border-b border-r border-gray-200 text-xs font-black uppercase tracking-widest text-emerald-600 text-right">Negotiated Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b-2 border-blue-200 bg-blue-50/30">
                  <td className="p-4 border-r border-gray-200">
                    <p className="text-sm font-black text-blue-900">Global Hotel (Run of House)</p>
                    <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-wider">Fallback / Bulk Rate</p>
                  </td>
                  <td className="p-4 border-r border-gray-200 text-right">
                    <p className="text-sm font-medium text-gray-400 italic">N/A</p>
                  </td>
                  <td className="p-4 border-r border-gray-200">
                    <select
                      value={roomDiscounts["global"]?.type || 'PERCENTAGE'}
                      onChange={(e) => {
                        setRoomDiscounts(prev => ({
                          ...prev,
                          "global": { ...(prev["global"] || {value: '0.00'}), type: e.target.value as 'PERCENTAGE' | 'FLAT' | 'FIXED_NET_RATE' }
                        }));
                      }}
                      className="w-full rounded-lg border border-blue-200 text-sm font-semibold h-10 px-3 bg-white"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FLAT">Flat Rate (₹)</option>
                      <option value="FIXED_NET_RATE">Fixed Net Rate (₹)</option>
                    </select>
                  </td>
                  <td className="p-4 border-r border-gray-200">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={roomDiscounts["global"]?.value || '0.00'}
                      onChange={(e) => {
                        setRoomDiscounts(prev => ({
                          ...prev,
                          "global": { ...(prev["global"] || {type: 'PERCENTAGE'}), value: e.target.value }
                        }));
                      }}
                      className="h-10 text-sm font-bold w-32 border-blue-200"
                      placeholder="e.g. 20.00"
                    />
                  </td>
                  <td className="p-4 text-right">
                    <p className="text-[10px] font-bold text-gray-400 italic uppercase">Applied when specific room unknown</p>
                  </td>
                </tr>
                {(property.room_types || []).map(room => {
                  const b2cPrice = parseFloat(room.base_price_per_night) || 0;
                  const roomIdKey = room.approved_room_type_id ? room.approved_room_type_id.toString() : room.id.toString();
                  const discountConfig = roomDiscounts[roomIdKey] || { value: '0.00', type: 'PERCENTAGE' };
                  const discountVal = parseFloat(discountConfig.value) || 0;
                  
                  let negotiatedPrice = b2cPrice;
                  if (discountConfig.type === 'PERCENTAGE') {
                    negotiatedPrice = b2cPrice - (b2cPrice * (discountVal / 100));
                  } else if (discountConfig.type === 'FLAT') {
                    negotiatedPrice = b2cPrice - discountVal;
                  } else if (discountConfig.type === 'FIXED_NET_RATE') {
                    negotiatedPrice = discountVal;
                  }
                  if (negotiatedPrice < 0) negotiatedPrice = 0;

                  return (
                    <tr key={room.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                      <td className="p-4 border-r border-gray-200">
                        <p className="text-sm font-bold text-gray-900">{room.room_name}</p>
                      </td>
                      <td className="p-4 border-r border-gray-200 text-right">
                        <p className="text-sm font-medium text-gray-600">₹{b2cPrice.toFixed(2)}</p>
                      </td>
                      <td className="p-4 border-r border-gray-200">
                        <select
                          value={discountConfig.type}
                          onChange={(e) => {
                            setRoomDiscounts(prev => ({
                              ...prev,
                              [roomIdKey]: { ...discountConfig, type: e.target.value as 'PERCENTAGE' | 'FLAT' | 'FIXED_NET_RATE' }
                            }));
                          }}
                          className="w-full rounded-lg border border-gray-200 text-sm font-semibold h-10 px-3 bg-white"
                        >
                          <option value="PERCENTAGE">Percentage (%)</option>
                          <option value="FLAT">Flat Rate (₹)</option>
                          <option value="FIXED_NET_RATE">Fixed Net Rate (₹)</option>
                        </select>
                      </td>
                      <td className="p-4 border-r border-gray-200">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={discountConfig.value}
                          onChange={(e) => {
                            setRoomDiscounts(prev => ({
                              ...prev,
                              [roomIdKey]: { ...discountConfig, value: e.target.value }
                            }));
                          }}
                          className="h-10 text-sm font-bold w-32"
                          placeholder="e.g. 20.00"
                        />
                      </td>
                      <td className="p-4 border-r border-gray-200 text-right">
                        <p className="text-sm font-black text-emerald-700">₹{negotiatedPrice.toFixed(2)}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-100">
            {onBack ? (
              <Button 
                onClick={onBack} 
                variant="outline"
                className="font-bold px-6 py-6 rounded-xl flex items-center gap-2"
              >
                Back to Room Details
              </Button>
            ) : <div />}
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save & Continue to Settlements
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
