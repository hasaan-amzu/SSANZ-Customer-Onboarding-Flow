import { useState, useCallback, useRef } from 'react';
import type { PortalState, FormData, SignatureRecord, PaymentRecord, BookingRecord } from '../types/portal';
import { createSubmission, updateDetails, updateSignature, updatePayment, updateBooking } from '../lib/supabase';

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

export function usePortalState(portalType: 'b2b' | 'vc', packages: { id: string; name: string; setupFee: number; monthlyFee: number }[]) {
  const [state, setState] = useState<PortalState>(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const submissionId = useRef<string | null>(null);
  const completedSteps = useRef<Set<string>>(new Set());

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
    try {
      const pkg = packages.find(p => p.id === state.formData.packageId);
      if (submissionId.current) {
        await updateDetails(
          submissionId.current,
          state.formData,
          pkg?.name || '',
          pkg?.setupFee || 0,
          pkg?.monthlyFee || 0,
        );
      } else {
        const id = await createSubmission(
          portalType,
          state.formData,
          pkg?.name || '',
          pkg?.setupFee || 0,
          pkg?.monthlyFee || 0,
        );
        submissionId.current = id;
        completedSteps.current.add('details');
      }
      goTo(2);
    } catch (err) {
      console.error('Submit details failed:', err);
    } finally {
      setSaving(false);
    }
  }, [state.formData, portalType, packages, goTo]);

  // Step 2 → 3: Save signature
  const submitSignature = useCallback(async (sig: SignatureRecord) => {
    setSaving(true);
    try {
      setState(prev => ({ ...prev, signature: sig }));
      if (submissionId.current) {
        const isFirstTime = !completedSteps.current.has('signed');
        await updateSignature(submissionId.current, sig, isFirstTime);
        completedSteps.current.add('signed');
      }
      goTo(3);
    } catch (err) {
      console.error('Submit signature failed:', err);
    } finally {
      setSaving(false);
    }
  }, [goTo]);

  // Step 3 → 4: Save payment
  const submitPayment = useCallback(async (payment: PaymentRecord) => {
    setSaving(true);
    try {
      setState(prev => ({ ...prev, payment }));
      if (submissionId.current) {
        const isFirstTime = !completedSteps.current.has('paid');
        await updatePayment(submissionId.current, payment, isFirstTime);
        completedSteps.current.add('paid');
      }
      goTo(4);
    } catch (err) {
      console.error('Submit payment failed:', err);
    } finally {
      setSaving(false);
    }
  }, [goTo]);

  // Step 4: Save booking
  const submitBooking = useCallback(async (booking: BookingRecord) => {
    setSaving(true);
    try {
      setState(prev => ({ ...prev, booking }));
      if (submissionId.current) {
        const isFirstTime = !completedSteps.current.has('booked');
        await updateBooking(submissionId.current, booking, isFirstTime);
        completedSteps.current.add('booked');
      }
    } catch (err) {
      console.error('Submit booking failed:', err);
    } finally {
      setSaving(false);
    }
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    submissionId.current = null;
    completedSteps.current = new Set();
  }, []);

  return {
    state,
    saving,
    goTo,
    updateFormData,
    submitDetails,
    submitSignature,
    submitPayment,
    submitBooking,
    reset,
  };
}
