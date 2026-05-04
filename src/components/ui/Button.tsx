import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  size?: 'default' | 'lg';
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed rounded-m';

  const variants = {
    primary: 'bg-ink text-white hover:bg-gold hover:text-ink',
    ghost: 'bg-transparent text-ink border border-line hover:border-ink',
  };

  const sizes = {
    default: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
