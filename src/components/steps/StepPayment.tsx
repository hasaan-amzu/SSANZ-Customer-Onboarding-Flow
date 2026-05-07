import { useState } from 'react';
import type { PortalConfig, FormData, PaymentRecord } from '../../types/portal';
import { Button } from '../ui/Button';

interface StepPaymentProps {
  config: PortalConfig;
  data: FormData;
  onPay: (record: PaymentRecord) => void;
  onBack: () => void;
  saving?: boolean;
}

export function StepPayment({ config, data, onPay, onBack, saving }: StepPaymentProps) {
  const pkg = config.packages.find(p => p.id === data.packageId);
  const formatMoney = (n: number) => '$' + (n || 0).toLocaleString() + '.00';
  const total = (pkg?.setupFee || 0) + (pkg?.monthlyFee || 0);

  const [card, setCard] = useState({
    email: data.email,
    number: '',
    exp: '',
    cvc: '',
    name: data.fullName,
    country: 'United States',
    zip: '',
  });
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const fmtCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExp = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    if (d.length < 3) return d;
    return d.slice(0, 2) + ' / ' + d.slice(2);
  };

  const valid = card.number.replace(/\s/g, '').length >= 15
    && /^\d{2}\s\/\s\d{2}$/.test(card.exp)
    && card.cvc.length >= 3
    && card.name.trim().length > 1
    && card.zip.trim().length >= 3;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || status !== 'idle') return;
    setStatus('processing');
    setTimeout(() => {
      setStatus('success');
      const ref = 'ch_' + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 6);
      const record: PaymentRecord = {
        ref,
        amount: total,
        timestamp: new Date().toISOString(),
      };
      setTimeout(() => onPay(record), 900);
    }, 1600);
  };

  const fillDemo = () => {
    setCard(c => ({ ...c, number: '4242 4242 4242 4242', exp: '12 / 28', cvc: '123', zip: '94103' }));
  };

  const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Australia', 'New Zealand'];

  const inputClass = 'w-full px-4 py-3 text-sm bg-white border border-line rounded-m outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 placeholder:text-muted/50';
  const labelClass = 'text-xs font-semibold text-ink-2 mb-1.5 block';

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
            Next charge: {new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} for {formatMoney(pkg?.monthlyFee || 0)}.
          </div>
        </div>

        {/* Right - Card form */}
        <form className="p-6 md:p-8 bg-white" onSubmit={handlePay}>
          <h5 className="font-bold text-sm text-ink mb-5">Pay with card</h5>

          <div className="mb-4">
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} value={card.email}
              onChange={e => setCard({ ...card, email: e.target.value })} />
          </div>

          <div className="mb-4">
            <label className={labelClass}>Card information</label>
            <input type="text" className={inputClass} value={card.number}
              onChange={e => setCard({ ...card, number: fmtCard(e.target.value) })}
              placeholder="1234 1234 1234 1234" inputMode="numeric" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <input type="text" className={inputClass} value={card.exp}
              onChange={e => setCard({ ...card, exp: fmtExp(e.target.value) })}
              placeholder="MM / YY" inputMode="numeric" />
            <input type="text" className={inputClass} value={card.cvc}
              onChange={e => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              placeholder="CVC" inputMode="numeric" />
          </div>

          <div className="mb-4">
            <label className={labelClass}>Cardholder name</label>
            <input type="text" className={inputClass} value={card.name}
              onChange={e => setCard({ ...card, name: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className={labelClass}>Country</label>
              <select className={inputClass} value={card.country}
                onChange={e => setCard({ ...card, country: e.target.value })}>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>ZIP / Postal</label>
              <input type="text" className={inputClass} value={card.zip}
                onChange={e => setCard({ ...card, zip: e.target.value })} />
            </div>
          </div>

          <button type="button" onClick={fillDemo}
            className="text-xs text-muted underline cursor-pointer mb-3 bg-transparent border-0 p-0">
            Use test card (4242 4242 4242 4242)
          </button>

          <button
            type="submit"
            disabled={!valid || status !== 'idle' || saving}
            className={`w-full py-3.5 text-base font-semibold rounded-m transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
              ${status === 'success' ? 'bg-success text-white' : 'bg-ink text-white hover:bg-gold hover:text-ink'}`}
          >
            {status === 'idle' && <>Pay {formatMoney(total)}</>}
            {status === 'processing' && <>Processing...</>}
            {status === 'success' && <>&#10003; Payment confirmed</>}
          </button>

          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted">
            <span>&#128274;</span> Payments secured by <strong className="text-ink">Stripe</strong>
          </div>
        </form>
      </div>

      <div className="mt-5">
        <Button variant="ghost" onClick={onBack} disabled={status !== 'idle'}>
          ← Back
        </Button>
      </div>
    </div>
  );
}
