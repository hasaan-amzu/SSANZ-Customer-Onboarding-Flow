import { useState, useCallback } from 'react';
import type { PortalState, FormData, SignatureRecord, PaymentRecord, BookingRecord } from '../types/portal';

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

export function usePortalState() {
  const [state, setState] = useState<PortalState>(INITIAL_STATE);

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

  const setSignature = useCallback((sig: SignatureRecord) => {
    setState(prev => ({ ...prev, signature: sig }));
  }, []);

  const setPayment = useCallback((payment: PaymentRecord) => {
    setState(prev => ({ ...prev, payment }));
  }, []);

  const setBooking = useCallback((booking: BookingRecord) => {
    setState(prev => ({ ...prev, booking }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    goTo,
    updateFormData,
    setSignature,
    setPayment,
    setBooking,
    reset,
  };
}
