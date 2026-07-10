'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { adminPropertyService } from '@/services/adminPropertyService';
import type { HotelPartnerProperty } from '@/types/property';
import toast from 'react-hot-toast';

import RoomDetailsStep from '@/components/property/wizard/RoomDetailsStep';
import B2CConfigurationStep from '@/components/property/wizard/B2CConfigurationStep';
import B2BContractManager from '@/components/property/B2BContractManager';
import ComplianceStep from '@/components/property/wizard/ComplianceStep';

export default function PropertyWizardPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);

  const [property, setProperty] = useState<HotelPartnerProperty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isApproving, setIsApproving] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const propData = await adminPropertyService.getProperty(id);
      setProperty(propData);
    } catch (error) {
      console.error('Failed to fetch details:', error);
      toast.error('Failed to load property details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      // NOTE: Real implementation requires selecting a city mapping.
      // For simplicity in this step, assuming default mapping or handled backend side.
      await adminPropertyService.approveProperty(id, 1); 
      toast.success('Property approved successfully');
      fetchDetails();
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error('Failed to approve property');
    } finally {
      setIsApproving(false);
    }
  };

  const steps = [
    { id: 1, title: 'Room Details', desc: 'Property overview and capacities' },
    { id: 2, title: 'B2C to Admin Configuration', desc: 'Negotiated price for ShamBit' },
    { id: 3, title: 'Admin to Agent Settlement', desc: 'ShamBit profit and Agent TAC' },
    { id: 4, title: 'Compliance & Legal', desc: 'Verify PAN, Bank & GST' },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium tracking-tight">Loading Wizard...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p className="text-gray-900 font-bold text-xl">Property Not Found</p>
        <button onClick={() => router.push('/properties')} className="text-blue-600 underline">Back to Listing</button>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <RoomDetailsStep property={property} onNext={() => setCurrentStep(2)} />;
      case 2:
        return <B2CConfigurationStep property={property} onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />;
      case 3:
        return <B2BContractManager property={property} onNext={() => setCurrentStep(4)} onBack={() => setCurrentStep(2)} />;
      case 4:
        return <ComplianceStep property={property} onUpdate={setProperty} onBack={() => setCurrentStep(3)} />;
      default:
        return null;
    }
  };

  const panVerified = property.pan_verification_status === 'VERIFIED';
  const bankVerified = property.bank_verification_status === 'VERIFIED';
  const canApprove = panVerified && bankVerified;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors w-fit"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Properties
          </button>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">{property.property_name}</h1>
          <p className="text-gray-500 font-medium text-sm">Configure pricing and compliance settings for this property.</p>
        </div>
        
        {property.status !== 'APPROVED' ? (
          <button
            onClick={handleApprove}
            disabled={!canApprove || isApproving}
            className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
              canApprove
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve & Go Live'}
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Live on Platform
          </div>
        )}
      </div>

      {/* Wizard Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {steps.map(step => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            className={`flex flex-col items-start px-6 py-3 rounded-xl text-left transition-colors ${
              currentStep === step.id
                ? 'bg-blue-50 border border-blue-200'
                : 'hover:bg-gray-50 border border-transparent'
            }`}
          >
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              currentStep === step.id ? 'text-blue-600' : 'text-gray-400'
            }`}>
              Step {step.id}
            </span>
            <span className={`text-sm font-bold mt-1 ${
              currentStep === step.id ? 'text-blue-900' : 'text-gray-700'
            }`}>
              {step.title}
            </span>
          </button>
        ))}
      </div>

      <div className="pt-4">
        {renderStep()}
      </div>
    </div>
  );
}
