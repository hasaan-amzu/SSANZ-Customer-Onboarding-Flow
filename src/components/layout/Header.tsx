import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="border-b border-line bg-white/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 md:px-10 flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight text-ink">
              SSANZ <span className="text-gold font-bold">Growth AI</span>
            </div>
            <div className="text-[9px] font-mono tracking-[0.2em] uppercase text-muted">
              Onboarding Portal
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-5 text-[13px] text-muted">
          <a href="https://www.ssanzgrowthai.inc/" target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-colors">
            ssanzgrowthai.inc
          </a>
        </nav>
      </div>
    </header>
  );
}
