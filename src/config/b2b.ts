import type { PortalConfig } from '../types/portal';
import { COMPANY, INDUSTRIES, REFERRAL_OPTIONS } from './shared';

export const b2bConfig: PortalConfig = {
  portalType: 'b2b',
  landing: {
    eyebrow: 'B2B CLIENT ONBOARDING',
    headline: 'Begin your',
    headlineAccent: 'engagement',
    description: 'A concierge onboarding experience for founders and revenue leaders deploying our AI growth engines across email, LinkedIn, and full-stack workflows.',
    ctaText: 'Begin onboarding',
  },
  packages: [
    {
      id: 'email',
      name: 'Email Only',
      description: 'Outbound email system. Ideal for B2B lead gen via inbox.',
      setupFee: 6300,
      monthlyFee: 4700,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Only',
      description: 'LinkedIn outreach + profile optimization. Human-led.',
      setupFee: 6300,
      monthlyFee: 4700,
    },
    {
      id: 'fullstack',
      name: 'Full Stack AI',
      description: 'Email + LinkedIn + AI workflows. End-to-end pipeline.',
      setupFee: 8900,
      monthlyFee: 7900,
      recommended: true,
    },
  ],
  packageNote: 'All packages are 6-month engagements with a 120-day review clause.',
  formFields: {
    showWebsite: true,
    showIndustry: true,
    showReferral: true,
  },
  industries: INDUSTRIES,
  referralOptions: REFERRAL_OPTIONS,
  contract: {
    entityName: COMPANY.legalName,
    entityType: COMPANY.entityType,
    jurisdiction: 'Texas',
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
        body: 'This Agreement shall be governed by the laws of the State of Texas, without regard to its conflict of laws principles. The Parties consent to the exclusive jurisdiction of the state and federal courts located in Texas for any dispute arising hereunder.',
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
  calendarEmbedUrl: COMPANY.calendarEmbedUrl,
  meetingTitle: 'Kickoff Strategy Call',
  meetingDuration: '30 minutes',
  meetingPlatform: 'Google Meet',
  contactEmail: COMPANY.contactEmail,
};
