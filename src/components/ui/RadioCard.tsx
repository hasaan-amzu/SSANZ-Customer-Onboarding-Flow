import type { Package } from '../../types/portal';

interface RadioCardProps {
  pkg: Package;
  selected: boolean;
  onSelect: () => void;
  formatMoney: (n: number) => string;
  optionLabel?: string;
}

export function RadioCard({ pkg, selected, onSelect, formatMoney, optionLabel }: RadioCardProps) {
  return (
    <label
      onClick={onSelect}
      className={`relative flex flex-col p-3.5 border rounded-xl cursor-pointer transition-all duration-200
        ${selected
          ? 'border-gold bg-gold/8 shadow-subtle ring-1 ring-gold/30'
          : 'border-line bg-white hover:border-line-2 hover:shadow-subtle'
        }`}
    >
      <div className="mb-2">
        {pkg.recommended ? (
          <span className="text-[9px] font-bold tracking-widest uppercase text-gold">
            Recommended
          </span>
        ) : optionLabel ? (
          <span className="text-[9px] font-bold tracking-widest uppercase text-muted">
            {optionLabel}
          </span>
        ) : null}
      </div>

      <div className="font-head text-sm text-ink mb-1">{pkg.name}</div>
      <div className="text-xs text-muted mb-3 flex-1 leading-relaxed">{pkg.description}</div>

      <div className="mt-auto">
        {pkg.pricingLabel ? (
          <div className="text-sm font-bold text-ink">{pkg.pricingLabel}</div>
        ) : (
          <>
            <div className="text-sm font-bold text-ink">
              {formatMoney(pkg.monthlyFee)} / month
            </div>
            <div className="text-[11px] text-muted">
              + {formatMoney(pkg.setupFee)} one-time setup
            </div>
          </>
        )}
      </div>
    </label>
  );
}
