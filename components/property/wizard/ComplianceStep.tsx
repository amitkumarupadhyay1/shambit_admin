'use client';

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, ExternalLink, Loader2, XCircle, Info, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { adminPropertyService } from '@/services/adminPropertyService';
import type { HotelPartnerProperty, PanVerificationStatus, BankVerificationStatus } from '@/types/property';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import VerificationBadge from './VerificationBadge';

interface Props {
  property: HotelPartnerProperty;
  onUpdate: (property: HotelPartnerProperty) => void;
  onBack?: () => void;
}

export default function ComplianceStep({ property, onUpdate, onBack }: Props) {
  const [isPanVerifying, setIsPanVerifying] = useState(false);
  const [isBankVerifying, setIsBankVerifying] = useState(false);

  const handleVerifyPan = async (status: PanVerificationStatus) => {
    try {
      setIsPanVerifying(true);
      const result = await adminPropertyService.verifyPan(property.id, status);
      onUpdate(result.property);
      toast.success(`PAN status set to ${status}`);
    } catch (error) {
      console.error('PAN verification failed:', error);
      toast.error('Failed to update PAN verification status');
    } finally {
      setIsPanVerifying(false);
    }
  };

  const handleVerifyBank = async (status: BankVerificationStatus) => {
    try {
      setIsBankVerifying(true);
      const result = await adminPropertyService.verifyBank(property.id, status);
      onUpdate(result.property);
      toast.success(`Bank status set to ${status}`);
    } catch (error) {
      console.error('Bank verification failed:', error);
      toast.error('Failed to update bank verification status');
    } finally {
      setIsBankVerifying(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">Compliance & Verification</h2>
        <p className="text-sm text-gray-500 font-medium">Verify the legal and financial details of the property before making it live.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Compliance Card */}
        <Card className="rounded-[24px] border-gray-200 overflow-hidden shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-sm font-black uppercase tracking-tight">Legal Identity & Tax</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              {/* PAN Section */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PAN Identification</p>
                    <p className="text-sm font-bold text-gray-900 tracking-widest">{property.pan_number || 'NOT PROVIDED'}</p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase">{property.pan_name || 'Not Provided'}</p>
                  </div>
                  <VerificationBadge status={property.pan_verification_status} />
                </div>

                {/* PAN Actions */}
                <div className="flex flex-col gap-2">
                  <a
                    href="https://eportal.incometax.gov.in/iec/foservices/#/pre-login/verifyYourPAN"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Verify on Income Tax Portal
                  </a>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerifyPan('VERIFIED')}
                      disabled={isPanVerifying || property.pan_verification_status === 'VERIFIED'}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors",
                        property.pan_verification_status === 'VERIFIED'
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                      )}
                    >
                      {isPanVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Mark Verified
                    </button>
                    <button
                      onClick={() => handleVerifyPan('REJECTED')}
                      disabled={isPanVerifying || property.pan_verification_status === 'REJECTED'}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors",
                        property.pan_verification_status === 'REJECTED'
                          ? "bg-red-50 text-red-600 border border-red-200 cursor-default"
                          : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 cursor-pointer"
                      )}
                    >
                      {isPanVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                      Reject
                    </button>
                  </div>
                </div>
              </div>

              {/* GST Section */}
              <div className="flex items-start justify-between pt-3 border-t border-gray-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GST Registry</p>
                  <p className="text-sm font-bold text-gray-900">{property.gstin || 'NOT REGISTERED'}</p>
                  <div className="flex gap-2">
                     <Badge variant={property.registration_status === 'REGISTERED' ? 'success' : 'default'} className="text-[8px] px-1.5 py-0 font-black uppercase">
                       {property.registration_status || 'UNKNOWN'}
                     </Badge>
                     {property.state_code && (
                       <Badge variant="info" className="text-[8px] px-1.5 py-0 font-black uppercase">
                         State: {property.state_code}
                       </Badge>
                     )}
                  </div>
                </div>
                {property.gstin ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Info className="w-4 h-4 text-gray-300" />}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 space-y-4">
               <div className="flex items-center justify-between">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Operating Licences</p>
                 <Badge variant="default" className="text-[8px] font-black uppercase">Internal Audit</Badge>
               </div>
               
               <div className="space-y-3">
                 {[
                   { label: 'Trade Licence', value: property.trade_licence_number, optional: false },
                   { label: 'Tourism Reg.', value: property.tourism_registration_number, optional: true },
                   { label: 'FSSAI (Food)', value: property.fssai_licence_number, optional: true },
                   { label: 'Fire NOC', value: property.fire_noc_number, optional: true },
                 ].map((lic) => (
                   <div key={lic.label} className="flex items-center justify-between group">
                     <div className="flex items-center gap-2">
                       <span className="text-[11px] font-bold text-gray-600">{lic.label}</span>
                       {lic.optional && <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">Optional</span>}
                     </div>
                     <span className={cn(
                       "text-[11px] font-black",
                       lic.value ? "text-gray-900" : "text-gray-300 italic"
                     )}>
                       {lic.value || 'None'}
                     </span>
                   </div>
                 ))}
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Settlement Card */}
        <Card className="rounded-[24px] border-gray-200 overflow-hidden shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-sm font-black uppercase tracking-tight">Banking & Payouts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bank Identifier</p>
                <p className="text-sm font-bold text-gray-900 uppercase">{property.bank_name || 'NOT PROVIDED'}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">IFSC: {property.bank_ifsc || 'N/A'}</p>
              </div>
              <VerificationBadge status={property.bank_verification_status} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Number</p>
              <p className="text-sm font-black text-gray-900 tracking-[0.1em]">{property.bank_account_number || 'NOT PROVIDED'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payee</p>
              <p className="text-sm font-bold text-gray-900">{property.bank_account_holder_name || 'Not Provided'}</p>
            </div>

            {/* Bank Verification Actions */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Bank Verification</p>
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                Verify by matching the account holder name above with your bank records, or rely on the first payout cycle.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleVerifyBank('VERIFIED')}
                  disabled={isBankVerifying || property.bank_verification_status === 'VERIFIED'}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors",
                    property.bank_verification_status === 'VERIFIED'
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                  )}
                >
                  {isBankVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  Mark Verified
                </button>
                <button
                  onClick={() => handleVerifyBank('REJECTED')}
                  disabled={isBankVerifying || property.bank_verification_status === 'REJECTED'}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors",
                    property.bank_verification_status === 'REJECTED'
                      ? "bg-red-50 text-red-600 border border-red-200 cursor-default"
                      : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 cursor-pointer"
                  )}
                >
                  {isBankVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                  Reject
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {onBack && (
        <div className="flex justify-start pt-6 border-t border-gray-100">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 font-bold px-6 py-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Back to Agent Settlement
          </button>
        </div>
      )}
    </div>
  );
}
