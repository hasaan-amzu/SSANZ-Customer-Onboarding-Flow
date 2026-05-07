import type { PortalConfig, FormData, PaymentRecord, SignatureRecord, BookingRecord } from '../../types/portal';

interface StepKickoffProps {
  config: PortalConfig;
  data: FormData;
  payment: PaymentRecord | null;
  signature: SignatureRecord | null;
  booking: BookingRecord | null;
  onBook: (record: BookingRecord) => void;
  onReset: () => void;
  saving?: boolean;
}

export function StepKickoff({ config, data, payment, signature, booking, onBook, onReset }: StepKickoffProps) {
  const pkg = config.packages.find(p => p.id === data.packageId);
  const formatMoney = (n: number) => '$' + (n || 0).toLocaleString();

  if (booking) {
    return (
      <Confirmation
        config={config}
        data={data}
        payment={payment}
        signature={signature}
        booking={booking}
        formatMoney={formatMoney}
        onReset={onReset}
      />
    );
  }

  return (
    <CalendarPicker
      config={config}
      data={data}
      payment={payment}
      pkg={pkg}
      onBook={onBook}
    />
  );
}

// --- Calendar Picker ---

interface CalendarPickerProps {
  config: PortalConfig;
  data: FormData;
  payment: PaymentRecord | null;
  pkg: PortalConfig['packages'][0] | undefined;
  onBook: (record: BookingRecord) => void;
}

function CalendarPicker({ config, data, payment, pkg, onBook }: CalendarPickerProps) {
  const handleConfirmBooked = () => {
    onBook({
      datetime: new Date().toISOString(),
      display: 'Booked via Google Calendar',
    });
  };

  return (
    <div className="step-enter">
      <div className="font-mono text-[10px] tracking-widest uppercase text-gold mb-1">
        Step 04
      </div>
      <h2 className="font-head text-xl md:text-2xl font-extrabold text-ink mb-0.5">Book your kickoff</h2>
      <p className="text-muted text-sm mb-4 flex items-center gap-2">
        <span className="text-success text-lg">●</span>
        Payment confirmed ({payment?.ref}). Pick a time that works — we'll take it from here.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-5 border border-line rounded-l overflow-hidden bg-white shadow-subtle">
        {/* Left - Event info (2 cols) */}
        <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-line md:col-span-2">
          <div className="font-mono text-[10px] tracking-widest uppercase text-muted mb-2">
            SSANZ Growth AI
          </div>
          <h4 className="font-bold text-lg text-ink mb-2">{config.meetingTitle}</h4>
          <div className="flex items-center gap-2 text-sm text-muted mb-3">
            <span>&#128336;</span> {config.meetingDuration} &middot; {config.meetingPlatform}
          </div>
          <p className="text-sm text-ink-2 leading-relaxed mb-4">
            A working session with your SSANZ strategist. We'll review your ICP, walk through the{' '}
            <strong>{pkg?.name}</strong> build plan, and align on timelines.
          </p>
          <ul className="space-y-2 text-sm text-ink-2 mb-5">
            {['Account setup checklist', 'ICP + messaging review', 'Launch date confirmed'].map(item => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-gold">→</span> {item}
              </li>
            ))}
          </ul>
          <div className="px-3 py-2.5 bg-bg rounded-m text-xs text-muted">
            Pre-filled: <strong className="text-ink">{data.fullName}</strong> &middot; {data.email}
          </div>
        </div>

        {/* Right - Google Calendar embed (3 cols) */}
        <div className="md:col-span-3">
          <iframe
            src={config.calendarEmbedUrl}
            className="w-full border-0"
            style={{ minHeight: '580px' }}
            title="Book a kickoff call"
          />
        </div>
      </div>

      {/* Continue button after booking */}
      <div className="mt-5 text-center">
        <button
          onClick={handleConfirmBooked}
          className="px-8 py-3.5 text-base font-semibold bg-ink text-white rounded-m cursor-pointer border-0 hover:bg-gold hover:text-ink transition-colors"
        >
          I've booked my call — finish onboarding →
        </button>
      </div>

      <div className="mt-4 text-center font-mono text-xs text-muted">
        All times shown in your local timezone &middot; {Intl.DateTimeFormat().resolvedOptions().timeZone}
      </div>
    </div>
  );
}

// --- Confirmation Screen ---

interface ConfirmationProps {
  config: PortalConfig;
  data: FormData;
  payment: PaymentRecord | null;
  signature: SignatureRecord | null;
  booking: BookingRecord;
  formatMoney: (n: number) => string;
  onReset: () => void;
}

function Confirmation({ config, data, payment, signature, booking, formatMoney, onReset }: ConfirmationProps) {
  const pkg = config.packages.find(p => p.id === data.packageId);
  const signedAt = signature ? new Date(signature.timestamp) : null;
  const paidAt = payment ? new Date(payment.timestamp) : null;
  const firstName = (data.fullName || '').split(' ')[0];

  const fmtTime = (d: Date) => d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <div className="step-enter">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gold flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M5 14.5L11 20.5L23 8.5" stroke="#C8973A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="font-mono text-[11px] tracking-widest uppercase text-muted mb-2">
          You're onboarded
        </div>
        <h2 className="font-head text-3xl md:text-4xl font-extrabold text-ink mb-3">
          Welcome aboard, {firstName}.
        </h2>
        <p className="text-muted text-sm max-w-md mx-auto">
          Everything's set. We've sent a confirmation to <strong>{data.email}</strong>.
          Here's what just happened and what comes next.
        </p>
      </div>

      {/* Summary */}
      <div className="border border-line rounded-l overflow-hidden bg-white shadow-subtle mb-8">
        {[
          {
            label: 'Package',
            value: <><strong>{pkg?.name}</strong> &middot; {formatMoney(pkg?.setupFee || 0)} setup + {formatMoney(pkg?.monthlyFee || 0)}/mo</>,
            meta: <><span className="text-gold">✓</span> Selected</>,
          },
          {
            label: 'Agreement',
            value: <>Signed by {data.fullName}, {data.role}</>,
            meta: signedAt ? <><span className="text-gold">✓</span> {fmtTime(signedAt)}</> : null,
          },
          {
            label: 'Payment',
            value: <>{formatMoney(payment?.amount || 0)} &middot; Ref <code className="font-mono text-xs">{payment?.ref}</code></>,
            meta: paidAt ? <><span className="text-gold">✓</span> {fmtTime(paidAt)}</> : null,
          },
          {
            label: 'Kickoff call',
            value: <>{booking.display} &middot; {config.meetingPlatform}</>,
            meta: <><span className="text-gold">✓</span> Booked</>,
          },
        ].map((row, i) => (
          <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-line last:border-0">
            <span className="font-mono text-[10px] tracking-widest uppercase text-muted w-24 flex-shrink-0">
              {row.label}
            </span>
            <span className="flex-1 text-sm text-ink-2">{row.value}</span>
            <span className="text-xs text-muted flex-shrink-0 ml-4">{row.meta}</span>
          </div>
        ))}
      </div>

      {/* What happens next */}
      <div className="border-l-4 border-gold bg-white rounded-r-l px-6 py-5 mb-8">
        <h4 className="font-bold text-ink mb-3">
          What happens <span className="text-gold">next</span>
        </h4>
        <ol className="space-y-2 text-sm text-ink-2 list-decimal list-inside">
          <li>Your strategist reviews your company + ICP before the call.</li>
          <li>We send a short pre-call questionnaire (2 minutes) to your inbox within 24 hours.</li>
          <li>On the call, we align on launch date and go live within 10 business days.</li>
        </ol>
        <p className="mt-4 text-xs text-muted">
          Questions in the meantime? Reply to your confirmation email or reach us at {config.contactEmail}.
        </p>
      </div>

      {import.meta.env.DEV && (
        <div className="text-center">
          <button onClick={onReset} className="text-sm text-muted underline cursor-pointer bg-transparent border-0">
            ↻ Restart
          </button>
        </div>
      )}
    </div>
  );
}
