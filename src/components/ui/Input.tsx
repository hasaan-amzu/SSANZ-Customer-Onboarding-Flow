import { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
}

export function Input({
  label,
  required,
  error,
  hint,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold tracking-wider uppercase text-ink">
          {label}
          {required && <span className="text-gold ml-0.5">*</span>}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 text-sm bg-white border rounded-m outline-none transition-colors
          ${error ? 'border-error' : 'border-line hover:border-line-2 focus:border-gold'}
          focus:ring-2 focus:ring-gold/20 placeholder:text-muted/50`}
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
      {hint && !error && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}
