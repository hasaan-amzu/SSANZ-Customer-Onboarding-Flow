import { useState, useMemo } from 'react';
import type { PortalConfig, FormData } from '../../types/portal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { RadioCard } from '../ui/RadioCard';
import { Button } from '../ui/Button';

interface StepDetailsProps {
  config: PortalConfig;
  data: FormData;
  onChange: (partial: Partial<FormData>) => void;
  onNext: () => void;
  saving?: boolean;
}

const OPTION_LABELS = ['Option A', 'Option B', 'Option C'];

export function StepDetails({ config, data, onChange, onNext, saving }: StepDetailsProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  const formatMoney = (n: number) => '$' + n.toLocaleString();

  const requiredFields = useMemo(() => {
    const fields = ['fullName', 'email', 'phone', 'company', 'role', 'packageId'];
    if (config.formFields.showIndustry) fields.push('industry');
    return fields;
  }, [config.formFields.showIndustry]);

  const getError = (field: string): string | null => {
    if (!touched[field]) return null;
    const value = (data[field as keyof FormData] || '').trim();
    if (!value) return 'Required';
    if (field === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return 'Enter a valid email';
    if (field === 'phone' && !/^\+?[\d\s\-().]{7,20}$/.test(value)) return 'Enter a valid phone number';
    return null;
  };

  const isValid = requiredFields.every(field => {
    const value = (data[field as keyof FormData] || '').trim();
    if (!value) return false;
    if (field === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return false;
    if (field === 'phone' && !/^\+?[\d\s\-().]{7,20}$/.test(value)) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const all: Record<string, boolean> = {};
    requiredFields.forEach(f => { all[f] = true; });
    setTouched(all);
    if (isValid) onNext();
  };

  const industryOptions = config.industries.map(i => ({ value: i, label: i }));
  const referralOptions = config.referralOptions.map(r => ({ value: r, label: r }));

  return (
    <form className="step-enter" onSubmit={handleSubmit} noValidate>
      <div className="font-mono text-[10px] tracking-widest uppercase text-gold mb-0.5">
        Step 01
      </div>
      <h2 className="font-head text-xl md:text-2xl font-extrabold text-ink mb-0.5">
        Client details
      </h2>
      <p className="text-muted text-sm mb-4">
        Tell us who you are and which engagement fits best.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <Input label="Full name" required type="text" autoComplete="name" maxLength={200}
          value={data.fullName} onChange={e => onChange({ fullName: e.target.value })}
          onBlur={() => touch('fullName')} placeholder="Jane Doe" error={getError('fullName')} />
        <Input label="Email" required type="email" autoComplete="email" maxLength={254}
          value={data.email} onChange={e => onChange({ email: e.target.value })}
          onBlur={() => touch('email')} placeholder="jane@company.com" error={getError('email')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <Input label="Phone" required type="tel" autoComplete="tel" maxLength={30}
          value={data.phone} onChange={e => onChange({ phone: e.target.value })}
          onBlur={() => touch('phone')} placeholder="+1 555 123 4567" error={getError('phone')} />
        <Input label="Company" required type="text" autoComplete="organization" maxLength={200}
          value={data.company} onChange={e => onChange({ company: e.target.value })}
          onBlur={() => touch('company')} placeholder="Acme Inc." error={getError('company')} />
      </div>

      <div className={`grid grid-cols-1 ${config.formFields.showWebsite ? 'md:grid-cols-2' : ''} gap-3 mb-3`}>
        <Input label="Role / Title" required type="text" maxLength={150}
          value={data.role} onChange={e => onChange({ role: e.target.value })}
          onBlur={() => touch('role')} placeholder="CEO / Head of Growth" error={getError('role')} />
        {config.formFields.showWebsite && (
          <Input label="Company website" type="url" maxLength={300}
            value={data.website} onChange={e => onChange({ website: e.target.value })}
            placeholder="company.com" hint="Optional — reference only" />
        )}
      </div>

      {(config.formFields.showIndustry || config.formFields.showReferral) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {config.formFields.showIndustry && (
            <Select label="Industry / Sector" required
              value={data.industry} onChange={e => onChange({ industry: e.target.value })}
              onBlur={() => touch('industry')} placeholder="Select industry..."
              options={industryOptions} error={getError('industry')} />
          )}
          {config.formFields.showReferral && (
            <Select label="How did you hear about us?"
              value={data.referral} onChange={e => onChange({ referral: e.target.value })}
              placeholder="Select one..." options={referralOptions} />
          )}
        </div>
      )}

      <div className="mt-4 mb-2">
        <div className="font-mono text-[10px] tracking-widest uppercase text-muted mb-2">
          Select your package
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-2">
        {config.packages.map((pkg, i) => (
          <RadioCard key={pkg.id} pkg={pkg} selected={data.packageId === pkg.id}
            onSelect={() => onChange({ packageId: pkg.id })} formatMoney={formatMoney}
            optionLabel={!pkg.recommended ? OPTION_LABELS[i] : undefined} />
        ))}
      </div>
      {touched.packageId && !data.packageId && (
        <span className="text-xs text-error block mt-1">Please select a package to continue</span>
      )}

      <div className="text-center mt-2 mb-4">
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted">
          6-month partnership &middot; 120-day satisfaction guarantee
        </span>
      </div>

      <div className="flex justify-center">
        <Button type="submit" size="lg" disabled={!isValid || saving}>
          {saving ? 'Saving...' : 'Continue'}
          {!saving && <span aria-hidden="true" className="ml-2">&rarr;</span>}
        </Button>
      </div>
    </form>
  );
}
