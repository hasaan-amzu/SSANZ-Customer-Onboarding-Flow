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
  const { state, goTo, updateFormData, setSignature, setPayment, setBooking, reset } = usePortalState();

  return (
    <PortalShell
      step={state.step}
      portalType={resolvedType}
    >
      {state.step === 1 && (
        <StepDetails
          config={config}
          data={state.formData}
          onChange={updateFormData}
          onNext={() => goTo(2)}
        />
      )}
      {state.step === 2 && (
        <StepAgreement
          config={config}
          data={state.formData}
          onSign={(sig) => { setSignature(sig); goTo(3); }}
          onBack={() => goTo(1)}
        />
      )}
      {state.step === 3 && (
        <StepPayment
          config={config}
          data={state.formData}
          onPay={(pay) => { setPayment(pay); goTo(4); }}
          onBack={() => goTo(2)}
        />
      )}
      {state.step === 4 && (
        <StepKickoff
          config={config}
          data={state.formData}
          payment={state.payment}
          signature={state.signature}
          booking={state.booking}
          onBook={setBooking}
          onReset={reset}
        />
      )}
    </PortalShell>
  );
}
