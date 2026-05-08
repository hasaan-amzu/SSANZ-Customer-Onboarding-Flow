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
    error,
    restoredFromPayment,
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
        ref: 'stripe_payment_link',
        amount: (() => {
          const pkg = config.packages.find(p => p.id === state.formData.packageId);
          return (pkg?.setupFee || 0) + (pkg?.monthlyFee || 0);
        })(),
        timestamp: new Date().toISOString(),
      };
      submitPayment(record);
    }
  }, [restoredFromPayment, config.packages, state.formData.packageId, submitPayment]);

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
