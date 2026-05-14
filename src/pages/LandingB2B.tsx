import { useNavigate } from 'react-router-dom';
import { b2bConfig } from '../config/b2b';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';

export default function LandingB2B() {
  const navigate = useNavigate();
  const { landing, branding } = b2bConfig;

  return (
    <div className="min-h-screen dotted-bg flex flex-col">
      <Header branding={branding} />
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center py-20">
          <div className="inline-block px-4 py-1.5 border border-line rounded-full text-xs font-mono tracking-widest uppercase text-muted bg-white mb-8">
            {landing.eyebrow}
          </div>
          <h1 className="font-head text-4xl md:text-6xl font-black text-ink leading-tight mb-6">
            {landing.headline}{' '}
            <span className="text-gold">{landing.headlineAccent}</span>
            <br />
            with {branding.name} {branding.nameAccent}.
          </h1>
          <p className="text-muted text-lg md:text-xl max-w-lg mx-auto mb-10 leading-relaxed">
            {landing.description}
          </p>
          <Button size="lg" onClick={() => navigate('/b2b/onboarding')}>
            {landing.ctaText}
            <span aria-hidden="true"> &rarr;</span>
          </Button>
        </div>
      </main>
    </div>
  );
}
