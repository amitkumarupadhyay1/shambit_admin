'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminPropertyService } from '@/services/adminPropertyService';
import type { B2BContract, B2BCommissionType, HotelPartnerProperty, B2BPreviewRow, B2BPreviewPayload, ProfitMarginType, TaxApplicationType, AgentDeductionStrategy } from '@/types/property';
import { Loader2, AlertCircle, TrendingUp, Save, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  property: HotelPartnerProperty;
  onNext?: () => void;
  onBack?: () => void;
}

export default function B2BContractManager({ property, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState<B2BContract | null>(null);
  const targetHotelId = property.promoted_hotel;
  const [shambitProfitMargin, setShambitProfitMargin] = useState<string>('0.00');
  const [profitMarginType, setProfitMarginType] = useState<ProfitMarginType>('PERCENTAGE');
  const [commissionType, setCommissionType] = useState<B2BCommissionType>('PERCENTAGE');
  const [commissionValue, setCommissionValue] = useState<string>('0.00');
  const [taxApplication, setTaxApplication] = useState<TaxApplicationType>('PRE_TAX');
  const [agentDeductionStrategy, setAgentDeductionStrategy] = useState<AgentDeductionStrategy>('DEDUCT_FROM_PROFIT');
  const [hotelGstRate, setHotelGstRate] = useState<string>('12.00');
  const [shambitProfitGstRate, setShambitProfitGstRate] = useState<string>('18.00');
  const [agentCommissionGstRate, setAgentCommissionGstRate] = useState<string>('18.00');
  const [isActive, setIsActive] = useState<boolean>(true);
  
  const [waterfallData, setWaterfallData] = useState<B2BPreviewRow[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      if (!targetHotelId) {
        setLoading(false);
        return;
      }
      
      // Fetch contract
      const existing = await adminPropertyService.getB2BContract(targetHotelId);
      if (existing) {
        setContract(existing);
        setShambitProfitMargin(existing.shambit_profit_margin || '0.00');
        setProfitMarginType(existing.profit_margin_type || 'PERCENTAGE');
        setCommissionType(existing.commission_type);
        setCommissionValue(existing.value);
        setTaxApplication(existing.tax_application || 'PRE_TAX');
        setAgentDeductionStrategy(existing.agent_deduction_strategy || 'DEDUCT_FROM_PROFIT');
        setHotelGstRate(existing.hotel_gst_rate?.toString() || '12.00');
        setShambitProfitGstRate(existing.shambit_profit_gst_rate?.toString() || '18.00');
        setAgentCommissionGstRate(existing.agent_commission_gst_rate?.toString() || '18.00');
        setIsActive(existing.is_active);
      }



    } catch {
      toast.error('Failed to load B2B Contract details');
    } finally {
      setLoading(false);
    }
  }, [targetHotelId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchPreview = React.useCallback(async () => {
    try {
      if (!targetHotelId) return;
      
      setPreviewLoading(true);
      const payload: B2BPreviewPayload = {
        hotel_id: targetHotelId,
        shambit_discount_rate: '0.00',
        shambit_profit_margin: shambitProfitMargin,
        profit_margin_type: profitMarginType,
        commission_type: commissionType,
        value: commissionValue,
        tax_application: taxApplication,
        agent_deduction_strategy: agentDeductionStrategy,
      };
      
      const res = await adminPropertyService.getB2BPreview(payload);
      
      if (res?.matrices) {
        // Flatten matrices for all rooms
        const flatRows = res.matrices.flat();
        setWaterfallData(flatRows);
      }
    } catch {
      // Silently catch preview fetch errors
    } finally {
      setPreviewLoading(false);
    }
  }, [targetHotelId, shambitProfitMargin, profitMarginType, commissionType, commissionValue, taxApplication, agentDeductionStrategy]);

  useEffect(() => {
    if (!loading) {
      const handler = setTimeout(() => {
        fetchPreview();
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [fetchPreview, loading]);

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!targetHotelId) {
        toast.error('Property must be approved before saving B2B contract');
        setSaving(false);
        return;
      }

      const payload: Partial<B2BContract> = {
        hotel: targetHotelId,
        shambit_profit_margin: shambitProfitMargin,
        profit_margin_type: profitMarginType,
        commission_type: commissionType,
        value: commissionValue,
        tax_application: taxApplication,
        agent_deduction_strategy: agentDeductionStrategy,
        hotel_gst_rate: hotelGstRate,
        shambit_profit_gst_rate: shambitProfitGstRate,
        agent_commission_gst_rate: agentCommissionGstRate,
        is_active: isActive,
      };

      if (contract?.id) {
        const savedContract = await adminPropertyService.updateB2BContract(contract.id, payload);
        setContract(savedContract);
        toast.success('B2B Contract updated');
      } else {
        const newPayload: B2BContract = {
          hotel: targetHotelId,
          shambit_discount_rate: {},
          shambit_profit_margin: shambitProfitMargin,
          profit_margin_type: profitMarginType,
          commission_type: commissionType,
          value: commissionValue,
          tax_application: taxApplication,
          agent_deduction_strategy: agentDeductionStrategy,
          hotel_gst_rate: hotelGstRate,
          shambit_profit_gst_rate: shambitProfitGstRate,
          agent_commission_gst_rate: agentCommissionGstRate,
          is_active: isActive,
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

  if (!targetHotelId) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">Admin to Agent Settlement</h2>
          <p className="text-sm text-gray-500 font-medium">Configure ShamBit&apos;s profit margin and the Agent&apos;s commission strategy.</p>
        </div>
        <Card className="rounded-[24px] border-gray-200 overflow-hidden shadow-sm mt-8">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Property Not Approved</h3>
            <p className="text-sm text-gray-500 max-w-md">
              B2B Settlement can only be configured after the property has been approved and a live Hotel record is created. Please approve the property first.
            </p>
            {onBack && (
              <Button onClick={onBack} variant="outline" className="mt-6 font-bold px-6">
                Back to B2C Config
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">Admin to Agent Settlement</h2>
        <p className="text-sm text-gray-500 font-medium">Configure ShamBit&apos;s profit margin and the Agent&apos;s commission strategy.</p>
      </div>

      <Card className="rounded-[24px] border-gray-200 overflow-hidden shadow-sm">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base font-black uppercase tracking-tight">Markup & Commission</CardTitle>
          </div>
          <div className="flex items-center gap-3">
              <label className="text-sm font-bold flex items-center gap-2 cursor-pointer text-gray-700">
                  <input 
                      type="checkbox" 
                      checked={isActive} 
                      onChange={e => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Active Contract
              </label>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Margin Type</label>
              <select 
                value={profitMarginType}
                onChange={(e) => setProfitMarginType(e.target.value as ProfitMarginType)}
                className="w-full rounded-xl border border-gray-200 font-bold text-sm h-12 focus:ring-blue-500/20 focus:border-blue-500 px-3 bg-white"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Rate (₹)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ShamBit Margin</label>
              <Input 
                type="number"
                step="0.01"
                value={shambitProfitMargin}
                onChange={(e) => setShambitProfitMargin(e.target.value)}
                className="h-12 font-bold text-sm rounded-xl"
                placeholder="e.g. 10.00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission Type</label>
              <select 
                value={commissionType}
                onChange={(e) => setCommissionType(e.target.value as B2BCommissionType)}
                className="w-full rounded-xl border border-gray-200 font-bold text-sm h-12 focus:ring-blue-500/20 focus:border-blue-500 px-3 bg-white"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Rate (₹)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission Value</label>
              <Input 
                type="number"
                step="0.01"
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
                className="h-12 font-bold text-sm rounded-xl"
                placeholder="e.g. 15.00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tax Application</label>
              <select 
                value={taxApplication}
                onChange={(e) => setTaxApplication(e.target.value as TaxApplicationType)}
                className="w-full rounded-xl border border-gray-200 font-bold text-sm h-12 focus:ring-blue-500/20 focus:border-blue-500 px-3 bg-white"
              >
                <option value="PRE_TAX">Pre-Tax (Base)</option>
                <option value="POST_TAX">Post-Tax (Gross)</option>
              </select>
            </div>
            
            <div className="space-y-2 lg:col-span-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agent Deduction Strategy</label>
              <select 
                value={agentDeductionStrategy}
                onChange={(e) => setAgentDeductionStrategy(e.target.value as AgentDeductionStrategy)}
                className="w-full rounded-xl border border-gray-200 font-bold text-sm h-12 focus:ring-blue-500/20 focus:border-blue-500 px-3 bg-white"
              >
                <option value="DEDUCT_FROM_PROFIT">Deduct from Profit (Maintain Price)</option>
                <option value="ADD_TO_SELLING_PRICE">Add to Selling Price (Pass to Agent)</option>
              </select>
            </div>
            
            {/* GST Configurations */}
            <div className="space-y-2 border-t border-gray-100 pt-6 mt-2 col-span-full">
               <h3 className="text-sm font-black uppercase text-gray-900 tracking-tight">GST Tax Rates</h3>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hotel GST (%)</label>
              <Input 
                type="number"
                step="0.01"
                value={hotelGstRate}
                onChange={(e) => setHotelGstRate(e.target.value)}
                className="h-12 font-bold text-sm rounded-xl"
                placeholder="e.g. 12.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ShamBit Profit GST (%)</label>
              <Input 
                type="number"
                step="0.01"
                value={shambitProfitGstRate}
                onChange={(e) => setShambitProfitGstRate(e.target.value)}
                className="h-12 font-bold text-sm rounded-xl"
                placeholder="e.g. 18.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agent TAC GST (%)</label>
              <Input 
                type="number"
                step="0.01"
                value={agentCommissionGstRate}
                onChange={(e) => setAgentCommissionGstRate(e.target.value)}
                className="h-12 font-bold text-sm rounded-xl"
                placeholder="e.g. 18.00"
              />
            </div>
          </div>


          {/* Read-Only Transparency Grid */}
          <div className="mt-8 border-t border-gray-100 pt-8">
            <div className="mb-4">
              <h3 className="text-sm font-black uppercase text-gray-900 tracking-tight">Transparency Grid (Rate Plan Preview)</h3>
              <p className="text-xs font-medium text-gray-500 mt-1">Live preview of actual Hotel Partner configured meal plans with your margins applied.</p>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <th className="p-4 border-b border-r border-gray-200">Room Type</th>
                    <th className="p-4 border-b border-r border-gray-200">Meal Plan</th>
                    <th className="p-4 border-b border-r border-gray-200 text-right">B2C Price</th>
                    <th className="p-4 border-b border-r border-gray-200 text-right bg-blue-50/50">Hotel Net</th>
                    <th className="p-4 border-b border-r border-gray-200 text-right bg-blue-50/50">+ Profit</th>
                    {agentDeductionStrategy === 'ADD_TO_SELLING_PRICE' ? (
                      <>
                        <th className="p-4 border-b border-r border-gray-200 text-right text-indigo-600 bg-indigo-50/50">+ Agent TAC</th>
                        <th className="p-4 border-b border-r border-gray-200 text-right bg-amber-50/50">= Final B2B Selling</th>
                        <th className="p-4 border-b border-gray-200 text-right text-emerald-700 bg-emerald-50/50">Net ShamBit Profit</th>
                      </>
                    ) : (
                      <>
                        <th className="p-4 border-b border-r border-gray-200 text-right bg-amber-50/50">= Final B2B Selling</th>
                        <th className="p-4 border-b border-r border-gray-200 text-right text-indigo-600 bg-indigo-50/50">- Agent TAC</th>
                        <th className="p-4 border-b border-gray-200 text-right text-emerald-700 bg-emerald-50/50">= Net ShamBit Profit</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {previewLoading ? (
                     <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500">
                            <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-600" />
                            <p className="text-sm font-medium">Recalculating Matrix...</p>
                        </td>
                    </tr>
                  ) : waterfallData.length === 0 ? (
                     <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500">
                            <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">No room types or meal plans found for this property.</p>
                        </td>
                    </tr>
                  ) : waterfallData.map((row: B2BPreviewRow) => (
                    <tr key={row.id} className={`border-b border-gray-200 hover:bg-gray-50/50 transition-colors ${row.is_sub_row ? 'bg-gray-50/30 italic text-gray-500' : ''}`}>
                      <td className="p-4 border-r border-gray-200 font-bold text-sm">
                        {row.is_sub_row ? <span className="ml-4 flex items-center gap-1 text-gray-400">↳ <span className="font-medium">{row.room_type}</span></span> : row.room_type}
                      </td>
                      <td className="p-4 border-r border-gray-200 font-bold text-sm text-gray-600">{row.meal_plan}</td>
                      <td className="p-4 border-r border-gray-200 text-right text-sm font-medium">₹{row.b2c_price.toFixed(2)}</td>
                      <td className={`p-4 border-r border-gray-200 text-right text-sm font-medium text-gray-600 ${row.is_sub_row ? 'bg-transparent' : 'bg-blue-50/30'}`}>₹{row.hotel_net.toFixed(2)}</td>
                      <td className={`p-4 border-r border-gray-200 text-right text-sm font-medium text-blue-600 ${row.is_sub_row ? 'bg-transparent' : 'bg-blue-50/30'}`}>+ ₹{row.profit.toFixed(2)}</td>
                      
                      {agentDeductionStrategy === 'ADD_TO_SELLING_PRICE' ? (
                        <>
                          <td className={`p-4 border-r border-gray-200 text-right text-sm font-bold text-indigo-600 ${row.is_sub_row ? 'bg-transparent' : 'bg-indigo-50/30'}`}>+ ₹{row.agent_tac.toFixed(2)}</td>
                          <td className={`p-4 border-r border-gray-200 text-right text-sm font-black text-gray-900 ${row.is_sub_row ? 'bg-transparent' : 'bg-amber-50/30'}`}>₹{row.final_b2b_selling.toFixed(2)}</td>
                          <td className={`p-4 text-right text-sm font-black ${row.is_sub_row ? 'bg-transparent' : 'bg-emerald-50/30'} ${row.net_shambit_profit < 0 ? 'text-red-600 bg-red-50' : 'text-emerald-700'}`}>
                            <div className="flex items-center justify-end gap-1">
                                {row.net_shambit_profit < 0 && <AlertCircle className="w-4 h-4 text-red-600" />}
                                ₹{row.net_shambit_profit.toFixed(2)}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className={`p-4 border-r border-gray-200 text-right text-sm font-black text-gray-900 ${row.is_sub_row ? 'bg-transparent' : 'bg-amber-50/30'}`}>₹{row.final_b2b_selling.toFixed(2)}</td>
                          <td className={`p-4 border-r border-gray-200 text-right text-sm font-bold text-indigo-600 ${row.is_sub_row ? 'bg-transparent' : 'bg-indigo-50/30'}`}>- ₹{row.agent_tac.toFixed(2)}</td>
                          <td className={`p-4 text-right text-sm font-black ${row.is_sub_row ? 'bg-transparent' : 'bg-emerald-50/30'} ${row.net_shambit_profit < 0 ? 'text-red-600 bg-red-50' : 'text-emerald-700'}`}>
                            <div className="flex items-center justify-end gap-1">
                                {row.net_shambit_profit < 0 && <AlertCircle className="w-4 h-4 text-red-600" />}
                                ₹{row.net_shambit_profit.toFixed(2)}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Hotel Net:</strong> The actual amount ShamBit pays to the hotel (B2C Price minus your negotiated B2C discount from Step 2).</p>
                <p><strong>Final B2B Selling:</strong> The price presented to B2B Agents on the portal.</p>
                <p><strong>Net ShamBit Profit:</strong> Your true earnings after paying the agent their commission. If this is negative (highlighted in red), you are losing money on the booking.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-100">
            {onBack ? (
              <Button 
                onClick={onBack} 
                variant="outline"
                className="font-bold px-6 py-6 rounded-xl flex items-center gap-2"
              >
                Back to B2C Config
              </Button>
            ) : <div />}
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Final Settlement
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
