import { useState } from 'react';
import type { PortalConfig, FormData } from '../../types/portal';
import { Button } from '../ui/Button';

interface StepPaymentProps {
  config: PortalConfig;
  data: FormData;
  onPersistAndRedirect: () => void;
  onBack: () => void;
  saving?: boolean;
}

export function StepPayment({ config, data, onPersistAndRedirect, onBack }: StepPaymentProps) {
  const pkg = config.packages.find(p => p.id === data.packageId);
  const formatMoney = (n: number) => '$' + (n || 0).toLocaleString() + '.00';
  const total = (pkg?.setupFee || 0) + (pkg?.monthlyFee || 0);
  const [nextChargeDate] = useState(() =>
    new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  );

  const stripeLink = config.stripeLinks[data.packageId] || '';
  const hasLink = stripeLink.length > 0;

  const handlePayment = () => {
    if (!hasLink) return;

    onPersistAndRedirect();

    const url = new URL(stripeLink);
    url.searchParams.set('prefilled_email', data.email);
    window.location.href = url.toString();
  };

  return (
    <div className="step-enter">
      <div className="font-mono text-[10px] tracking-widest uppercase text-gold mb-1">
        Step 03
      </div>
      <h2 className="font-head text-xl md:text-2xl font-extrabold text-ink mb-0.5">Payment</h2>
      <p className="text-muted text-sm mb-4">
        Secure checkout via Stripe. One charge covers your setup fee and first month.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 rounded-l overflow-hidden border border-line shadow-subtle">
        {/* Left - Dark panel */}
        <div className="bg-ink text-white p-6 md:p-8">
          <div className="font-mono text-[10px] tracking-widest uppercase text-white/50 mb-4">
            {config.contract.entityName} &middot; Pay
          </div>
          <h4 className="text-sm font-semibold mb-2">Pay {config.contract.entityName}</h4>
          <div className="text-3xl font-bold mb-6">{formatMoney(total)}</div>

          <div className="space-y-4 border-t border-white/10 pt-4">
            <div className="flex justify-between text-sm">
              <div>
                <div>{pkg?.name || '—'} — Setup</div>
                <div className="text-white/40 text-xs">One-time fee</div>
              </div>
              <div>{formatMoney(pkg?.setupFee || 0)}</div>
            </div>
            <div className="flex justify-between text-sm">
              <div>
                <div>{pkg?.name || '—'} — First month</div>
                <div className="text-white/40 text-xs">Recurring {formatMoney(pkg?.monthlyFee || 0)}/mo</div>
              </div>
              <div>{formatMoney(pkg?.monthlyFee || 0)}</div>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-white/10 pt-3">
              <div>Total due today</div>
              <div>{formatMoney(total)}</div>
            </div>
          </div>

          <div className="mt-6 text-xs text-white/40 leading-relaxed">
            Next charge: {nextChargeDate} for {formatMoney(pkg?.monthlyFee || 0)}.
          </div>
        </div>

        {/* Right - Stripe redirect */}
        <div className="p-6 md:p-8 bg-white flex flex-col justify-center">
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto" width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="10" fill="#635BFF" />
                <path d="M22.2 20.4c0-.9.7-1.3 1.9-1.3 1.7 0 3.8.5 5.5 1.4V15c-1.8-.7-3.6-1-5.5-1-4.5 0-7.5 2.3-7.5 6.2 0 6.1 8.4 5.1 8.4 7.7 0 1.1-.9 1.4-2.2 1.4-1.9 0-4.3-.8-6.2-1.8v5.6c2.1.9 4.2 1.3 6.2 1.3 4.6 0 7.7-2.3 7.7-6.2-.1-6.5-8.3-5.4-8.3-7.8z" fill="white" />
              </svg>
            </div>
            <h5 className="font-bold text-sm text-ink mb-2">Secure Stripe Checkout</h5>
            <p className="text-muted text-sm mb-6 leading-relaxed">
              You'll be redirected to Stripe's secure payment page to complete your purchase. Your card details are handled entirely by Stripe.
            </p>

            {!hasLink && (
              <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                Payment is not yet configured for this package. Please contact {config.contactEmail}.
              </div>
            )}

            <button
              type="button"
              onClick={handlePayment}
              disabled={!hasLink}
              className="w-full py-3.5 text-base font-semibold rounded-m transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-[#635BFF] text-white hover:bg-[#5046E5]"
            >
              Pay {formatMoney(total)} with Stripe
            </button>

            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted">
              <span>&#128274;</span> Payments secured by <strong className="text-ink">Stripe</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
      </div>
    </div>
  );
}
