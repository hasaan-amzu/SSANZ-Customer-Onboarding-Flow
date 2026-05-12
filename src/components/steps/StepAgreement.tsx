import { useState, useRef } from 'react';
import type { PortalConfig, FormData, SignatureRecord } from '../../types/portal';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';

interface StepAgreementProps {
  config: PortalConfig;
  data: FormData;
  onSign: (record: SignatureRecord) => void;
  onBack: () => void;
  saving?: boolean;
}

export function StepAgreement({ config, data, onSign, onBack, saving }: StepAgreementProps) {
  const pkg = config.packages.find(p => p.id === data.packageId);
  const formatMoney = (n: number) => '$' + n.toLocaleString();
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const refPrefix = config.portalType === 'vc' ? 'DFS' : 'SSA';
  const refCode = `${refPrefix}-${(data.company || 'XXX').replace(/\s+/g, '').slice(0, 4).toUpperCase()}-${new Date().getFullYear()}`;

  const [sig, setSig] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      setScrolled(true);
    }
  };

  const nameMatches = sig.trim().toLowerCase() === data.fullName.trim().toLowerCase() && sig.trim().length > 2;
  const canSign = scrolled && nameMatches && agreed;

  const [signing, setSigning] = useState(false);

  const handleSign = async () => {
    if (!canSign || signing) return;
    setSigning(true);

    let ip = 'unavailable';
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (supabaseUrl) {
        const res = await fetch(`${supabaseUrl}/functions/v1/client-ip`);
        const data = await res.json();
        if (data.ip) ip = data.ip;
      }
    } catch {
      // IP capture is non-blocking
    }

    onSign({
      name: sig.trim(),
      agreed: true,
      timestamp: new Date().toISOString(),
      ip,
    });
  };

  const ctaText = !scrolled
    ? 'Read the full agreement to continue ↓'
    : !nameMatches
    ? 'Type your full name to sign'
    : !agreed
    ? 'Check the box to confirm'
    : 'Sign & continue →';

  const renderClause = (body: string) => {
    if (!pkg) return body;
    const parts = body.split(/({{PACKAGE_NAME}}|{{SETUP_FEE}}|{{MONTHLY_FEE}})/g);
    return parts.map((part, i) => {
      if (part === '{{PACKAGE_NAME}}') return <span key={i} className="filled">{pkg.name}</span>;
      if (part === '{{SETUP_FEE}}') return <span key={i} className="filled">{formatMoney(pkg.setupFee)}</span>;
      if (part === '{{MONTHLY_FEE}}') return <span key={i} className="filled">{formatMoney(pkg.monthlyFee)}</span>;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="step-enter">
      <div className="font-mono text-[10px] tracking-widest uppercase text-gold mb-0.5">
        Step 02
      </div>
      <h2 className="font-head text-xl md:text-2xl font-extrabold text-ink mb-0.5">
        Agreement &amp; signature
      </h2>
      <p className="text-muted text-sm mb-3">
        Review and sign your master services agreement.
      </p>

      <div className="relative mb-4">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="border border-line rounded-lg overflow-y-auto px-5 py-5 bg-bg/30"
          style={{ maxHeight: '320px' }}
        >
          <h3 className="font-serif text-base font-bold text-center text-ink mb-0.5">
            Services Agreement
          </h3>
          <div className="font-mono text-[9px] tracking-widest uppercase text-muted text-center mb-4">
            {config.contract.entityName} &middot; Ref {refCode}
          </div>

          <p className="font-serif text-[13px] leading-relaxed text-ink-2 mb-4">
            This Services Agreement (&ldquo;<strong>Agreement</strong>&rdquo;) is entered into on{' '}
            <span className="filled">{today}</span> (the &ldquo;Effective Date&rdquo;) by and between{' '}
            <strong>{config.contract.entityName}</strong>, a {config.contract.entityType} (&ldquo;<strong>SSANZ</strong>&rdquo;),
            and <span className="filled">{data.company || '[COMPANY NAME]'}</span> (&ldquo;<strong>Client</strong>&rdquo;).
            SSANZ and Client may be referred to individually as a &ldquo;Party&rdquo; and collectively as the &ldquo;Parties.&rdquo;
          </p>

          <table className="w-full text-[13px] mb-5 border-collapse">
            <tbody>
              {[
                ['Client', <span className="filled">{data.company || '[COMPANY NAME]'}</span>],
                ['Signatory', <><span className="filled">{data.fullName || '[CLIENT NAME]'}</span>, <span className="filled">{data.role || '[CLIENT TITLE]'}</span></>],
                ['Contact', <>{data.email || '—'}{data.phone ? ` · ${data.phone}` : ''}</>],
                ['Package', <span className="filled">{pkg?.name || '[PACKAGE NAME]'}</span>],
                ['Setup fee', <><span className="filled">{formatMoney(pkg?.setupFee || 0)}</span> due on signing</>],
                ['Monthly fee', <><span className="filled">{formatMoney(pkg?.monthlyFee || 0)}</span> recurring</>],
              ].map(([label, value], i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  <td className="py-2 pr-3 text-muted font-mono text-[10px] uppercase tracking-wider w-24">{label}</td>
                  <td className="py-2 font-serif text-ink-2">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {config.contract.clauses.map(clause => (
            <div key={clause.number} className="mb-4">
              <div className="font-serif font-bold text-[13px] text-ink mb-1">
                {clause.number} &middot; {clause.title}
              </div>
              <p className="font-serif text-[13px] leading-relaxed text-ink-2">
                {renderClause(clause.body)}
              </p>
            </div>
          ))}

          <hr className="border-line my-4" />
          <p className="text-[11px] text-muted leading-relaxed">
            By signing below, Client acknowledges it has had the opportunity to review these terms
            and has authority to bind the entity named above.
          </p>
        </div>

        {!scrolled && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent rounded-b-lg pointer-events-none flex items-end justify-center pb-1">
            <span className="text-[10px] font-mono text-gold tracking-wider animate-pulse pointer-events-none">
              &darr; Scroll to read full agreement
            </span>
          </div>
        )}
      </div>

      <Checkbox
        checked={agreed}
        onChange={e => setAgreed(e.target.checked)}
        label="I have read and agree to the terms above. I understand this is a legally binding electronic signature."
        className="mb-4"
      />

      <div className="mb-1">
        <label className="text-[10px] font-semibold tracking-wider uppercase text-ink mb-1 block">
          Type your full name as signature
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 bg-white border border-line rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none text-base font-medium text-ink"
          value={sig}
          onChange={e => setSig(e.target.value)}
          placeholder={data.fullName || 'Your full name'}
        />
        <span className="text-[11px] text-muted mt-1 block">
          {nameMatches ? '✓ Matches name on file' : `Must match: ${data.fullName || '—'}`}
        </span>
      </div>

      <div className="text-[9px] font-mono text-muted mb-4">
        Timestamp: {new Date().toLocaleString()}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack} type="button">
          &larr; Back
        </Button>
        <Button size="lg" disabled={!canSign || saving || signing} onClick={handleSign} type="button" fullWidth>
          {signing ? 'Signing...' : ctaText}
        </Button>
      </div>
    </div>
  );
}
