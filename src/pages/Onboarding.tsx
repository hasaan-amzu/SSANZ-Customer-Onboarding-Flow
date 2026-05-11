import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { b2bConfig } from '../config/b2b';
import { vcConfig } from '../config/vc';
import type { PortalConfig } from '../types/portal';
import { PortalShell } from '../components/layout/PortalShell';
import { StepDetails } from '../components/steps/StepDetails';
import { StepAgreement } from '../components/steps/StepAgreement';
import { StepPayment } from '../components/steps/StepPayment';
import { StepKickoff } from '../components/steps/StepKickoff';
import { usePortalState } from '../hooks/usePortalState';

const CONFIGS: Record<string, PortalConfig> = {
  b2b: b2bConfig,
  vc: vcConfig,
};

export default function Onboarding() {
  const { portalType } = useParams<{ portalType: string }>();
  const resolvedType = (portalType === 'b2b' || portalType === 'vc') ? portalType : 'b2b';
  const config = CONFIGS[resolvedType] || b2bConfig;
  const {
    state,
    saving,
    loading,
    error,
    restoredFromPayment,
    stripeSessionId,
    goTo,
    updateFormData,
    submitDetails,
    submitSignature,
    submitPayment,
    submitBooking,
    persistForPayment,
    reset,
  } = usePortalState(resolvedType, config.packages);

  // Handle return from Stripe: auto-submit payment and advance to Step 4
  const paymentHandled = useRef(false);
  useEffect(() => {
    if (restoredFromPayment && !paymentHandled.current) {
      paymentHandled.current = true;
      const record = {
        ref: stripeSessionId || 'stripe_payment_link',
        amount: (() => {
          const pkg = config.packages.find(p => p.id === state.formData.packageId);
          return (pkg?.setupFee || 0) + (pkg?.monthlyFee || 0);
        })(),
        timestamp: new Date().toISOString(),
      };
      submitPayment(record);
    }
  }, [restoredFromPayment, stripeSessionId, config.packages, state.formData.packageId, submitPayment]);

  // Loading state while restoring session from DB
  if (loading) {
    return (
      <PortalShell step={1} portalType={resolvedType}>
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-gold mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-muted text-sm font-mono tracking-wider">Restoring your progress...</p>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      step={state.step}
      portalType={resolvedType}
    >
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {state.step === 1 && (
        <StepDetails
          config={config}
          data={state.formData}
          onChange={updateFormData}
          onNext={submitDetails}
          saving={saving}
        />
      )}
      {state.step === 2 && (
        <StepAgreement
          config={config}
          data={state.formData}
          onSign={submitSignature}
          onBack={() => goTo(1)}
          saving={saving}
        />
      )}
      {state.step === 3 && (
        <StepPayment
          config={config}
          data={state.formData}
          onPersistAndRedirect={persistForPayment}
          onBack={() => goTo(2)}
          saving={saving}
        />
      )}
      {state.step === 4 && (
        <StepKickoff
          config={config}
          data={state.formData}
          payment={state.payment}
          signature={state.signature}
          booking={state.booking}
          onBook={submitBooking}
          onReset={reset}
          saving={saving}
        />
      )}
    </PortalShell>
  );
}
