import { useState } from 'react';
import type { PortalConfig, FormData, PaymentRecord, SignatureRecord, BookingRecord } from '../../types/portal';

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SLOTS = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '1:00 PM', '1:30 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
const BLOCKED_DAYS = new Set([7, 13, 21]);

function buildMonth(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const firstDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function sameDay(a: Date | null, b: Date | null): boolean {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

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
      formatMoney={formatMoney}
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
  formatMoney: (n: number) => string;
  onBook: (record: BookingRecord) => void;
}

function CalendarPicker({ config, data, payment, pkg, onBook }: CalendarPickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selDate, setSelDate] = useState<Date | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const cells = buildMonth(view.getFullYear(), view.getMonth());

  const isAvailable = (d: Date | null): boolean => {
    if (!d) return false;
    if (d < today) return false;
    const days = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (days > 45) return false;
    const dow = d.getDay();
    if (dow === 0 || dow === 6) return false;
    if (BLOCKED_DAYS.has(d.getDate())) return false;
    return true;
  };

  const prevMonth = () => {
    const n = new Date(view);
    n.setMonth(n.getMonth() - 1);
    if (n < new Date(today.getFullYear(), today.getMonth(), 1)) return;
    setView(n); setSelDate(null); setConfirming(null);
  };

  const nextMonth = () => {
    const n = new Date(view);
    n.setMonth(n.getMonth() + 1);
    setView(n); setSelDate(null); setConfirming(null);
  };

  const confirmBook = () => {
    if (!selDate || !confirming) return;
    const [hm, ap] = confirming.split(' ');
    const [rawH, m] = hm.split(':').map(Number);
    const h = (ap === 'PM' && rawH < 12) ? rawH + 12 : rawH;
    const dt = new Date(selDate);
    dt.setHours(h, m, 0, 0);
    onBook({
      datetime: dt.toISOString(),
      display: dt.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
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

      <div className="grid grid-cols-1 md:grid-cols-2 border border-line rounded-l overflow-hidden bg-white shadow-subtle">
        {/* Left - Event info */}
        <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-line">
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

        {/* Right - Calendar */}
        <div className="p-6 md:p-8">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg text-ink cursor-pointer border-0 bg-transparent text-lg"
              disabled={view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth()}>
              ‹
            </button>
            <h5 className="font-bold text-sm">{MONTHS[view.getMonth()]} {view.getFullYear()}</h5>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg text-ink cursor-pointer border-0 bg-transparent text-lg">
              ›
            </button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {DOW.map(d => (
              <div key={d} className="text-[10px] font-semibold text-muted text-center py-1 uppercase">
                {d}
              </div>
            ))}
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const avail = isAvailable(d);
              const sel = sameDay(d, selDate);
              const isToday = sameDay(d, today);
              return (
                <button
                  key={i}
                  disabled={!avail}
                  onClick={() => { setSelDate(d); setConfirming(null); }}
                  className={`w-full aspect-square flex items-center justify-center text-sm rounded-full cursor-pointer border-0 transition-colors
                    ${sel ? 'bg-ink text-white font-bold' : ''}
                    ${!sel && avail ? 'hover:bg-bg text-ink bg-transparent' : ''}
                    ${!avail ? 'text-line cursor-not-allowed bg-transparent' : ''}
                    ${isToday && !sel ? 'font-bold' : ''}
                  `}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {/* Time slots */}
          {selDate ? (
            <div>
              <div className="font-mono text-[10px] tracking-widest uppercase text-muted mb-2">
                {selDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {SLOTS.map(t => (
                  <div key={t} className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirming(t)}
                      className={`flex-1 py-2.5 text-sm text-center rounded-m border cursor-pointer transition-colors
                        ${confirming === t
                          ? 'bg-gold/10 border-gold text-ink font-semibold'
                          : 'border-line hover:border-ink bg-white text-ink'
                        }`}
                    >
                      {t}
                    </button>
                    {confirming === t && (
                      <button
                        onClick={confirmBook}
                        className="px-5 py-2.5 text-sm font-semibold bg-ink text-white rounded-m cursor-pointer border-0 hover:bg-gold hover:text-ink transition-colors"
                      >
                        Confirm
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 py-7 text-center bg-bg rounded-m text-sm text-muted">
              Select an available date to see times.
            </div>
          )}
        </div>
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
