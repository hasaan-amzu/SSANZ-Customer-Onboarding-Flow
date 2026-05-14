import { Link } from 'react-router-dom';
import type { Branding } from '../../types/portal';
import { B2B_BRANDING } from '../../config/shared';

interface HeaderProps {
  branding?: Branding;
}

export function Header({ branding = B2B_BRANDING }: HeaderProps) {
  return (
    <header className="border-b border-line bg-white/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 md:px-10 flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center">
            <span className="text-white font-bold text-sm">{branding.icon}</span>
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight text-ink">
              {branding.name} <span className="text-gold font-bold">{branding.nameAccent}</span>
            </div>
            <div className="text-[9px] font-mono tracking-[0.2em] uppercase text-muted">
              Onboarding Portal
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-5 text-[13px] text-muted">
          <a href={branding.website} target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-colors">
            {new URL(branding.website).hostname.replace(/^www\./, '')}
          </a>
        </nav>
      </div>
    </header>
  );
}
