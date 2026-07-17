import React from 'react';
import { B2BContract } from '@/types/property';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Props {
  contract: Partial<B2BContract> | null;
}

export default function B2BContractReadinessPanel({ contract }: Props) {
  if (!contract) {
    return (
      <div className="p-4 border rounded-xl bg-gray-50 border-gray-200">
        <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          No contract drafted yet.
        </p>
      </div>
    );
  }

  const hasMargin = parseFloat(contract.shambit_profit_margin || '0') > 0;
  const hasTac = parseFloat(contract.value || '0') > 0;
  const hasRoomRates = (contract.room_rate_plans?.length || 0) > 0;
  const hasGlobalRates = (contract.global_rate_plans?.length || 0) > 0;
  const hasPricing = hasRoomRates || hasGlobalRates;

  const isReady = hasMargin && hasPricing;

  return (
    <div className={`p-4 border rounded-xl ${isReady ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
      <h3 className={`text-sm font-bold flex items-center gap-2 ${isReady ? 'text-emerald-800' : 'text-amber-800'} mb-3`}>
        {isReady ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        {isReady ? 'Contract Ready for Activation' : 'Contract Incomplete'}
      </h3>
      
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">ShamBit Margin Configured</span>
          {hasMargin ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-amber-500" />}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Agent TAC Configured</span>
          {hasTac ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-amber-500" />}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Pricing Rules (Room or Global)</span>
          {hasPricing ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-amber-500" />}
        </div>
      </div>
    </div>
  );
}
