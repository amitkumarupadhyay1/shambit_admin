'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { AlertCircle, Download, FileText, Loader2, Save, ShieldCheck, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { adminPropertyService } from '@/services/adminPropertyService';
import type {
  AgentDeductionStrategy,
  B2BCommissionType,
  B2BContract,
  B2BPricingMode,
  B2BPreviewResponse,
  HotelPartnerProperty,
  ProfitMarginType,
  TaxApplicationType,
} from '@/types/property';
import B2BGlobalRateManager from './B2BGlobalRateManager';
import B2BRoomRateManager from './B2BRoomRateManager';

interface Props {
  property: HotelPartnerProperty;
  onNext?: () => void;
  onBack?: () => void;
}

type Tab = 'IDENTITY' | 'ROOM' | 'GLOBAL' | 'SETTLEMENT' | 'VALIDITY' | 'DOCUMENTS' | 'PREVIEW';

const emptyContract: Partial<B2BContract> = {
  contract_number: '',
  counterparty_name: '',
  pricing_mode: 'ROOM_WISE',
  shambit_profit_margin: '',
  profit_margin_type: 'PERCENTAGE',
  commission_type: 'PERCENTAGE',
  value: '',
  tax_application: 'PRE_TAX',
  agent_deduction_strategy: 'DEDUCT_FROM_PROFIT',
  hotel_gst_rate: '12.00',
  shambit_profit_gst_rate: '18.00',
  agent_commission_gst_rate: '18.00',
  effective_from: null,
  effective_to: null,
  change_reason: '',
  is_active: false,
  room_rate_plans: [],
  global_rate_plans: [],
  documents: [],
  missing_requirements: [],
};

function normalizeContractDates(contract: B2BContract): Partial<B2BContract> {
  return {
    ...contract,
    effective_from: contract.effective_from?.slice(0, 10) || null,
    effective_to: contract.effective_to?.slice(0, 10) || null,
  };
}

function includesRoomMode(mode?: B2BPricingMode) {
  return mode === 'ROOM_WISE' || mode === 'BOTH';
}

function includesGlobalMode(mode?: B2BPricingMode) {
  return mode === 'GLOBAL' || mode === 'BOTH';
}

function validatePricingDraft(draft: Partial<B2BContract>): string[] {
  const errors: string[] = [];
  const activeRoomPlans = (draft.room_rate_plans || []).filter(plan => plan.is_active);
  const activeGlobalPlans = (draft.global_rate_plans || []).filter(plan => plan.is_active);
  const roomIds = activeRoomPlans.map(plan => Number(plan.room_type));
  const globalNames = activeGlobalPlans.map(plan => plan.name.trim().toLowerCase());

  if (!draft.pricing_mode) errors.push('Select the contract pricing mode.');
  if (!(Number(draft.shambit_profit_margin) > 0)) errors.push('ShamBit margin must be greater than zero.');
  if (draft.value === '' || draft.value == null || Number(draft.value) < 0) errors.push('Agent TAC / commission must be zero or greater.');

  if (includesRoomMode(draft.pricing_mode)) {
    if (!activeRoomPlans.length) errors.push('Room-wise mode requires at least one active room rate.');
    if (new Set(roomIds).size !== roomIds.length) errors.push('A room can have only one active room-wise rate.');
    activeRoomPlans.forEach((plan, index) => {
      if (!plan.room_type) errors.push(`Room-wise rate ${index + 1}: room type is required.`);
      if (!(Number(plan.value) > 0)) errors.push(`Room-wise rate ${index + 1}: value must be greater than zero.`);
    });
  }

  if (includesGlobalMode(draft.pricing_mode)) {
    if (!activeGlobalPlans.length) errors.push('Global mode requires at least one active global rate.');
    if (new Set(globalNames).size !== globalNames.length) errors.push('Active global rate names must be unique.');
    activeGlobalPlans.forEach((plan, index) => {
      if (!plan.name.trim()) errors.push(`Global rate ${index + 1}: plan name is required.`);
      if (!(Number(plan.hotel_net_rate_per_room_per_night) > 0)) errors.push(`Global rate ${index + 1}: net rate must be greater than zero.`);
      if (!(Number(plan.min_rooms) >= 1)) errors.push(`Global rate ${index + 1}: minimum rooms must be at least one.`);
      if (plan.max_rooms != null && Number(plan.max_rooms) < Number(plan.min_rooms)) errors.push(`Global rate ${index + 1}: maximum rooms cannot be less than minimum rooms.`);
      if (plan.allocation_mode === 'MANUAL_CONFIRMATION' && !(Number(plan.confirmation_sla_minutes) >= 5 && Number(plan.confirmation_sla_minutes) <= 1440)) errors.push(`Global rate ${index + 1}: confirmation SLA must be between 5 and 1440 minutes.`);
      if (!plan.eligible_rooms?.length) errors.push(`Global rate ${index + 1}: select at least one eligible room.`);
    });
  }

  return errors;
}

function validateDraft(draft: Partial<B2BContract>, requireSignedDocument: boolean): string[] {
  const errors: string[] = [];
  if (!draft.contract_number?.trim()) errors.push('Contract number is required.');
  if (!draft.counterparty_name?.trim()) errors.push('Hotel owner / legal counterparty is required.');
  errors.push(...validatePricingDraft(draft));
  if (!draft.effective_from || !draft.effective_to) errors.push('Contract start and end dates are required.');
  if (draft.effective_from && draft.effective_to && draft.effective_to < draft.effective_from) {
    errors.push('Contract end date cannot be before its start date.');
  }
  if (!draft.change_reason?.trim()) errors.push('A change reason / negotiation note is required.');

  if (requireSignedDocument && !(draft.documents || []).some(doc => doc.document_type === 'SIGNED_CONTRACT')) {
    errors.push('Upload the signed contract before activation.');
  }
  return errors;
}

class DraftValidationError extends Error {
  constructor(readonly messages: string[]) {
    super(messages[0] || 'The contract contains invalid or missing information.');
  }
}

function operationErrors(error: unknown): string[] {
  if (error instanceof DraftValidationError) return error.messages;
  if (error instanceof Error && !axios.isAxiosError(error)) return [error.message];
  return apiErrors(error);
}

function errorTab(message: string): Tab | null {
  const normalized = message.toLowerCase();
  if (normalized.includes('contract number') || normalized.includes('counterparty') || normalized.includes('pricing mode')) return 'IDENTITY';
  if (normalized.includes('room-wise') || normalized.startsWith('room')) return 'ROOM';
  if (normalized.includes('global rate') || normalized.includes('global mode')) return 'GLOBAL';
  if (normalized.includes('margin') || normalized.includes('commission') || normalized.includes('agent tac')) return 'SETTLEMENT';
  if (normalized.includes('start date') || normalized.includes('end date') || normalized.includes('tax')) return 'VALIDITY';
  if (normalized.includes('signed contract') || normalized.includes('document') || normalized.includes('file')) return 'DOCUMENTS';
  return null;
}

function apiErrors(error: unknown): string[] {
  if (!axios.isAxiosError(error)) return ['The contract could not be saved.'];
  const data = error.response?.data;
  if (!data) return ['The contract could not be saved.'];
  if (typeof data === 'string') return [data];
  const messages: string[] = [];
  const append = (field: string, value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(item => append(field, item));
      return;
    }
    if (value && typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(([nestedField, nestedValue]) => append(nestedField, nestedValue));
      return;
    }
    if (typeof value === 'string') {
      const label = field === 'non_field_errors' || field === 'error'
        ? 'Contract'
        : field.replaceAll('_', ' ').replace(/^./, character => character.toUpperCase());
      messages.push(`${label}: ${value}`);
    }
  };
  const record = data as Record<string, unknown>;
  if (record.details && typeof record.details === 'object') append('Contract', record.details);
  else Object.entries(record).forEach(([field, value]) => field !== 'status_code' && append(field, value));
  return messages.length ? messages : ['The contract could not be saved.'];
}

export default function B2BContractManager({ property, onNext, onBack }: Props) {
  const hotelId = property.promoted_hotel;
  const [draft, setDraft] = useState<Partial<B2BContract>>(emptyContract);
  const [contractId, setContractId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('IDENTITY');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<B2BPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<'SIGNED_CONTRACT' | 'ADDENDUM' | 'OTHER'>('SIGNED_CONTRACT');
  const [signedAt, setSignedAt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [showAmendment, setShowAmendment] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState('');
  const [amending, setAmending] = useState(false);
  const [statusReferenceTime] = useState(() => Date.now());

  const fetchContract = useCallback(async () => {
    if (!hotelId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const existing = await adminPropertyService.getB2BContract(hotelId);
      if (existing) {
        setContractId(existing.id || null);
        setDraft({ ...emptyContract, ...normalizeContractDates(existing) });
      }
    } catch (error) {
      setErrors(apiErrors(error));
      toast.error('Failed to load the B2B contract. No local defaults were applied.');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => { void fetchContract(); }, [fetchContract]);

  const localErrors = useMemo(() => validateDraft(draft, draft.is_active === true), [draft]);
  const displayedErrors = errors.length ? errors : localErrors;
  const update = (values: Partial<B2BContract>) => {
    setErrors([]);
    setDraft(previous => ({ ...previous, ...values }));
  };

  const tabs = useMemo(() => {
    const values: Array<{ id: Tab; label: string }> = [{ id: 'IDENTITY', label: '1. Contract & Mode' }];
    if (includesRoomMode(draft.pricing_mode)) values.push({ id: 'ROOM', label: '2. Room-wise Rates' });
    if (includesGlobalMode(draft.pricing_mode)) values.push({ id: 'GLOBAL', label: includesRoomMode(draft.pricing_mode) ? '3. Global Rates' : '2. Global Rates' });
    values.push(
      { id: 'SETTLEMENT', label: 'Settlement' },
      { id: 'VALIDITY', label: 'Validity & Tax' },
      { id: 'DOCUMENTS', label: 'Documents' },
      { id: 'PREVIEW', label: 'Final Preview' },
    );
    return values;
  }, [draft.pricing_mode]);

  useEffect(() => {
    if (!tabs.some(tab => tab.id === activeTab)) setActiveTab('IDENTITY');
  }, [activeTab, tabs]);

  const persistContract = async (activate: boolean): Promise<B2BContract> => {
    const validation = validateDraft(draft, activate);
    if (validation.length) {
      setErrors(validation);
      throw new DraftValidationError(validation);
    }
    if (!hotelId) throw new Error('Property must be approved before saving its contract.');

    const payload: Partial<B2BContract> = {
      ...draft,
      hotel: hotelId,
      is_active: activate,
      effective_from: draft.effective_from ? `${draft.effective_from.slice(0, 10)}T00:00:00` : null,
      effective_to: draft.effective_to ? `${draft.effective_to.slice(0, 10)}T23:59:59` : null,
    };
    delete payload.documents;
    delete payload.missing_requirements;
    return contractId
      ? adminPropertyService.updateB2BContract(contractId, payload)
      : adminPropertyService.createB2BContract(payload);
  };

  const save = async (activate: boolean) => {
    try {
      setSaving(true);
      setErrors([]);
      const saved = await persistContract(activate);
      setContractId(saved.id || null);
      setDraft({ ...emptyContract, ...normalizeContractDates(saved) });
      toast.success(activate ? 'Contract activated and published to B2B agents.' : 'Validated draft saved. Upload the signed contract before activation.');
      if (activate && onNext) onNext();
    } catch (error) {
      const messages = operationErrors(error);
      setErrors(messages);
      toast.error(messages[0]);
    } finally {
      setSaving(false);
    }
  };

  const suspend = async () => {
    if (!contractId) return;
    try {
      setSaving(true);
      const saved = await adminPropertyService.updateB2BContract(contractId, { is_active: false, change_reason: draft.change_reason });
      setDraft({ ...emptyContract, ...normalizeContractDates(saved) });
      toast.success('Contract suspended. It is no longer available to B2B agents.');
    } catch (error) {
      const messages = apiErrors(error);
      setErrors(messages);
      toast.error(messages[0]);
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async () => {
    if (!documentFile) return;
    if (documentFile.size > 8 * 1024 * 1024) {
      setErrors(['Document exceeds the maximum file size of 8 MB.']);
      return;
    }
    try {
      setUploading(true);
      setErrors([]);
      const saved = await persistContract(false);
      if (!saved.id) throw new Error('The contract was saved without an identifier. Document upload was stopped.');
      const uploadedDocument = await adminPropertyService.uploadB2BContractDocument(saved.id, documentFile, documentType, signedAt || undefined, draft.change_reason?.trim());
      setContractId(saved.id);
      setDraft({
        ...emptyContract,
        ...normalizeContractDates(saved),
        documents: [...(saved.documents || []), uploadedDocument],
      });
      setDocumentFile(null);
      toast.success('Contract saved, then document uploaded and checksummed.');
    } catch (error) {
      const messages = operationErrors(error);
      setErrors(messages);
      toast.error(messages[0]);
    } finally {
      setUploading(false);
    }
  };

  const downloadDocument = async (documentId: number, fileName: string) => {
    try {
      const blob = await adminPropertyService.downloadB2BContractDocument(documentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      const messages = apiErrors(error);
      setErrors(messages);
      toast.error(messages[0]);
    }
  };

  const downloadSettledPdf = async (targetId = contractId) => {
    if (!targetId) return;
    try {
      setPdfDownloading(true);
      setErrors([]);
      const blob = await adminPropertyService.downloadB2BSettledContractPdf(targetId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${draft.contract_number || `b2b-contract-${targetId}`}-settled.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      const messages = apiErrors(error);
      setErrors(messages);
      toast.error(messages[0]);
    } finally {
      setPdfDownloading(false);
    }
  };

  const beginAmendment = async () => {
    if (!contractId) return;
    if (amendmentReason.trim().length < 10) {
      setErrors(['Give a meaningful amendment reason of at least 10 characters.']);
      return;
    }
    try {
      setAmending(true);
      setErrors([]);
      const amendment = await adminPropertyService.beginB2BContractAmendment(contractId, amendmentReason.trim());
      setContractId(amendment.id || null);
      setDraft({ ...emptyContract, ...normalizeContractDates(amendment) });
      setShowAmendment(false);
      setAmendmentReason('');
      setActiveTab('IDENTITY');
      toast.success('Controlled amendment draft created. The finalized contract remains unchanged and published until the amendment is activated.');
    } catch (error) {
      const messages = apiErrors(error);
      setErrors(messages);
      toast.error(messages[0]);
    } finally {
      setAmending(false);
    }
  };

  const deleteDocument = async (documentId: number) => {
    if (!draft.change_reason?.trim()) {
      const messages = ['Enter a change / negotiation note before removing a contract document.'];
      setErrors(messages);
      toast.error(messages[0]);
      return;
    }
    try {
      await adminPropertyService.deleteB2BContractDocument(documentId, draft.change_reason.trim());
      setDraft(previous => ({
        ...previous,
        version: (previous.version || 1) + 1,
        documents: (previous.documents || []).filter(document => document.id !== documentId),
      }));
      toast.success('Draft document removed and the reason was added to the audit record.');
    } catch (error) {
      const messages = apiErrors(error);
      setErrors(messages);
      toast.error(messages[0]);
    }
  };

  const loadPreview = async () => {
    const validation = validatePricingDraft(draft);
    if (validation.length) {
      setErrors(validation);
      setPreview(null);
      return;
    }
    if (!hotelId) return;
    try {
      setPreviewLoading(true);
      setErrors([]);
      const result = await adminPropertyService.getB2BPreview({
        hotel_id: hotelId,
        pricing_mode: draft.pricing_mode as B2BPricingMode,
        shambit_discount_rate: draft.shambit_discount_rate || {},
        shambit_profit_margin: draft.shambit_profit_margin || '',
        profit_margin_type: draft.profit_margin_type as ProfitMarginType,
        commission_type: draft.commission_type as B2BCommissionType,
        value: draft.value || '',
        tax_application: draft.tax_application as TaxApplicationType,
        agent_deduction_strategy: draft.agent_deduction_strategy as AgentDeductionStrategy,
        hotel_gst_rate: draft.hotel_gst_rate || '',
        shambit_profit_gst_rate: draft.shambit_profit_gst_rate || '',
        agent_commission_gst_rate: draft.agent_commission_gst_rate || '',
        room_rate_plans: draft.room_rate_plans || [],
        global_rate_plans: draft.global_rate_plans || [],
      });
      setPreview(result);
    } catch (error) {
      setPreview(null);
      setErrors(apiErrors(error));
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'PREVIEW') void loadPreview();
    // Preview is intentionally refreshed only when the admin opens the review step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  if (loading) return <Card><CardContent className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></CardContent></Card>;
  if (!hotelId) return <Card><CardContent className="p-12 text-center"><AlertCircle className="mx-auto mb-3 text-amber-500" /><h3 className="font-bold">Approve this property before creating its B2B contract.</h3></CardContent></Card>;

  if (draft.published_at && contractId) {
    const startsAt = draft.effective_from ? new Date(draft.effective_from).getTime() : null;
    const endsAt = draft.effective_to ? new Date(draft.effective_to).getTime() : null;
    const publicationLabel = !draft.is_active
      ? 'Finalized historical version — not published to agents'
      : startsAt && startsAt > statusReferenceTime
        ? 'Finalized — scheduled for the ShamBit B2B Agent Portal'
        : endsAt && endsAt < statusReferenceTime
          ? 'Finalized — tenure expired and not bookable'
          : 'Published to the ShamBit B2B Agent Portal';
    return (
      <div className="space-y-6">
        <Card className="border-emerald-200 bg-emerald-50/40"><CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2"><ShieldCheck className="text-emerald-700" /><h2 className="text-xl font-black">Finalized B2B contract — locked</h2></div>
              <p className="mt-2 max-w-3xl text-sm text-gray-600">This legal record cannot be edited, replaced or have documents removed. Pricing changes require a separately audited amendment version.</p>
              <p className="mt-3 text-sm font-bold text-gray-900">{draft.contract_number} · {draft.counterparty_name}</p>
              <p className="mt-1 text-xs font-semibold text-gray-600">Tenure: {draft.effective_from ? new Date(draft.effective_from).toLocaleDateString() : '—'} to {draft.effective_to ? new Date(draft.effective_to).toLocaleDateString() : '—'}</p>
              <p className="mt-1 text-xs font-semibold text-gray-600">Version {draft.version || 1} · finalized {new Date(draft.published_at).toLocaleString()} by {draft.published_by_name || '—'}</p>
            </div>
            <div className={`rounded-xl border px-4 py-3 text-sm font-black ${draft.is_active ? 'border-emerald-300 bg-white text-emerald-800' : 'border-gray-300 bg-white text-gray-700'}`}>{publicationLabel}</div>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button type="button" onClick={() => downloadSettledPdf()} disabled={pdfDownloading}>{pdfDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Download settled contract PDF</Button>
            <Button type="button" variant="outline" onClick={() => setShowAmendment(value => !value)}>Request controlled amendment</Button>
            <Button type="button" variant="outline" onClick={onBack}>Back</Button>
          </div>
        </CardContent></Card>

        {(draft.documents || []).length > 0 && <Card><CardContent className="p-6 md:p-8"><h3 className="font-black">Controlling signed documents</h3><div className="mt-4 space-y-3">{(draft.documents || []).map(document => <div key={document.id} className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 p-4 md:flex-row md:items-center"><div><p className="font-bold">{document.original_name}</p><p className="mt-1 text-xs text-gray-500">{document.document_type.replaceAll('_', ' ')} · SHA-256 {document.sha256}</p></div><Button type="button" variant="outline" size="sm" onClick={() => downloadDocument(document.id, document.original_name)}><Download className="mr-2 h-4 w-4" />Download</Button></div>)}</div></CardContent></Card>}

        {showAmendment && <Card className="border-red-300"><CardContent className="p-6 md:p-8">
          <div className="flex gap-3"><AlertCircle className="mt-0.5 shrink-0 text-red-700" /><div><h3 className="font-black text-red-900">Warning: this starts a new legal contract version</h3><p className="mt-1 text-sm text-red-800">The finalized version stays unchanged and remains the published B2B source. The amendment will be a draft with copied pricing, no copied signed document, and must be reviewed, signed, uploaded and activated separately. Your reason, identity and timestamp are recorded.</p></div></div>
          <Field label="Required amendment / negotiation reason"><textarea value={amendmentReason} onChange={event => setAmendmentReason(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-red-300 bg-white p-3 text-sm" placeholder="Describe exactly what must change, why, and who authorized renegotiation." /></Field>
          {errors.length > 0 && <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{errors.join(' ')}</div>}
          <div className="mt-4 flex gap-3"><Button type="button" onClick={beginAmendment} disabled={amending}>{amending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}Create amendment draft</Button><Button type="button" variant="outline" onClick={() => setShowAmendment(false)}>Cancel</Button></div>
        </CardContent></Card>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {draft.amendment_of && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900"><p className="font-black">Controlled amendment draft of finalized contract #{draft.amendment_of}</p><p className="mt-1">The original remains unchanged and published to B2B agents until this amendment is fully validated, signed and activated.</p><Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => downloadSettledPdf(draft.amendment_of || null)} disabled={pdfDownloading}><Download className="mr-2 h-4 w-4" />Download original settled PDF</Button></div>}
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2"><ShieldCheck className="text-blue-600" /><h2 className="text-xl font-black">B2B Contract Control</h2></div>
              <p className="mt-1 text-sm text-gray-500">One governed contract, explicit pricing modes, complete audit ownership and no pricing fallback.</p>
              {contractId && <p className="mt-2 text-xs font-semibold text-gray-500">Version {draft.version || 1} · Created {draft.created_at ? new Date(draft.created_at).toLocaleString() : '—'} by {draft.created_by_name || '—'} · Last changed {draft.updated_at ? new Date(draft.updated_at).toLocaleString() : '—'} by {draft.updated_by_name || '—'}</p>}
            </div>
            <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${draft.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              {draft.is_active ? 'ACTIVE — published to agents' : 'DRAFT / SUSPENDED — not published'}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-2">
        {tabs.map(tab => {
          const issueCount = displayedErrors.filter(error => errorTab(error) === tab.id).length;
          return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{tab.label}{issueCount > 0 && <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === tab.id ? 'bg-white text-red-700' : 'bg-red-100 text-red-700'}`}>{issueCount}</span>}</button>;
        })}
      </div>

      <Card className="border-gray-200"><CardContent className="p-6 md:p-8">
        {displayedErrors.length > 0 && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" /><div className="min-w-0 flex-1"><h3 className="font-black text-red-900">Correct the following before saving or uploading</h3><p className="mt-1 text-xs font-medium text-red-700">Each message shows the exact missing or invalid information. Open its section to correct it.</p></div></div>
          <div className="mt-4 space-y-2">{displayedErrors.map((error, index) => { const target = errorTab(error); return <div key={`${error}-${index}`} className="flex flex-col justify-between gap-2 rounded-xl bg-white p-3 text-sm font-semibold text-red-900 sm:flex-row sm:items-center"><span>{error}</span>{target && target !== activeTab && tabs.some(tab => tab.id === target) && <button type="button" className="shrink-0 text-left text-xs font-black text-blue-700 underline" onClick={() => setActiveTab(target)}>Open {tabs.find(tab => tab.id === target)?.label}</button>}</div>; })}</div>
        </div>}

        <div className="mb-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <Field label="Required change / negotiation note"><textarea value={draft.change_reason || ''} onChange={event => update({ change_reason: event.target.value })} rows={3} className={`w-full rounded-xl border bg-white p-3 text-sm ${draft.change_reason?.trim() ? 'border-amber-200' : 'border-red-400 ring-2 ring-red-100'}`} placeholder="State what is being created, corrected, uploaded or removed, and why." /></Field>
          <p className="mt-2 text-xs font-medium text-amber-800">This note is saved in the contract audit history and is required for create, edit, upload, removal and activation actions.</p>
        </div>

        {activeTab === 'IDENTITY' && <div className="space-y-7">
          <div><h3 className="text-lg font-black">Contract identity and pricing mode</h3><p className="text-sm text-gray-500">The selected mode controls exactly what agents can see and book.</p></div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Contract number"><Input value={draft.contract_number || ''} onChange={event => update({ contract_number: event.target.value })} placeholder="e.g. RAM-2026-B2B-001" /></Field>
            <Field label="Hotel owner / legal counterparty"><Input value={draft.counterparty_name || ''} onChange={event => update({ counterparty_name: event.target.value })} placeholder="Legal name from signed agreement" /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {([
              ['ROOM_WISE', 'Room-wise only', 'Each enabled room has its own negotiated rule.'],
              ['GLOBAL', 'Global / bulk only', 'Named bulk plans apply only to selected room pools.'],
              ['BOTH', 'Both, kept separate', 'Agents choose either product; neither overrides the other.'],
            ] as const).map(([mode, title, description]) => <button key={mode} type="button" onClick={() => update({ pricing_mode: mode })} className={`rounded-2xl border p-5 text-left ${draft.pricing_mode === mode ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-gray-200 bg-white'}`}><span className="font-black text-gray-900">{title}</span><span className="mt-2 block text-xs leading-5 text-gray-500">{description}</span></button>)}
          </div>
        </div>}

        {activeTab === 'ROOM' && <B2BRoomRateManager property={property} contract={draft} onChange={update} />}
        {activeTab === 'GLOBAL' && <B2BGlobalRateManager property={property} contract={draft} onChange={update} />}

        {activeTab === 'SETTLEMENT' && <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <SelectField label="ShamBit margin type" value={draft.profit_margin_type || ''} onChange={value => update({ profit_margin_type: value as ProfitMarginType })} options={[['PERCENTAGE', 'Percentage (%)'], ['FLAT', 'Flat per room/night (₹)']]} />
          <Field label="ShamBit margin"><Input type="number" min="0" step="0.01" value={draft.shambit_profit_margin || ''} onChange={event => update({ shambit_profit_margin: event.target.value })} /></Field>
          <SelectField label="Agent TAC type" value={draft.commission_type || ''} onChange={value => update({ commission_type: value as B2BCommissionType })} options={[['PERCENTAGE', 'Percentage (%)'], ['FLAT', 'Flat per room/night (₹)']]} />
          <Field label="Agent TAC"><Input type="number" min="0" step="0.01" value={draft.value || ''} onChange={event => update({ value: event.target.value })} /></Field>
          <div className="md:col-span-2"><SelectField label="Agent deduction strategy" value={draft.agent_deduction_strategy || ''} onChange={value => update({ agent_deduction_strategy: value as AgentDeductionStrategy })} options={[['DEDUCT_FROM_PROFIT', 'Deduct TAC from ShamBit profit'], ['ADD_TO_SELLING_PRICE', 'Add TAC to B2B selling price']]} /></div>
        </div>}

        {activeTab === 'VALIDITY' && <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2"><Field label="Contract start date"><Input type="date" value={draft.effective_from || ''} onChange={event => update({ effective_from: event.target.value || null })} /></Field><Field label="Contract end date"><Input type="date" value={draft.effective_to || ''} onChange={event => update({ effective_to: event.target.value || null })} /></Field></div>
          <div className="grid gap-5 md:grid-cols-4"><SelectField label="Tax application" value={draft.tax_application || ''} onChange={value => update({ tax_application: value as TaxApplicationType })} options={[['PRE_TAX', 'Apply on pre-tax base'], ['POST_TAX', 'Apply after hotel tax']]} /><Field label="Hotel GST %"><Input type="number" min="0" max="100" value={draft.hotel_gst_rate || ''} onChange={event => update({ hotel_gst_rate: event.target.value })} /></Field><Field label="ShamBit GST %"><Input type="number" min="0" max="100" value={draft.shambit_profit_gst_rate || ''} onChange={event => update({ shambit_profit_gst_rate: event.target.value })} /></Field><Field label="Agent TAC GST %"><Input type="number" min="0" max="100" value={draft.agent_commission_gst_rate || ''} onChange={event => update({ agent_commission_gst_rate: event.target.value })} /></Field></div>
        </div>}

        {activeTab === 'DOCUMENTS' && <div className="space-y-6">
          <div><h3 className="text-lg font-black">Signed agreement and addenda</h3><p className="text-sm text-gray-500">PDF, JPG or PNG only. Maximum 8 MB. Active-contract documents are immutable.</p></div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-800">Uploading first validates and saves every contract section, then attaches the file. No form values are discarded.</div>
          <div className="grid gap-4 md:grid-cols-4"><SelectField label="Document type" value={documentType} onChange={value => setDocumentType(value as typeof documentType)} options={[['SIGNED_CONTRACT', 'Signed contract'], ['ADDENDUM', 'Addendum'], ['OTHER', 'Other evidence']]} /><Field label="Signed date"><Input type="date" value={signedAt} onChange={event => setSignedAt(event.target.value)} /></Field><div className="md:col-span-2"><Field label="File"><Input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={draft.is_active} onChange={event => setDocumentFile(event.target.files?.[0] || null)} /></Field></div></div>
          {documentFile && <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">Selected file: {documentFile.name} · {(documentFile.size / 1024 / 1024).toFixed(2)} MB</p>}
          <Button type="button" disabled={!documentFile || uploading || draft.is_active} onClick={uploadDocument}>{uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}{uploading ? 'Saving contract & uploading…' : 'Save contract & upload document'}</Button>
          <div className="space-y-3">{(draft.documents || []).map(document => <div key={document.id} className="flex flex-col justify-between gap-4 rounded-xl border border-gray-200 p-4 md:flex-row md:items-center"><div className="flex items-center gap-3"><FileText className="text-blue-600" /><div><p className="font-bold">{document.original_name}</p><p className="text-xs text-gray-500">{document.document_type.replaceAll('_', ' ')} · {(document.file_size / 1024 / 1024).toFixed(2)} MB · uploaded {new Date(document.uploaded_at).toLocaleString()} by {document.uploaded_by_name || '—'}</p><p className="mt-1 font-mono text-[10px] text-gray-400">SHA-256 {document.sha256}</p></div></div><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => downloadDocument(document.id, document.original_name)}><Download className="mr-2 h-4 w-4" />Download</Button>{!draft.is_active && <Button type="button" variant="outline" size="sm" onClick={() => deleteDocument(document.id)} className="text-red-700"><Trash2 className="mr-2 h-4 w-4" />Remove</Button>}</div></div>)}{!(draft.documents || []).length && <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">No documents uploaded.</p>}</div>
        </div>}

        {activeTab === 'PREVIEW' && <div className="space-y-7">
          <div className="flex items-center justify-between"><div><h3 className="text-lg font-black">Final settled rates</h3><p className="text-sm text-gray-500">Room-wise and global products are shown in separate sections.</p></div><Button variant="outline" onClick={loadPreview} disabled={previewLoading}>{previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh preview'}</Button></div>
          {includesRoomMode(draft.pricing_mode) && <PreviewTable title="Room-wise settled rates" rows={(preview?.matrices || []).flat()} />}
          {includesGlobalMode(draft.pricing_mode) && <div><h4 className="mb-3 font-black">Global / bulk settled rates</h4><div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><thead className="bg-gray-50 text-left"><tr><th className="p-3">Plan</th><th className="p-3 text-right">Hotel net + tax</th><th className="p-3 text-right">ShamBit profit</th><th className="p-3 text-right">Agent TAC</th><th className="p-3 text-right">Final B2B rate</th></tr></thead><tbody>{(preview?.global_matrices || []).map(row => <tr key={row.id} className="border-t"><td className="p-3 font-bold">{row.name}</td><td className="p-3 text-right">₹{Number(row.hotel_net_total).toFixed(2)}</td><td className="p-3 text-right">₹{Number(row.profit_total).toFixed(2)}</td><td className="p-3 text-right">₹{Number(row.agent_tac_total).toFixed(2)}</td><td className="p-3 text-right font-black text-emerald-700">₹{Number(row.final_b2b_selling_total).toFixed(2)}</td></tr>)}{!preview?.global_matrices?.length && <tr><td colSpan={5} className="p-8 text-center text-gray-500">No valid global rates to preview.</td></tr>}</tbody></table></div></div>}
        </div>}
      </CardContent></Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <div className="flex flex-wrap gap-3">
          {draft.is_active && <Button variant="outline" disabled={saving} onClick={suspend}>Suspend contract</Button>}
          {!draft.is_active && <Button variant="outline" disabled={saving} onClick={() => save(false)}><Save className="mr-2 h-4 w-4" />Save validated draft</Button>}
          <Button disabled={saving || (draft.is_active && localErrors.length > 0)} onClick={() => save(true)}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}{draft.is_active ? 'Save active contract' : 'Activate & publish'}</Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-xs font-black uppercase tracking-wide text-gray-500">{label}</span>{children}</label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<readonly [string, string]> }) {
  return <Field label={label}><select value={value} onChange={event => onChange(event.target.value)} className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></Field>;
}

function PreviewTable({ title, rows }: { title: string; rows: B2BPreviewResponse['matrices'][number] }) {
  return <div><h4 className="mb-3 font-black">{title}</h4><div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><thead className="bg-gray-50 text-left"><tr><th className="p-3">Room</th><th className="p-3">Meal plan</th><th className="p-3 text-right">B2C reference</th><th className="p-3 text-right">Hotel net</th><th className="p-3 text-right">ShamBit profit</th><th className="p-3 text-right">Agent TAC</th><th className="p-3 text-right">Final B2B rate</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t"><td className="p-3 font-bold">{row.room_type}</td><td className="p-3">{row.meal_plan}</td><td className="p-3 text-right">₹{Number(row.b2c_price).toFixed(2)}</td><td className="p-3 text-right">₹{Number(row.hotel_net).toFixed(2)}</td><td className="p-3 text-right">₹{Number(row.profit).toFixed(2)}</td><td className="p-3 text-right">₹{Number(row.agent_tac).toFixed(2)}</td><td className="p-3 text-right font-black text-emerald-700">₹{Number(row.final_b2b_selling).toFixed(2)}</td></tr>)}{!rows.length && <tr><td colSpan={7} className="p-8 text-center text-gray-500">No valid room-wise rates to preview.</td></tr>}</tbody></table></div></div>;
}
