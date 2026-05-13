import { Link } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import type { Branding } from '../../types/portal';

interface PortalShellProps {
  step: number;
  portalType: 'b2b' | 'vc';
  branding?: Branding;
  showStepIndicator?: boolean;
  children: React.ReactNode;
}

const PORTAL_TITLES: Record<string, { label: string; accent: string }> = {
  b2b: { label: 'B2B Client', accent: 'Onboarding' },
  vc: { label: 'Venture Capital Client', accent: 'Onboarding' },
};

export function PortalShell({ step, portalType, branding, showStepIndicator = true, children }: PortalShellProps) {
  const title = PORTAL_TITLES[portalType] || PORTAL_TITLES.b2b;
  const progress = ((Math.min(step, 4) - 1) / 3) * 100;

  return (
    <div className="min-h-screen flex flex-col dotted-bg">
      <Header branding={branding} />
      <main className="flex-1 w-full max-w-[780px] mx-auto px-5 md:px-6 py-5">
        <Link
          to={`/${portalType}`}
          className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-ink/60 hover:text-ink transition-colors mb-3 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full w-fit border border-line/50"
        >
          &larr; Back to portal
        </Link>

        <div className="flex items-baseline justify-between mb-2">
          <h1 className="font-head text-2xl md:text-3xl font-bold text-ink leading-tight">
            {title.label}{' '}
            <span className="text-gold">{title.accent}</span>
          </h1>
          {showStepIndicator && (
            <span className="font-mono text-[10px] tracking-widest uppercase text-muted">
              Step {Math.min(step, 4)} of 4
            </span>
          )}
        </div>

        <div className="progress-bar mb-5">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-line/50 px-5 md:px-7 py-5 md:py-6">
          {children}
        </div>
      </main>
      <Footer branding={branding} />
    </div>
  );
}
