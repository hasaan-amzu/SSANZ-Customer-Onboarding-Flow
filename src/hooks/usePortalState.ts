import { useState, useCallback, useRef, useEffect } from 'react';
import type { PortalState, FormData, SignatureRecord, PaymentRecord, BookingRecord } from '../types/portal';
import { createSubmission, updateDetails, updateSignature, updatePayment, updateBooking, getSubmission } from '../lib/supabase';

const PAYMENT_REDIRECT_KEY = 'ssanz_payment_redirect';
const SESSION_KEY_PREFIX = 'ssanz_session_';
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

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

// --- Stripe payment redirect restoration (synchronous, localStorage) ---

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
  stripeSessionId: string | null;
} | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') !== 'success') return null;

  try {
    const raw = localStorage.getItem(PAYMENT_REDIRECT_KEY);
    if (!raw) return null;

    const saved: PaymentRedirectState = JSON.parse(raw);

    if (saved.portalType !== portalType) return null;

    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - saved.redirectedAt > fiveMinutes) {
      localStorage.removeItem(PAYMENT_REDIRECT_KEY);
      return null;
    }

    // Capture Stripe checkout session ID from redirect URL (if present)
    const stripeSessionId = params.get('session_id') || null;

    localStorage.removeItem(PAYMENT_REDIRECT_KEY);

    const url = new URL(window.location.href);
    url.searchParams.delete('payment');
    url.searchParams.delete('session_id');
    window.history.replaceState({}, '', url.pathname);

    return {
      state: {
        step: 4,
        formData: saved.formData,
        signature: saved.signature,
        payment: null,
        booking: null,
      },
      savedSubmissionId: saved.submissionId,
      savedCompletedSteps: saved.completedSteps,
      stripeSessionId,
    };
  } catch {
    localStorage.removeItem(PAYMENT_REDIRECT_KEY);
    return null;
  }
}

// --- Session persistence helpers ---

interface SavedSession {
  submissionId: string;
  portalType: 'b2b' | 'vc';
  savedAt: number;
}

function getSessionKey(portalType: string): string {
  return SESSION_KEY_PREFIX + portalType;
}

function saveSession(portalType: 'b2b' | 'vc', submissionId: string): void {
  const data: SavedSession = { submissionId, portalType, savedAt: Date.now() };
  localStorage.setItem(getSessionKey(portalType), JSON.stringify(data));
}

function loadSession(portalType: 'b2b' | 'vc'): string | null {
  try {
    const raw = localStorage.getItem(getSessionKey(portalType));
    if (!raw) return null;
    const saved: SavedSession = JSON.parse(raw);
    if (saved.portalType !== portalType) return null;
    if (Date.now() - saved.savedAt > SESSION_TTL) {
      localStorage.removeItem(getSessionKey(portalType));
      return null;
    }
    return saved.submissionId;
  } catch {
    localStorage.removeItem(getSessionKey(portalType));
    return null;
  }
}

function clearSession(portalType: 'b2b' | 'vc'): void {
  localStorage.removeItem(getSessionKey(portalType));
}

function statusToStep(status: string): number {
  switch (status) {
    case 'draft': return 2;
    case 'signed': return 3;
    case 'paid': return 4;
    case 'completed': return 4; // show confirmation (booking exists → Confirmation renders)
    default: return 1;
  }
}

function statusToCompletedSteps(status: string): string[] {
  switch (status) {
    case 'draft': return ['details'];
    case 'signed': return ['details', 'signed'];
    case 'paid': return ['details', 'signed', 'paid'];
    case 'completed': return ['details', 'signed', 'paid', 'booked', 'email_sent'];
    default: return [];
  }
}

// --- Hook ---

export function usePortalState(portalType: 'b2b' | 'vc', packages: { id: string; name: string; setupFee: number; monthlyFee: number }[]) {
  // Priority 1: Stripe payment redirect (synchronous)
  const [restored] = useState(() => tryRestoreFromPaymentRedirect(portalType));

  // Priority 2: Check for saved session ID (synchronous check, async DB fetch)
  const [savedSessionId] = useState(() => {
    if (restored) return null; // Stripe redirect takes priority
    return loadSession(portalType);
  });

  const [state, setState] = useState<PortalState>(restored?.state || INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!savedSessionId); // true if we need to fetch from DB
  const [error, setError] = useState<string | null>(null);
  const submissionId = useRef<string | null>(restored?.savedSubmissionId || savedSessionId || null);
  const completedSteps = useRef<Set<string>>(new Set(restored?.savedCompletedSteps || []));

  // Async session restoration from DB
  useEffect(() => {
    if (!savedSessionId) return;

    let cancelled = false;

    (async () => {
      try {
        const submission = await getSubmission(savedSessionId);

        if (cancelled) return;

        if (!submission || submission.portalType !== portalType) {
          // Invalid or wrong portal — clear and start fresh
          clearSession(portalType);
          submissionId.current = null;
          setLoading(false);
          return;
        }

        // Reconstruct state from DB
        const step = statusToStep(submission.status);
        completedSteps.current = new Set(statusToCompletedSteps(submission.status));

        setState({
          step,
          formData: submission.formData,
          signature: submission.signature,
          payment: submission.payment,
          booking: submission.booking,
        });
      } catch (err) {
        console.error('Session restoration failed:', err);
        if (!cancelled) {
          clearSession(portalType);
          submissionId.current = null;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [savedSessionId, portalType]);

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
      // Persist session after successful Step 1
      saveSession(portalType, submissionId.current!);
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
        const ok = await updatePayment(submissionId.current, payment);
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
    localStorage.setItem(PAYMENT_REDIRECT_KEY, JSON.stringify(data));
  }, [portalType, state.formData, state.signature]);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    submissionId.current = null;
    completedSteps.current = new Set();
    clearSession(portalType);
  }, [portalType]);

  return {
    state,
    saving,
    loading,
    error,
    restoredFromPayment: !!restored,
    stripeSessionId: restored?.stripeSessionId || null,
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
