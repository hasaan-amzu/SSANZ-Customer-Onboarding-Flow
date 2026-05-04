import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingB2B from './pages/LandingB2B';
import LandingVC from './pages/LandingVC';
import Onboarding from './pages/Onboarding';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/b2b" replace />} />
        <Route path="/b2b" element={<LandingB2B />} />
        <Route path="/vc" element={<LandingVC />} />
        <Route path="/:portalType/onboarding" element={<Onboarding />} />
      </Routes>
    </BrowserRouter>
  );
}
