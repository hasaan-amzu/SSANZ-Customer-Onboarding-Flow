import { type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  error?: string | null;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  required,
  error,
  options,
  placeholder,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold tracking-wider uppercase text-ink">
          {label}
          {required && <span className="text-gold ml-0.5">*</span>}
        </label>
      )}
      <select
        className={`w-full px-4 py-3 text-sm bg-white border rounded-m outline-none transition-colors appearance-none
          ${error ? 'border-error' : 'border-line hover:border-line-2 focus:border-gold'}
          focus:ring-2 focus:ring-gold/20`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
