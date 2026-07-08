'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Info, 
  ChevronLeft,
  IndianRupee,
  ShieldCheck,
  CreditCard,
  Loader2,
  AlertTriangle,
  ExternalLink,
  XCircle,
  Clock,
  Ban
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { adminPropertyService } from '@/services/adminPropertyService';
import { cityService, type City } from '@/services/cityService';
import B2BContractManager from '@/components/property/B2BContractManager';
import type { HotelPartnerProperty, PropertyStatus, PanVerificationStatus, BankVerificationStatus } from '@/types/property';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const STATUS_VARIANTS: Record<PropertyStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  DRAFT: 'default',
  SUBMITTED: 'info',
  UNDER_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};

// Verification badge component
function VerificationBadge({ status }: { status?: string }) {
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

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);

  const [property, setProperty] = useState<HotelPartnerProperty | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isPanVerifying, setIsPanVerifying] = useState(false);
  const [isBankVerifying, setIsBankVerifying] = useState(false);
  
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const [propData, cityData] = await Promise.all([
        adminPropertyService.getProperty(id),
        cityService.getCities()
      ]);
      setProperty(propData);
      setCities(cityData);
      
      // Attempt fuzzy match for city
      const matchedCity = cityData.find(c => 
        c.name?.toLowerCase() === propData.city_name?.toLowerCase()
      );
      if (matchedCity) {
        setSelectedCityId(matchedCity.id.toString());
      }
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
    if (!selectedCityId) {
      toast.error('Please select a system city mapping');
      return;
    }

    try {
      setIsActionLoading(true);
      await adminPropertyService.approveProperty(id, parseInt(selectedCityId));
      toast.success('Property approved successfully');
      setShowApproveDialog(false);
      fetchDetails();
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error('Failed to approve property');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setIsActionLoading(true);
      await adminPropertyService.rejectProperty(id, rejectionReason);
      toast.success('Property rejected');
      setShowRejectDialog(false);
      fetchDetails();
    } catch (error) {
      console.error('Rejection failed:', error);
      toast.error('Failed to reject property');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleVerifyPan = async (status: PanVerificationStatus) => {
    try {
      setIsPanVerifying(true);
      const result = await adminPropertyService.verifyPan(id, status);
      setProperty(result.property);
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
      const result = await adminPropertyService.verifyBank(id, status);
      setProperty(result.property);
      toast.success(`Bank status set to ${status}`);
    } catch (error) {
      console.error('Bank verification failed:', error);
      toast.error('Failed to update bank verification status');
    } finally {
      setIsBankVerifying(false);
    }
  };

  const panVerified = property?.pan_verification_status === 'VERIFIED';
  const bankVerified = property?.bank_verification_status === 'VERIFIED';
  const approvalBlocked = !panVerified || !bankVerified;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium tracking-tight">Resolving property intelligence...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-900 font-bold text-xl">Property Not Found</p>
        <Button onClick={() => router.push('/properties')}>Back to Listing</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Listing
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge variant={STATUS_VARIANTS[property.status]} className="px-3 py-1 text-[10px] tracking-[0.1em] font-black uppercase">
                {property.status.replace('_', ' ')}
              </Badge>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Property ID: #{property.id}</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">{property.property_name}</h1>
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
              <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              {[property.full_address, property.city_name, property.state, property.pincode].filter(Boolean).join(', ')}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {property.status === 'SUBMITTED' || property.status === 'UNDER_REVIEW' || property.status === 'REJECTED' ? (
              <>
                <Button 
                  variant="outline" 
                  className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100 font-bold px-6"
                  onClick={() => setShowRejectDialog(true)}
                >
                  Reject Submission
                </Button>
                <div className="relative group">
                  <Button 
                    className={cn(
                      "font-bold px-8 shadow-lg",
                      approvalBlocked
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                    )}
                    onClick={() => !approvalBlocked && setShowApproveDialog(true)}
                    disabled={approvalBlocked}
                  >
                    Approve & Go Live
                  </Button>
                  {approvalBlocked && (
                    <div className="absolute bottom-full mb-2 right-0 w-64 bg-gray-900 text-white text-xs font-medium rounded-xl p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <p className="font-bold mb-1">Verification Required</p>
                      {!panVerified && <p className="text-gray-300">• PAN not verified</p>}
                      {!bankVerified && <p className="text-gray-300">• Bank details not verified</p>}
                    </div>
                  )}
                </div>
              </>
            ) : property.status === 'APPROVED' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Live on Platform
              </div>
            )}
          </div>
        </div>

        {/* Verification warning banner */}
        {(property.status === 'SUBMITTED' || property.status === 'UNDER_REVIEW') && approvalBlocked && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Approval Blocked — Verify before going live</p>
              <p className="text-xs text-amber-700 font-medium mt-1">
                {!panVerified && !bankVerified
                  ? 'Both PAN and bank details need to be verified before this property can be approved.'
                  : !panVerified
                  ? 'PAN details must be verified before this property can be approved.'
                  : 'Bank details must be verified before this property can be approved.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Core Info */}
          <Card className="rounded-[24px] border-gray-200 overflow-hidden shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base font-black uppercase tracking-tight">Property Intelligence</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Entity Type</p>
                  <p className="text-sm font-bold text-gray-900">{property.property_type}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Star Rating</p>
                  <p className="text-sm font-bold text-gray-900">{property.star_rating} Stars</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Inventory</p>
                  <p className="text-sm font-bold text-gray-900">{property.total_rooms} Rooms</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Established</p>
                  <p className="text-sm font-bold text-gray-900">{property.year_established || 'Not Specified'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Commission</p>
                  <p className="text-sm font-bold text-gray-900">{property.commission_percentage}% ({property.commission_type})</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Schedule</p>
                  <p className="text-sm font-bold text-gray-900">{property.check_in_time} / {property.check_out_time}</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Narrative</p>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  {property.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Room Matrix */}
          <Card className="rounded-[24px] border-gray-200 overflow-hidden shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <IndianRupee className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base font-black uppercase tracking-tight">Room Inventory Matrix</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/30 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Room Type</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Capacity</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Pricing (Base)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(property.room_types || []).map((room) => (
                    <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">{room.room_name}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{room.bed_type} • {room.total_inventory} Units</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-700">{room.max_adults}A + {room.max_children}C</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-black text-gray-900">₹{room.base_price_per_night}</p>
                        {parseFloat(room.room_discount_percent || '0') > 0 && (
                          <p className="text-[10px] text-emerald-600 font-black uppercase">-{room.room_discount_percent}% Applied</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* B2B Contract Configuration */}
          <B2BContractManager hotelId={id} />
        </div>

        {/* Right Column: Compliance & Banking */}
        <div className="space-y-8">
          {/* Compliance Card */}
          <Card className="rounded-[24px] border-gray-200 overflow-hidden shadow-sm gold-border-top">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-sm font-black uppercase tracking-tight">Compliance Matrix</CardTitle>
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
                <CardTitle className="text-sm font-black uppercase tracking-tight">Settlement Node</CardTitle>
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
      </div>

      {/* Approval Dialog */}
      {showApproveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md rounded-[32px] border-emerald-100 shadow-2xl animate-in zoom-in-95 duration-300">
            <CardHeader className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">Approve Property</CardTitle>
              <p className="text-sm font-medium text-gray-500 mt-2">Map this property to a system city to synchronize with search indexing.</p>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Platform City Mapping</label>
                <select 
                  className="w-full rounded-xl border-gray-200 font-bold text-sm h-12 focus:ring-emerald-500/20 focus:border-emerald-500"
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                >
                  <option value="">Select a city...</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}, {city.state}</option>
                  ))}
                </select>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 px-1">Fuzzy Match Suggestion: {property.city_name}</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-12 font-bold"
                  onClick={() => setShowApproveDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 rounded-xl h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-600/20"
                  onClick={handleApprove}
                  disabled={isActionLoading || !selectedCityId}
                >
                  {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Approval'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md rounded-[32px] border-red-100 shadow-2xl animate-in zoom-in-95 duration-300">
            <CardHeader className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">Reject Submission</CardTitle>
              <p className="text-sm font-medium text-gray-500 mt-2">Specify the reason for rejection. This will be sent as a notification to the partner.</p>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Rejection Intelligence</label>
                <textarea 
                  className="w-full rounded-xl border-gray-200 font-bold text-sm p-4 focus:ring-red-500/20 focus:border-red-500 min-h-[120px]"
                  placeholder="E.g. PAN card image is blurry. Please re-upload."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-12 font-bold"
                  onClick={() => setShowRejectDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 rounded-xl h-12 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-600/20"
                  onClick={handleReject}
                  disabled={isActionLoading || !rejectionReason.trim()}
                >
                  {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
