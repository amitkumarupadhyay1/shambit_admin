'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminPropertyService } from '@/services/adminPropertyService';
import type { B2BContract, B2BCommissionType, HotelPartnerProperty, B2BPreviewRow, B2BPreviewPayload, ProfitMarginType, TaxApplicationType, AgentDeductionStrategy } from '@/types/property';
import { Loader2, AlertCircle, Save, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import B2BRoomRateManager from './B2BRoomRateManager';
import B2BGlobalRateManager from './B2BGlobalRateManager';
import B2BContractReadinessPanel from './B2BContractReadinessPanel';

interface Props {
  property: HotelPartnerProperty;
  onNext?: () => void;
  onBack?: () => void;
}

export default function B2BContractManager({ property, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Partial<B2BContract>>({
    shambit_profit_margin: '0.00',
    profit_margin_type: 'PERCENTAGE',
    commission_type: 'PERCENTAGE',
    value: '0.00',
    tax_application: 'PRE_TAX',
    agent_deduction_strategy: 'DEDUCT_FROM_PROFIT',
    hotel_gst_rate: '12.00',
    shambit_profit_gst_rate: '18.00',
    agent_commission_gst_rate: '18.00',
    is_active: true,
    room_rate_plans: [],
    global_rate_plans: [],
  });
  const [originalId, setOriginalId] = useState<number | null>(null);
  const targetHotelId = property.promoted_hotel;
  
  const [waterfallData, setWaterfallData] = useState<B2BPreviewRow[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ROOM' | 'GLOBAL' | 'MARGIN' | 'TAX' | 'PREVIEW'>('ROOM');

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      if (!targetHotelId) {
        setLoading(false);
        return;
      }
      const existing = await adminPropertyService.getB2BContract(targetHotelId);
      if (existing) {
        const defaultEligibleRooms = (property.room_types || [])
          .filter(room => typeof room.approved_room_type_id === 'number')
          .map((room, index) => ({
            room_type: room.approved_room_type_id as number,
            allocation_priority: index + 1,
            max_rooms_per_booking: null,
          }));
        const normalizedGlobalPlans = (existing.global_rate_plans || []).map(plan => ({
          ...plan,
          min_rooms: Number.isFinite(Number(plan.min_rooms)) ? Number(plan.min_rooms) : 1,
          max_rooms: plan.max_rooms == null || !Number.isFinite(Number(plan.max_rooms))
            ? null
            : Number(plan.max_rooms),
          eligible_rooms: plan.eligible_rooms?.length
            ? plan.eligible_rooms
            : defaultEligibleRooms,
        }));
        setOriginalId(existing.id || null);
        setDraft({
          ...existing,
          shambit_profit_margin: existing.shambit_profit_margin || '0.00',
          profit_margin_type: existing.profit_margin_type || 'PERCENTAGE',
          commission_type: existing.commission_type || 'PERCENTAGE',
          value: existing.value || '0.00',
          tax_application: existing.tax_application || 'PRE_TAX',
          agent_deduction_strategy: existing.agent_deduction_strategy || 'DEDUCT_FROM_PROFIT',
          hotel_gst_rate: existing.hotel_gst_rate?.toString() || '12.00',
          shambit_profit_gst_rate: existing.shambit_profit_gst_rate?.toString() || '18.00',
          agent_commission_gst_rate: existing.agent_commission_gst_rate?.toString() || '18.00',
          is_active: existing.is_active,
          room_rate_plans: existing.room_rate_plans || [],
          global_rate_plans: normalizedGlobalPlans,
        });
      }
    } catch {
      toast.error('Failed to load B2B Contract details');
    } finally {
      setLoading(false);
    }
  }, [targetHotelId, property.room_types]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchPreview = React.useCallback(async () => {
    try {
      if (!targetHotelId || activeTab !== 'PREVIEW') return;
      
      setPreviewLoading(true);
      const payload: B2BPreviewPayload = {
        hotel_id: targetHotelId,
        shambit_discount_rate: draft.shambit_discount_rate || {},
        shambit_profit_margin: draft.shambit_profit_margin || '0',
        profit_margin_type: draft.profit_margin_type || 'PERCENTAGE',
        commission_type: draft.commission_type || 'PERCENTAGE',
        value: draft.value || '0',
        tax_application: draft.tax_application || 'PRE_TAX',
        agent_deduction_strategy: draft.agent_deduction_strategy || 'DEDUCT_FROM_PROFIT',
      };
      
      const res = await adminPropertyService.getB2BPreview(payload);
      
      if (res?.matrices) {
        const flatRows = res.matrices.flat();
        setWaterfallData(flatRows);
      }
    } catch {
      // silent
    } finally {
      setPreviewLoading(false);
    }
  }, [targetHotelId, draft, activeTab]);

  useEffect(() => {
    if (!loading && activeTab === 'PREVIEW') {
      const handler = setTimeout(() => {
        fetchPreview();
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [fetchPreview, loading, activeTab]);

  const handleUpdateDraft = (updates: Partial<B2BContract>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!targetHotelId) {
        toast.error('Property must be approved before saving B2B contract');
        return;
      }

      // Pre-activation validation
      const hasMargin = parseFloat(draft.shambit_profit_margin || '0') > 0;
      const hasPricing = (draft.room_rate_plans?.length || 0) > 0 || (draft.global_rate_plans?.length || 0) > 0;
      if (draft.is_active && (!hasMargin || !hasPricing)) {
         toast.error('Cannot activate contract: Missing profit margin or pricing rules.');
         setDraft(prev => ({ ...prev, is_active: false }));
         setSaving(false);
         return;
      }

      const payload: Partial<B2BContract> = {
        ...draft,
        hotel: targetHotelId,
        global_rate_plans: (draft.global_rate_plans || []).map(plan => ({
          ...plan,
          min_rooms: Number.isFinite(Number(plan.min_rooms))
            ? Math.max(1, Number(plan.min_rooms))
            : 1,
          max_rooms: plan.max_rooms == null || !Number.isFinite(Number(plan.max_rooms))
            ? null
            : Number(plan.max_rooms),
          eligible_rooms: (plan.eligible_rooms || []).filter(
            room => Number.isFinite(Number(room.room_type)) && Number(room.room_type) > 0
          ),
        })),
      };

      if (originalId) {
        const res = await adminPropertyService.updateB2BContract(originalId, payload);
        setDraft(prev => ({ ...prev, ...res }));
        toast.success('B2B Contract updated');
      } else {
        const savedContract = await adminPropertyService.createB2BContract(payload as B2BContract);
        setOriginalId(savedContract.id || null);
        setDraft(prev => ({ ...prev, ...savedContract }));
        toast.success('B2B Contract created');
      }
      if (onNext) onNext();
    } catch (error: unknown) {
      const responseData = axios.isAxiosError(error) ? error.response?.data : undefined;
      const detail = responseData?.global_rate_plans?.[0]
        || responseData?.room_rate_plans?.[0]
        || responseData?.is_active?.[0]
        || responseData?.detail
        || responseData?.message;
      toast.error(typeof detail === 'string' ? detail : 'Failed to save B2B Contract');
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
          <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">B2B Contract Manager</h2>
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

  const tabs = [
    { id: 'ROOM', label: 'Room-wise Pricing' },
    { id: 'GLOBAL', label: 'Global / Bulk Pricing' },
    { id: 'MARGIN', label: 'Margin & TAC' },
    { id: 'TAX', label: 'Tax & Validity' },
    { id: 'PREVIEW', label: 'Rate Preview' },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">B2B Contract Manager</h2>
          <p className="text-sm text-gray-500 font-medium">Manage B2B pricing, margins, agent commissions, and global inventory rules.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <B2BContractReadinessPanel contract={draft} />
          <div className="flex items-center gap-2">
            <label className="text-sm font-bold flex items-center gap-2 cursor-pointer text-gray-700 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                <input 
                    type="checkbox" 
                    checked={draft.is_active} 
                    onChange={e => handleUpdateDraft({ is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Active Contract
            </label>
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2 border-b border-gray-200">
        {tabs.map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`px-4 py-2 text-sm font-bold rounded-t-xl transition-colors whitespace-nowrap ${
               activeTab === tab.id 
                 ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' 
                 : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
             }`}
           >
             {tab.label}
           </button>
        ))}
      </div>

      <Card className="rounded-[24px] border-gray-200 overflow-hidden shadow-sm">
        <CardContent className="p-8">
          
          {activeTab === 'MARGIN' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Margin Type</label>
                 <select 
                   value={draft.profit_margin_type}
                   onChange={(e) => handleUpdateDraft({ profit_margin_type: e.target.value as ProfitMarginType })}
                   className="w-full rounded-xl border border-gray-200 font-bold text-sm h-12 focus:ring-blue-500/20 focus:border-blue-500 px-3 bg-white"
                 >
                   <option value="PERCENTAGE">Percentage (%)</option>
                   <option value="FLAT">Flat Rate (₹)</option>
                 </select>
               </div>
               
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ShamBit Margin</label>
                 <Input 
                   type="number" step="0.01"
                   value={draft.shambit_profit_margin}
                   onChange={(e) => handleUpdateDraft({ shambit_profit_margin: e.target.value })}
                   className="h-12 font-bold text-sm rounded-xl" placeholder="e.g. 10.00"
                 />
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission Type</label>
                 <select 
                   value={draft.commission_type}
                   onChange={(e) => handleUpdateDraft({ commission_type: e.target.value as B2BCommissionType })}
                   className="w-full rounded-xl border border-gray-200 font-bold text-sm h-12 focus:ring-blue-500/20 focus:border-blue-500 px-3 bg-white"
                 >
                   <option value="PERCENTAGE">Percentage (%)</option>
                   <option value="FLAT">Flat Rate (₹)</option>
                 </select>
               </div>
               
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission Value</label>
                 <Input 
                   type="number" step="0.01"
                   value={draft.value}
                   onChange={(e) => handleUpdateDraft({ value: e.target.value })}
                   className="h-12 font-bold text-sm rounded-xl" placeholder="e.g. 15.00"
                 />
               </div>

               <div className="space-y-2 lg:col-span-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agent Deduction Strategy</label>
                 <select 
                   value={draft.agent_deduction_strategy}
                   onChange={(e) => handleUpdateDraft({ agent_deduction_strategy: e.target.value as AgentDeductionStrategy })}
                   className="w-full rounded-xl border border-gray-200 font-bold text-sm h-12 focus:ring-blue-500/20 focus:border-blue-500 px-3 bg-white"
                 >
                   <option value="DEDUCT_FROM_PROFIT">Deduct from Profit (Maintain Price)</option>
                   <option value="ADD_TO_SELLING_PRICE">Add to Selling Price (Pass to Agent)</option>
                 </select>
               </div>
             </div>
          )}

          {activeTab === 'TAX' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tax Application</label>
                 <select 
                   value={draft.tax_application}
                   onChange={(e) => handleUpdateDraft({ tax_application: e.target.value as TaxApplicationType })}
                   className="w-full rounded-xl border border-gray-200 font-bold text-sm h-12 focus:ring-blue-500/20 focus:border-blue-500 px-3 bg-white"
                 >
                   <option value="PRE_TAX">Pre-Tax (Base)</option>
                   <option value="POST_TAX">Post-Tax (Gross)</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ShamBit Profit GST (%)</label>
                 <Input 
                   type="number" step="0.01"
                   value={draft.shambit_profit_gst_rate}
                   onChange={(e) => handleUpdateDraft({ shambit_profit_gst_rate: e.target.value })}
                   className="h-12 font-bold text-sm rounded-xl" placeholder="e.g. 18.00"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agent TAC GST (%)</label>
                 <Input 
                   type="number" step="0.01"
                   value={draft.agent_commission_gst_rate}
                   onChange={(e) => handleUpdateDraft({ agent_commission_gst_rate: e.target.value })}
                   className="h-12 font-bold text-sm rounded-xl" placeholder="e.g. 18.00"
                 />
               </div>
             </div>
          )}

          {activeTab === 'ROOM' && (
             <B2BRoomRateManager property={property} contract={draft} onChange={handleUpdateDraft} />
          )}

          {activeTab === 'GLOBAL' && (
             <B2BGlobalRateManager property={property} contract={draft} onChange={handleUpdateDraft} />
          )}

          {activeTab === 'PREVIEW' && (
             <div>
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
                       {draft.agent_deduction_strategy === 'ADD_TO_SELLING_PRICE' ? (
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
                         <td className="p-4 border-r border-gray-200 text-right text-sm font-medium">₹{(row.b2c_price ?? 0).toFixed(2)}</td>
                         <td className={`p-4 border-r border-gray-200 text-right text-sm font-medium text-gray-600 ${row.is_sub_row ? 'bg-transparent' : 'bg-blue-50/30'}`}>₹{(row.hotel_net ?? 0).toFixed(2)}</td>
                         <td className={`p-4 border-r border-gray-200 text-right text-sm font-medium text-blue-600 ${row.is_sub_row ? 'bg-transparent' : 'bg-blue-50/30'}`}>+ ₹{(row.profit ?? 0).toFixed(2)}</td>
                         
                         {draft.agent_deduction_strategy === 'ADD_TO_SELLING_PRICE' ? (
                           <>
                             <td className={`p-4 border-r border-gray-200 text-right text-sm font-bold text-indigo-600 ${row.is_sub_row ? 'bg-transparent' : 'bg-indigo-50/30'}`}>+ ₹{(row.agent_tac ?? 0).toFixed(2)}</td>
                             <td className={`p-4 border-r border-gray-200 text-right text-sm font-black text-gray-900 ${row.is_sub_row ? 'bg-transparent' : 'bg-amber-50/30'}`}>₹{(row.final_b2b_selling ?? 0).toFixed(2)}</td>
                             <td className={`p-4 text-right text-sm font-black ${row.is_sub_row ? 'bg-transparent' : 'bg-emerald-50/30'} ${(row.net_shambit_profit ?? 0) < 0 ? 'text-red-600 bg-red-50' : 'text-emerald-700'}`}>
                               <div className="flex items-center justify-end gap-1">
                                   {(row.net_shambit_profit ?? 0) < 0 && <AlertCircle className="w-4 h-4 text-red-600" />}
                                   ₹{(row.net_shambit_profit ?? 0).toFixed(2)}
                               </div>
                             </td>
                           </>
                         ) : (
                           <>
                             <td className={`p-4 border-r border-gray-200 text-right text-sm font-black text-gray-900 ${row.is_sub_row ? 'bg-transparent' : 'bg-amber-50/30'}`}>₹{(row.final_b2b_selling ?? 0).toFixed(2)}</td>
                             <td className={`p-4 border-r border-gray-200 text-right text-sm font-bold text-indigo-600 ${row.is_sub_row ? 'bg-transparent' : 'bg-indigo-50/30'}`}>- ₹{(row.agent_tac ?? 0).toFixed(2)}</td>
                             <td className={`p-4 text-right text-sm font-black ${row.is_sub_row ? 'bg-transparent' : 'bg-emerald-50/30'} ${(row.net_shambit_profit ?? 0) < 0 ? 'text-red-600 bg-red-50' : 'text-emerald-700'}`}>
                               <div className="flex items-center justify-end gap-1">
                                   {(row.net_shambit_profit ?? 0) < 0 && <AlertCircle className="w-4 h-4 text-red-600" />}
                                   ₹{(row.net_shambit_profit ?? 0).toFixed(2)}
                               </div>
                             </td>
                           </>
                         )}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          )}

          <div className="flex justify-between items-center pt-6 mt-8 border-t border-gray-100">
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
