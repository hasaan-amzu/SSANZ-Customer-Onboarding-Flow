import type { PortalConfig } from '../types/portal';
import { COMPANY, INDUSTRIES, REFERRAL_OPTIONS } from './shared';

export const vcConfig: PortalConfig = {
  portalType: 'vc',
  landing: {
    eyebrow: 'VENTURE CAPITAL ONBOARDING',
    headline: 'Scale your portfolio with',
    headlineAccent: 'AI-powered growth.',
    description: 'A concierge onboarding experience for VC partners enabling portfolio companies with bespoke AI-powered outbound and growth infrastructure.',
    ctaText: 'Begin onboarding',
  },
  packages: [
    {
      id: 'email',
      name: 'Email Only',
      description: 'Cold email infrastructure deployed across portfolio companies.',
      setupFee: 3500,
      monthlyFee: 3500,
      pricingLabel: 'From $3,500 / month',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Only',
      description: 'LinkedIn outbound for portfolio leadership and GTM teams.',
      setupFee: 3500,
      monthlyFee: 3500,
      pricingLabel: 'From $3,500 / month',
    },
    {
      id: 'fullstack',
      name: 'Full Stack AI',
      description: 'Full growth engine across portfolio.',
      setupFee: 7500,
      monthlyFee: 7500,
      recommended: true,
      pricingLabel: 'From $7,500 / month',
    },
  ],
  packageNote: 'All packages are 6-month engagements with a 120-day review clause.',
  formFields: {
    showWebsite: false,
    showIndustry: false,
    showReferral: false,
  },
  industries: INDUSTRIES,
  referralOptions: REFERRAL_OPTIONS,
  contract: {
    entityName: COMPANY.legalName,
    entityType: COMPANY.entityType,
    jurisdiction: 'Delaware',
    clauses: [
      {
        number: 1,
        title: 'Services',
        body: 'SSANZ will provide the services described in the {{PACKAGE_NAME}} package, including strategy, setup, outbound infrastructure, and ongoing optimization as further detailed in SSANZ\'s published package specifications. SSANZ will use commercially reasonable efforts to perform the Services in a professional and workmanlike manner.',
      },
      {
        number: 2,
        title: 'Fees & Payment',
        body: 'Client shall pay SSANZ a one-time setup fee of {{SETUP_FEE}}, due on the Effective Date, and a recurring monthly service fee of {{MONTHLY_FEE}}, billed on the same day each month thereafter for the Term. All fees are in U.S. dollars and are non-refundable except as set forth in Section 5.',
      },
      {
        number: 3,
        title: 'Term',
        body: 'This Agreement commences on the Effective Date and continues for an initial term of six (6) months (the "Initial Term"). Thereafter, it shall continue on a month-to-month basis until terminated in accordance with Section 6.',
      },
      {
        number: 4,
        title: 'Confidentiality',
        body: 'Each Party agrees to hold in strict confidence all non-public information disclosed by the other Party in connection with this Agreement. This obligation shall survive termination for a period of two (2) years and excludes information that is publicly available, independently developed, or required to be disclosed by law.',
      },
      {
        number: 5,
        title: '120-Day Performance Review',
        body: 'At day 120 of the Initial Term, the Parties shall jointly review performance against agreed key performance indicators ("KPIs"). If the mutually agreed KPIs have not been met and SSANZ cannot provide a documented remediation plan, Client may opt out of the remainder of the Initial Term upon thirty (30) days\' written notice, with no further payment obligation beyond the notice period.',
      },
      {
        number: 6,
        title: 'Termination',
        body: 'After the Initial Term, either Party may terminate this Agreement for convenience upon thirty (30) days\' prior written notice. Either Party may terminate immediately for uncured material breach following fifteen (15) days\' written notice and an opportunity to cure.',
      },
      {
        number: 7,
        title: 'Intellectual Property',
        body: 'All systems, workflows, campaigns, playbooks, and tooling developed by SSANZ shall remain the exclusive property of SSANZ during the term of engagement. Client retains ownership of its pre-existing materials, data, brand assets, and customer information provided to SSANZ.',
      },
      {
        number: 8,
        title: 'Governing Law',
        body: 'This Agreement shall be governed by the laws of the State of Delaware, without regard to its conflict of laws principles. The Parties consent to the exclusive jurisdiction of the state and federal courts located in Delaware for any dispute arising hereunder.',
      },
      {
        number: 9,
        title: 'Entire Agreement',
        body: 'This Agreement constitutes the entire agreement between the Parties with respect to its subject matter and supersedes all prior understandings, whether written or oral. Amendments must be in writing and signed by both Parties.',
      },
    ],
  },
  stripeLinks: {
    email: '',
    linkedin: '',
    fullstack: '',
  },
  calendlyUrl: COMPANY.calendlyUrl,
  meetingTitle: 'Kickoff Strategy Call',
  meetingDuration: '30 minutes',
  meetingPlatform: 'Google Meet',
  contactEmail: COMPANY.contactEmail,
};
