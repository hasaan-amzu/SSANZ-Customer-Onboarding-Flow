import { useState, useCallback, useMemo } from 'react';
import type { PortalConfig, FormData, PaymentRecord, SignatureRecord, BookingRecord } from '../../types/portal';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const EDGE_FN_URL = `${SUPABASE_URL}/functions/v1/google-calendar`;
const CONFIRMATION_URL = `${SUPABASE_URL}/functions/v1/send-confirmation`;
const BUSINESS_TZ = 'America/Chicago';

interface TimeSlot {
  ctHour: number;
  ctMinute: number;
  localDisplay: string;
  nextDay: boolean;
}

function getBusinessOffsetMin(dateStr: string): number {
  const ref = new Date(`${dateStr}T12:00:00Z`);
  const parts: Record<string, string> = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(ref).forEach(p => { parts[p.type] = p.value; });
  const localH = parseInt(parts.hour === '24' ? '0' : parts.hour);
  const localM = parseInt(parts.minute);
  return (12 * 60) - (localH * 60 + localM);
}

function ctToUTC(dateStr: string, hour: number, minute: number, offsetMin: number): Date {
  const base = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`);
  return new Date(base.getTime() + offsetMin * 60000);
}

function enrichSlots(
  raw: { hour: number; minute: number }[],
  dateStr: string,
): TimeSlot[] {
  const offsetMin = getBusinessOffsetMin(dateStr);
  return raw.map(s => {
    const utc = ctToUTC(dateStr, s.hour, s.minute, offsetMin);
    const localDisplay = utc.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const localDateStr = utc.toLocaleDateString('en-CA');
    return {
      ctHour: s.hour,
      ctMinute: s.minute,
      localDisplay,
      nextDay: localDateStr !== dateStr,
    };
  });
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
      signature={signature}
      pkg={pkg}
      onBook={onBook}
    />
  );
}

interface CalendarPickerProps {
  config: PortalConfig;
  data: FormData;
  payment: PaymentRecord | null;
  signature: SignatureRecord | null;
  pkg: PortalConfig['packages'][0] | undefined;
  onBook: (record: BookingRecord) => void;
}

function CalendarPicker({ config, data, payment, signature, pkg, onBook }: CalendarPickerProps) {
  const userTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [today] = useState(() => new Date());
  const [viewMonth, setViewMonth] = useState(() => today.getMonth());
  const [viewYear, setViewYear] = useState(() => today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectDate = useCallback(async (dateStr: string) => {
    setSelectedDate(dateStr);
    setLoadingSlots(true);
    setError(null);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const res = await fetch(`${EDGE_FN_URL}?action=availability&date=${dateStr}`);
      if (!res.ok) throw new Error('Failed to load availability');
      const json = await res.json();
      setSlots(enrichSlots(json.slots || [], dateStr));
    } catch {
      setError('Could not load available times. Please try again.');
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot) return;
    setBooking(true);
    setError(null);
    try {
      const res = await fetch(`${EDGE_FN_URL}?action=book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          hour: selectedSlot.ctHour,
          minute: selectedSlot.ctMinute,
          name: data.fullName,
          email: data.email,
          packageName: pkg?.name || 'N/A',
        }),
      });
      if (!res.ok) throw new Error('Booking failed');
      const result = await res.json();

      const offsetMin = getBusinessOffsetMin(selectedDate);
      const utcDate = ctToUTC(selectedDate, selectedSlot.ctHour, selectedSlot.ctMinute, offsetMin);
      const displayDate = utcDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      const bookingDisplay = `${displayDate} at ${selectedSlot.localDisplay}`;

      // Fire confirmation email with contract PDF (non-blocking — don't delay the UI)
      if (SUPABASE_URL) {
        const signedDate = signature?.timestamp
          ? new Date(signature.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : '';
        fetch(CONFIRMATION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: data.fullName,
            company: data.company,
            email: data.email,
            phone: data.phone,
            role: data.role,
            packageName: pkg?.name || 'N/A',
            setupFee: pkg?.setupFee || 0,
            monthlyFee: pkg?.monthlyFee || 0,
            signedDate,
            bookingDisplay,
            meetLink: result.meetLink || '',
            portalType: config.portalType,
            contract: {
              entityName: config.contract.entityName,
              entityType: config.contract.entityType,
              jurisdiction: config.contract.jurisdiction,
              clauses: config.contract.clauses,
            },
            signatureDetails: signature ? {
              name: signature.name,
              ip: signature.ip,
              timestamp: signature.timestamp,
            } : null,
          }),
        }).catch(err => console.error('Confirmation email failed:', err));
      }

      onBook({
        datetime: result.start || utcDate.toISOString(),
        display: bookingDisplay,
      });
    } catch {
      setError('Failed to book. The slot may have just been taken — please pick another time.');
    } finally {
      setBooking(false);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const goNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  };

  const goPrevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  };

  const isDateDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) return true;
    if (viewYear === today.getFullYear() && viewMonth === today.getMonth() && day <= today.getDate()) return true;
    return false;
  };

  const toDateStr = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <div className="step-enter">
      <div className="font-mono text-[10px] tracking-widest uppercase text-gold mb-1">Step 04</div>
      <h2 className="font-head text-xl md:text-2xl font-extrabold text-ink mb-0.5">Book your kickoff</h2>
      <p className="text-muted text-sm mb-4 flex items-center gap-2">
        <span className="text-success text-lg">●</span>
        Payment confirmed ({payment?.ref}). Pick a time that works — we'll take it from here.
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 border border-line rounded-l overflow-hidden bg-white shadow-subtle">
        <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-line md:col-span-2">
          <div className="font-mono text-[10px] tracking-widest uppercase text-muted mb-2">SSANZ Growth AI</div>
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

        <div className="md:col-span-3 p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={goPrevMonth} disabled={!canGoPrev} className="w-8 h-8 flex items-center justify-center rounded-full border border-line bg-white text-ink hover:bg-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">←</button>
            <span className="font-semibold text-ink">{monthLabel}</span>
            <button onClick={goNextMonth} className="w-8 h-8 flex items-center justify-center rounded-full border border-line bg-white text-ink hover:bg-bg transition-colors cursor-pointer">→</button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-mono text-muted mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 text-center text-sm mb-5">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`pad-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = toDateStr(day);
              const disabled = isDateDisabled(day);
              const selected = selectedDate === dateStr;
              return (
                <button key={day} disabled={disabled} onClick={() => selectDate(dateStr)} className={`py-2 rounded-full transition-colors cursor-pointer border-0 ${selected ? 'bg-ink text-white font-semibold' : disabled ? 'text-muted/40 cursor-not-allowed bg-transparent' : 'text-ink hover:bg-gold/20 bg-transparent'}`}>{day}</button>
              );
            })}
          </div>

          {selectedDate && (
            <div>
              <div className="font-mono text-[10px] tracking-widest uppercase text-muted mb-2">
                Available times &middot;{' '}
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>

              {loadingSlots ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted">
                  <svg className="animate-spin h-5 w-5 mr-2 text-gold" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Checking availability...
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">No available slots on this date. Try another day.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {slots.map(slot => {
                    const active = selectedSlot?.ctHour === slot.ctHour && selectedSlot?.ctMinute === slot.ctMinute;
                    return (
                      <button key={`${slot.ctHour}-${slot.ctMinute}`} onClick={() => setSelectedSlot(slot)} className={`py-2 px-3 text-sm rounded-m border transition-colors cursor-pointer ${active ? 'bg-ink text-white border-ink font-semibold' : 'bg-white text-ink border-line hover:border-gold hover:bg-gold/10'}`}>
                        {slot.localDisplay}{slot.nextDay ? ' +1' : ''}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedSlot && (
            <div className="mt-5 flex flex-col items-center gap-2">
              <button onClick={handleBook} disabled={booking} className="w-full px-8 py-3.5 text-base font-semibold bg-ink text-white rounded-m cursor-pointer border-0 hover:bg-gold hover:text-ink transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {booking ? 'Booking...' : `Confirm ${selectedSlot.localDisplay} →`}
              </button>
              <p className="text-xs text-muted">A Google Meet link and calendar invite will be sent to {data.email}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-center font-mono text-xs text-muted">
        All times in your timezone &middot; {userTz}
      </div>
    </div>
  );
}

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
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gold flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M5 14.5L11 20.5L23 8.5" stroke="#C8973A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="font-mono text-[11px] tracking-widest uppercase text-muted mb-2">You're onboarded</div>
        <h2 className="font-head text-3xl md:text-4xl font-extrabold text-ink mb-3">Welcome aboard, {firstName}.</h2>
        <p className="text-muted text-sm max-w-md mx-auto">
          Everything's set. We've sent a confirmation to <strong>{data.email}</strong>. Here's what just happened and what comes next.
        </p>
      </div>

      <div className="border border-line rounded-l overflow-hidden bg-white shadow-subtle mb-8">
        {[
          { label: 'Package', value: <><strong>{pkg?.name}</strong> &middot; {formatMoney(pkg?.setupFee || 0)} setup + {formatMoney(pkg?.monthlyFee || 0)}/mo</>, meta: <><span className="text-gold">✓</span> Selected</> },
          { label: 'Agreement', value: <>Signed by {data.fullName}, {data.role}</>, meta: signedAt ? <><span className="text-gold">✓</span> {fmtTime(signedAt)}</> : null },
          { label: 'Payment', value: <>{formatMoney(payment?.amount || 0)} &middot; Ref <code className="font-mono text-xs">{payment?.ref}</code></>, meta: paidAt ? <><span className="text-gold">✓</span> {fmtTime(paidAt)}</> : null },
          { label: 'Kickoff call', value: <>{booking.display} &middot; {config.meetingPlatform}</>, meta: <><span className="text-gold">✓</span> Booked</> },
        ].map((row, i) => (
          <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-line last:border-0">
            <span className="font-mono text-[10px] tracking-widest uppercase text-muted w-24 flex-shrink-0">{row.label}</span>
            <span className="flex-1 text-sm text-ink-2">{row.value}</span>
            <span className="text-xs text-muted flex-shrink-0 ml-4">{row.meta}</span>
          </div>
        ))}
      </div>

      <div className="border-l-4 border-gold bg-white rounded-r-l px-6 py-5 mb-8">
        <h4 className="font-bold text-ink mb-3">What happens <span className="text-gold">next</span></h4>
        <ol className="space-y-2 text-sm text-ink-2 list-decimal list-inside">
          <li>Your strategist reviews your company + ICP before the call.</li>
          <li>We send a short pre-call questionnaire (2 minutes) to your inbox within 24 hours.</li>
          <li>On the call, we align on launch date and go live within 10 business days.</li>
        </ol>
        <p className="mt-4 text-xs text-muted">Questions in the meantime? Reply to your confirmation email or reach us at {config.contactEmail}.</p>
      </div>

      {import.meta.env.DEV && (
        <div className="text-center">
          <button onClick={onReset} className="text-sm text-muted underline cursor-pointer bg-transparent border-0">↻ Restart</button>
        </div>
      )}
    </div>
  );
}
