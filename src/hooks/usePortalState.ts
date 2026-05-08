import { useState, useCallback, useRef } from 'react';
import type { PortalState, FormData, SignatureRecord, PaymentRecord, BookingRecord } from '../types/portal';
import { createSubmission, updateDetails, updateSignature, updatePayment, updateBooking } from '../lib/supabase';

const STORAGE_KEY = 'ssanz_payment_redirect';

const INITIAL_FORM: FormData = {
  fullName: '',
  email: '',
  phone: '',
  company: '',
  website: '',
  role: '',
  industry: '',
  referral: '',
  packageId: '',
};

const INITIAL_STATE: PortalState = {
  step: 1,
  formData: INITIAL_FORM,
  signature: null,
  payment: null,
  booking: null,
};

interface PaymentRedirectState {
  submissionId: string;
  portalType: 'b2b' | 'vc';
  formData: FormData;
  signature: SignatureRecord | null;
  completedSteps: string[];
  redirectedAt: number;
}

function tryRestoreFromPaymentRedirect(portalType: 'b2b' | 'vc'): {
  state: PortalState;
  savedSubmissionId: string;
  savedCompletedSteps: string[];
} | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') !== 'success') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const saved: PaymentRedirectState = JSON.parse(raw);

    if (saved.portalType !== portalType) return null;

    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - saved.redirectedAt > fiveMinutes) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    localStorage.removeItem(STORAGE_KEY);

    // Clean up URL params
    const url = new URL(window.location.href);
    url.searchParams.delete('payment');
    window.history.replaceState({}, '', url.pathname);

    return {
      state: {
        step: 3,
        formData: saved.formData,
        signature: saved.signature,
        payment: null,
        booking: null,
      },
      savedSubmissionId: saved.submissionId,
      savedCompletedSteps: saved.completedSteps,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function usePortalState(portalType: 'b2b' | 'vc', packages: { id: string; name: string; setupFee: number; monthlyFee: number }[]) {
  const [restored] = useState(() => tryRestoreFromPaymentRedirect(portalType));
  const [state, setState] = useState<PortalState>(restored?.state || INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submissionId = useRef<string | null>(restored?.savedSubmissionId || null);
  const completedSteps = useRef<Set<string>>(new Set(restored?.savedCompletedSteps || []));

  const goTo = useCallback((step: number) => {
    setState(prev => ({ ...prev, step }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const updateFormData = useCallback((partial: Partial<FormData>) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...partial },
    }));
  }, []);

  // Step 1 → 2: Create or update submission in Supabase
  const submitDetails = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const pkg = packages.find(p => p.id === state.formData.packageId);
      if (submissionId.current) {
        const ok = await updateDetails(
          submissionId.current,
          state.formData,
          pkg?.name || '',
          pkg?.setupFee || 0,
          pkg?.monthlyFee || 0,
        );
        if (!ok) { setError('Failed to save. Please try again.'); return; }
      } else {
        const id = await createSubmission(
          portalType,
          state.formData,
          pkg?.name || '',
          pkg?.setupFee || 0,
          pkg?.monthlyFee || 0,
        );
        if (!id) { setError('Failed to save. Please try again.'); return; }
        submissionId.current = id;
        completedSteps.current.add('details');
      }
      goTo(2);
    } catch (err) {
      console.error('Submit details failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [state.formData, portalType, packages, goTo]);

  // Step 2 → 3: Save signature
  const submitSignature = useCallback(async (sig: SignatureRecord) => {
    setSaving(true);
    setError(null);
    try {
      setState(prev => ({ ...prev, signature: sig }));
      if (submissionId.current) {
        const isFirstTime = !completedSteps.current.has('signed');
        const ok = await updateSignature(submissionId.current, sig, isFirstTime);
        if (!ok) { setError('Failed to save signature. Please try again.'); return; }
        completedSteps.current.add('signed');
      }
      goTo(3);
    } catch (err) {
      console.error('Submit signature failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [goTo]);

  // Step 3 → 4: Save payment
  const submitPayment = useCallback(async (payment: PaymentRecord) => {
    setSaving(true);
    setError(null);
    try {
      setState(prev => ({ ...prev, payment }));
      if (submissionId.current) {
        const isFirstTime = !completedSteps.current.has('paid');
        const ok = await updatePayment(submissionId.current, payment, isFirstTime);
        if (!ok) { setError('Failed to save payment. Please try again.'); return; }
        completedSteps.current.add('paid');
      }
      goTo(4);
    } catch (err) {
      console.error('Submit payment failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [goTo]);

  // Step 4: Save booking
  const submitBooking = useCallback(async (booking: BookingRecord) => {
    setSaving(true);
    setError(null);
    try {
      setState(prev => ({ ...prev, booking }));
      if (submissionId.current) {
        const isFirstTime = !completedSteps.current.has('booked');
        const ok = await updateBooking(submissionId.current, booking, isFirstTime);
        if (!ok) { setError('Failed to save booking. Please try again.'); return; }
        completedSteps.current.add('booked');
      }
    } catch (err) {
      console.error('Submit booking failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }, []);

  const persistForPayment = useCallback(() => {
    if (!submissionId.current) return;
    const data: PaymentRedirectState = {
      submissionId: submissionId.current,
      portalType,
      formData: state.formData,
      signature: state.signature,
      completedSteps: Array.from(completedSteps.current),
      redirectedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [portalType, state.formData, state.signature]);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    submissionId.current = null;
    completedSteps.current = new Set();
  }, []);

  return {
    state,
    saving,
    error,
    restoredFromPayment: !!restored,
    goTo,
    updateFormData,
    submitDetails,
    submitSignature,
    submitPayment,
    submitBooking,
    persistForPayment,
    reset,
  };
}
