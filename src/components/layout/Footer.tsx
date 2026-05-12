import type { Branding } from '../../types/portal';
import { B2B_BRANDING } from '../../config/shared';

interface FooterProps {
  branding?: Branding;
}

export function Footer({ branding = B2B_BRANDING }: FooterProps) {
  return (
    <footer className="text-center py-4 border-t border-line">
      <p className="font-mono text-[11px] tracking-widest uppercase text-muted">
        {branding.name} {branding.nameAccent} &middot; Secure onboarding &middot; {branding.domain}
      </p>
    </footer>
  );
}
