import { type InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
}

export function Checkbox({ label, className = '', ...props }: CheckboxProps) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        className="mt-1 w-4 h-4 rounded border-line text-ink focus:ring-gold/20 cursor-pointer accent-ink"
        {...props}
      />
      <span className="text-sm text-ink-2 leading-relaxed">{label}</span>
    </label>
  );
}
