import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingB2B from './pages/LandingB2B';
import LandingVC from './pages/LandingVC';
import Onboarding from './pages/Onboarding';

function getPortalForHost(): 'b2b' | 'vc' {
  const host = window.location.hostname.toLowerCase();
  if (host.includes('dealflowscout')) return 'vc';
  return 'b2b';
}

function isLocalDev(): boolean {
  const host = window.location.hostname.toLowerCase();
  return host === 'localhost' || host === '127.0.0.1';
}

export default function App() {
  const portal = getPortalForHost();
  const local = isLocalDev();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={`/${portal}`} replace />} />

        {(portal === 'b2b' || local) && (
          <>
            <Route path="/b2b" element={<LandingB2B />} />
            <Route path="/b2b/onboarding" element={<Onboarding />} />
          </>
        )}

        {(portal === 'vc' || local) && (
          <>
            <Route path="/vc" element={<LandingVC />} />
            <Route path="/vc/onboarding" element={<Onboarding />} />
          </>
        )}

        <Route path="*" element={<Navigate to={`/${portal}`} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
