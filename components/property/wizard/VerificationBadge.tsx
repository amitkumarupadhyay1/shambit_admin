'use client';

import { Clock, CheckCircle2, Ban, XCircle } from 'lucide-react';
import React from 'react';

export default function VerificationBadge({ status }: { status?: string }) {
  if (!status || status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-black uppercase tracking-widest">
        <Clock className="w-2.5 h-2.5" />
        Pending
      </span>
    );
  }
  if (status === 'VERIFIED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-widest">
        <CheckCircle2 className="w-2.5 h-2.5" />
        Verified
      </span>
    );
  }
  if (status === 'FAILED_BOUNCE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[9px] font-black uppercase tracking-widest">
        <Ban className="w-2.5 h-2.5" />
        Bounced
      </span>
    );
  }
  // REJECTED
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[9px] font-black uppercase tracking-widest">
      <XCircle className="w-2.5 h-2.5" />
      Rejected
    </span>
  );
}
