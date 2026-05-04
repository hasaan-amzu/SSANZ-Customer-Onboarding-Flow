interface FooterProps {
  domain?: string;
}

export function Footer({ domain = 'onboard.ssanzgrowthai.com' }: FooterProps) {
  return (
    <footer className="text-center py-4 border-t border-line">
      <p className="font-mono text-[11px] tracking-widest uppercase text-muted">
        SSANZ Growth AI &middot; Secure onboarding &middot; {domain}
      </p>
    </footer>
  );
}
