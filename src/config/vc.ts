import type { PortalConfig } from '../types/portal';
import { COMPANY, VC_BRANDING } from './shared';

const IP_BODY = [
  'The DealFlow Scout platform, including all software, systems, algorithms, workflows,',
  'automations, interfaces, templates, dashboards, documentation, and related tooling,',
  'shall remain the exclusive property of SSANZ and its licensors.',
  '\n\nClient retains ownership of its pre-existing materials, uploaded content, proprietary',
  'business information, customer information, and data provided to SSANZ in connection',
  'with use of the platform.',
  '\n\nSubject to Client\'s compliance with this Agreement, SSANZ grants Client a limited,',
  'non-transferable, non-exclusive right to access and use the DealFlow Scout platform',
  'during the Term solely for Client\'s internal business purposes.',
].join(' ');

const SERVICES_BODY = [
  'SSANZ will provide the services and access described in the applicable DealFlow Scout',
  'package, including onboarding, account configuration, platform access, AI-powered deal',
  'sourcing functionality, workflow setup, and ongoing platform support and optimization.',
  '\n\nDealFlow Scout is a software-as-a-service ("SaaS") platform designed to assist Client',
  'with identifying, organizing, and managing potential opportunities, leads, or acquisition',
  'targets through AI-assisted search, filtering, enrichment, and workflow automation tools.',
  'Client acknowledges that platform features, integrations, and functionality may evolve',
  'over time as SSANZ continues to improve and update the platform.',
  '\n\nSSANZ will use commercially reasonable efforts to maintain platform availability and',
  'perform the Services in a professional and workmanlike manner.',
].join(' ');

const PLATFORM_REVIEW_BODY = [
  'SSANZ will provide commercially reasonable onboarding, support, and ongoing optimization',
  'for the DealFlow Scout platform during the Term. Client acknowledges that DealFlow Scout',
  'is a software platform and that results may vary based on Client usage, market conditions,',
  'data availability, and other external factors outside SSANZ\'s control.',
  '\n\nUnless expressly stated in writing, SSANZ does not guarantee any specific business results,',
  'deal flow volume, revenue outcomes, or acquisition opportunities through use of the platform.',
].join(' ');

export const vcConfig: PortalConfig = {
  portalType: 'vc',
  branding: VC_BRANDING,
  landing: {
    eyebrow: 'DEALFLOW SCOUT',
    headline: 'AI-Powered',
    headlineAccent: 'Deal Sourcing Engine',
    description: 'Identify, organize, and manage potential opportunities through AI-assisted search, filtering, enrichment, and workflow automation.',
    ctaText: 'Get started',
  },
  packages: [
    {
      id: 'dealflow',
      name: 'DealFlow Scout',
      description: 'AI-Powered Deal Sourcing Engine — full platform access, onboarding, configuration, and ongoing support.',
      setupFee: 15000,
      monthlyFee: 5000,
    },
  ],
  packageNote: '6-month initial engagement, month-to-month thereafter.',
  formFields: {
    showWebsite: true,
    showIndustry: true,
    showReferral: true,
  },
  industries: [
    'Venture Capital',
    'Private Equity',
    'Family Office',
    'Angel Investing',
    'Corporate Development / M&A',
    'Real Estate Investment',
    'Fund of Funds',
    'Other',
  ],
  referralOptions: [
    'LinkedIn',
    'Referral',
    'Conference / Event',
    'Google search',
    'Case study',
    'Other',
  ],
  contract: {
    entityName: COMPANY.legalName,
    entityType: COMPANY.entityType,
    jurisdiction: 'Texas',
    clauses: [
      {
        number: 1,
        title: 'Services',
        body: SERVICES_BODY,
      },
      {
        number: 2,
        title: 'Platform Review & Support',
        body: PLATFORM_REVIEW_BODY,
      },
      {
        number: 3,
        title: 'Fees & Payment',
        body: 'Client shall pay SSANZ a one-time setup fee of {{SETUP_FEE}}, due on the Effective Date, and a recurring monthly service fee of {{MONTHLY_FEE}}, billed on the same day each month thereafter for the Term. All fees are in U.S. dollars and are non-refundable.',
      },
      {
        number: 4,
        title: 'Term',
        body: 'This Agreement commences on the Effective Date and continues for an initial term of six (6) months (the "Initial Term"). Thereafter, it shall continue on a month-to-month basis until terminated in accordance with Section 6.',
      },
      {
        number: 5,
        title: 'Confidentiality',
        body: 'Each Party agrees to hold in strict confidence all non-public information disclosed by the other Party in connection with this Agreement. This obligation shall survive termination for a period of two (2) years and excludes information that is publicly available, independently developed, or required to be disclosed by law.',
      },
      {
        number: 6,
        title: 'Termination',
        body: 'After the Initial Term, either Party may terminate this Agreement for convenience upon thirty (30) days\' prior written notice. Either Party may terminate immediately for uncured material breach following fifteen (15) days\' written notice and an opportunity to cure.',
      },
      {
        number: 7,
        title: 'Intellectual Property',
        body: IP_BODY,
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
    dealflow: import.meta.env.VITE_STRIPE_VC_DEALFLOW || '',
  },
  calendarEmbedUrl: COMPANY.calendarEmbedUrl,
  meetingTitle: 'Platform Onboarding Call',
  meetingDuration: '30 minutes',
  meetingPlatform: 'Google Meet',
  contactEmail: VC_BRANDING.contactEmail,
};
