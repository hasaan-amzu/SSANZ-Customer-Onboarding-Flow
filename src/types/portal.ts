export interface Package {
  id: string;
  name: string;
  description: string;
  setupFee: number;
  monthlyFee: number;
  recommended?: boolean;
  pricingLabel?: string;
}

export interface ContractClause {
  number: number;
  title: string;
  body: string;
}

export interface PortalConfig {
  portalType: 'b2b' | 'vc';
  landing: {
    eyebrow: string;
    headline: string;
    headlineAccent: string;
    description: string;
    ctaText: string;
  };
  packages: Package[];
  packageNote: string;
  formFields: {
    showWebsite: boolean;
    showIndustry: boolean;
    showReferral: boolean;
  };
  industries: string[];
  referralOptions: string[];
  contract: {
    entityName: string;
    entityType: string;
    jurisdiction: string;
    clauses: ContractClause[];
  };
  stripeLinks: Record<string, string>;
  calendarEmbedUrl: string;
  meetingTitle: string;
  meetingDuration: string;
  meetingPlatform: string;
  contactEmail: string;
}

export interface FormData {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  role: string;
  industry: string;
  referral: string;
  packageId: string;
}

export interface SignatureRecord {
  name: string;
  agreed: boolean;
  timestamp: string;
  ip: string;
}

export interface PaymentRecord {
  ref: string;
  amount: number;
  timestamp: string;
}

export interface BookingRecord {
  datetime: string;
  display: string;
}

export interface PortalState {
  step: number;
  formData: FormData;
  signature: SignatureRecord | null;
  payment: PaymentRecord | null;
  booking: BookingRecord | null;
}
