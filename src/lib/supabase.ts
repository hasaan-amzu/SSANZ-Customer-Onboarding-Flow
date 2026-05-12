import { createClient } from '@supabase/supabase-js';
import type { FormData, SignatureRecord, PaymentRecord, BookingRecord } from '../types/portal';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const MOCK_MODE = !supabase;

if (MOCK_MODE && import.meta.env.PROD) {
  console.error('[SSANZ] Supabase not configured — running without database persistence. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

// Step 1: Create submission with client details
export async function createSubmission(
  portalType: 'b2b' | 'vc',
  data: FormData,
  packageName: string,
  setupFee: number,
  monthlyFee: number,
): Promise<string | null> {
  if (!supabase) return 'mock_' + Math.random().toString(36).slice(2, 12);

  const { data: row, error } = await supabase
    .from('onboarding_submissions')
    .insert({
      portal_type: portalType,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      company_name: data.company,
      company_website: data.website || null,
      role_title: data.role,
      industry: data.industry || null,
      referral_source: data.referral || null,
      package_id: data.packageId,
      package_name: packageName,
      setup_fee: setupFee,
      monthly_fee: monthlyFee,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create submission:', error);
    return null;
  }

  await logEvent(row.id, 'created', { portal_type: portalType, package: packageName });
  return row.id;
}

// Step 1 (update): Update existing submission details if user went back
export async function updateDetails(
  submissionId: string,
  data: FormData,
  packageName: string,
  setupFee: number,
  monthlyFee: number,
): Promise<boolean> {
  if (!supabase) return true;

  const { error } = await supabase
    .from('onboarding_submissions')
    .update({
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      company_name: data.company,
      company_website: data.website || null,
      role_title: data.role,
      industry: data.industry || null,
      referral_source: data.referral || null,
      package_id: data.packageId,
      package_name: packageName,
      setup_fee: setupFee,
      monthly_fee: monthlyFee,
    })
    .eq('id', submissionId);

  if (error) {
    console.error('Failed to update details:', error);
    return false;
  }

  return true;
}

// Step 2: Save signature (logAudit = false on re-submission to prevent duplicate events)
export async function updateSignature(submissionId: string, sig: SignatureRecord, logAudit = true): Promise<boolean> {
  if (!supabase) return true;

  const { error } = await supabase
    .from('onboarding_submissions')
    .update({
      status: 'signed',
      signature_name: sig.name,
      signature_agreed: sig.agreed,
      signature_timestamp: sig.timestamp,
      signature_ip: sig.ip,
    })
    .eq('id', submissionId);

  if (error) {
    console.error('Failed to update signature:', error);
    return false;
  }

  if (logAudit) await logEvent(submissionId, 'signed', { name: sig.name });
  return true;
}

// Step 3: Save payment
// Note: The stripe-webhook Edge Function also updates status to 'paid' and logs its own audit event.
// To avoid duplicate audit entries, we skip logging here — the webhook is the authoritative source.
export async function updatePayment(submissionId: string, payment: PaymentRecord): Promise<boolean> {
  if (!supabase) return true;

  const { error } = await supabase
    .from('onboarding_submissions')
    .update({
      status: 'paid',
      stripe_payment_ref: payment.ref,
      payment_amount: payment.amount,
      payment_timestamp: payment.timestamp,
    })
    .eq('id', submissionId);

  if (error) {
    // If status is already 'paid' (webhook beat us), the trigger won't fire — that's fine
    console.error('Failed to update payment:', error);
    return false;
  }

  return true;
}

// Step 4: Save booking
export async function updateBooking(submissionId: string, booking: BookingRecord, logAudit = true): Promise<boolean> {
  if (!supabase) return true;

  const { error } = await supabase
    .from('onboarding_submissions')
    .update({
      status: 'completed',
      booking_datetime: booking.datetime,
      booking_display: booking.display,
      confirmation_email_sent: true,
    })
    .eq('id', submissionId);

  if (error) {
    console.error('Failed to update booking:', error);
    return false;
  }

  if (logAudit) {
    await logEvent(submissionId, 'booked', { display: booking.display });
    await logEvent(submissionId, 'email_sent', { to: 'client' });
  }
  return true;
}

// Fetch a submission by ID (for session restoration)
export async function getSubmission(submissionId: string): Promise<{
  portalType: 'b2b' | 'vc';
  status: string;
  formData: import('../types/portal').FormData;
  signature: import('../types/portal').SignatureRecord | null;
  payment: import('../types/portal').PaymentRecord | null;
  booking: import('../types/portal').BookingRecord | null;
} | null> {
  if (!supabase) return null;

  const { data: row, error } = await supabase
    .from('onboarding_submissions')
    .select('*')
    .eq('id', submissionId)
    .single();

  if (error || !row) {
    console.error('Failed to fetch submission:', error);
    return null;
  }

  return {
    portalType: row.portal_type,
    status: row.status,
    formData: {
      fullName: row.full_name || '',
      email: row.email || '',
      phone: row.phone || '',
      company: row.company_name || '',
      website: row.company_website || '',
      role: row.role_title || '',
      industry: row.industry || '',
      referral: row.referral_source || '',
      packageId: row.package_id || '',
    },
    signature: row.signature_agreed ? {
      name: row.signature_name || '',
      agreed: true,
      timestamp: row.signature_timestamp || '',
      ip: row.signature_ip || '',
    } : null,
    payment: row.stripe_payment_ref ? {
      ref: row.stripe_payment_ref,
      amount: row.payment_amount || 0,
      timestamp: row.payment_timestamp || '',
    } : null,
    booking: row.booking_datetime ? {
      datetime: row.booking_datetime,
      display: row.booking_display || '',
    } : null,
  };
}

// Audit log helper
async function logEvent(submissionId: string, eventType: string, metadata: Record<string, unknown>) {
  if (!supabase) return;

  const { error } = await supabase
    .from('submission_events')
    .insert({
      submission_id: submissionId,
      event_type: eventType,
      metadata,
    });

  if (error) {
    console.error('Failed to log event:', error);
  }
}
