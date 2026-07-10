'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminPropertyService } from '@/services/adminPropertyService';
import type { HotelPartnerProperty, B2BContract } from '@/types/property';
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
  
  const [discountRate, setDiscountRate] = useState<string>('0.00');

  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoading(true);
        const existing = await adminPropertyService.getB2BContract(property.id);
        if (existing) {
          setContract(existing);
          setDiscountRate(existing.shambit_discount_rate || '0.00');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load B2B Contract details');
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [property.id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: Partial<B2BContract> = {
        hotel: property.id,
        shambit_discount_rate: discountRate,
      };

      if (contract?.id) {
        await adminPropertyService.updateB2BContract(contract.id, payload);
        toast.success('B2B Contract updated');
      } else {
        const newPayload: B2BContract = {
          hotel: property.id,
          commission_type: 'PERCENTAGE',
          value: '0.00',
          pax_matrix_json: null,
          shambit_discount_rate: discountRate,
          shambit_profit_margin: '0.00',
          is_active: true,
        };
        const savedContract = await adminPropertyService.createB2BContract(newPayload);
        setContract(savedContract);
        toast.success('B2B Contract created');
      }
      if (onNext) onNext();
    } catch (err) {
      console.error(err);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Negotiated Discount Rate (%)
              </label>
              <div className="relative">
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={discountRate}
                  onChange={(e) => {
                    let val = parseFloat(e.target.value);
                    if (val > 100) val = 100;
                    if (val < 0) val = 0;
                    setDiscountRate(isNaN(val) ? e.target.value : val.toString());
                  }}
                  className="h-14 text-lg font-black pl-4 pr-12 rounded-xl"
                  placeholder="e.g. 20.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-2">
                Enter a percentage (0-100) representing the wholesale discount ShamBit receives from the hotel on the public B2C price. Example: 20 for a 20% discount.
              </p>
            </div>
          </div>

          {/* Pricing Preview Table */}
          <div className="mt-8 border-t border-gray-100 pt-8">
            <h3 className="text-sm font-black uppercase text-gray-900 tracking-tight mb-4">Pricing Preview (Per Room Type)</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-4 border-b border-r border-gray-200 text-xs font-black uppercase tracking-widest text-gray-500">Room Type</th>
                    <th className="p-4 border-b border-r border-gray-200 text-xs font-black uppercase tracking-widest text-gray-500 text-right">B2C Price</th>
                    <th className="p-4 border-b border-r border-gray-200 text-xs font-black uppercase tracking-widest text-emerald-600 text-right">Negotiated Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(property.room_types || []).map(room => {
                    const b2cPrice = parseFloat(room.base_price_per_night) || 0;
                    const discount = parseFloat(discountRate) || 0;
                    const negotiatedPrice = b2cPrice - (b2cPrice * (discount / 100));
                    return (
                      <tr key={room.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                        <td className="p-4 border-r border-gray-200">
                          <p className="text-sm font-bold text-gray-900">{room.room_name}</p>
                        </td>
                        <td className="p-4 border-r border-gray-200 text-right">
                          <p className="text-sm font-medium text-gray-600">₹{b2cPrice.toFixed(2)}</p>
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
