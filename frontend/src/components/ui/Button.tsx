import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?:    'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#080C10]';

    const variants = {
      primary:   'bg-[#6EE7B7] text-[#080C10] hover:bg-[#5BCFAA] focus:ring-[#6EE7B7]/50 font-semibold shadow-[0_0_20px_rgba(110,231,183,0.2)] hover:shadow-[0_0_30px_rgba(110,231,183,0.35)]',
      secondary: 'bg-white/5 text-[#8B98A8] border border-white/10 hover:bg-white/8 hover:text-white focus:ring-white/20',
      ghost:     'bg-transparent text-[#8B98A8] hover:bg-white/5 hover:text-white focus:ring-white/20',
      danger:    'bg-red-600/80 text-white hover:bg-red-600 focus:ring-red-500/50 border border-red-700/50',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2   text-sm gap-2',
      lg: 'px-5 py-2.5 text-sm gap-2',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
