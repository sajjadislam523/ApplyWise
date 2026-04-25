import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?:  string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[#8B98A8] uppercase tracking-wide">
            {label}{props.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref} id={inputId}
          className={cn(
            'h-9 w-full rounded-lg border bg-white/4 px-3 text-sm text-white placeholder:text-[#4A5568]',
            'border-white/8 hover:border-white/15 transition-colors',
            'focus:border-[#6EE7B7]/50 focus:outline-hidden focus:ring-1 focus:ring-[#6EE7B7]/30',
            error && 'border-red-700/50 focus:border-red-500/50 focus:ring-red-500/20',
            props.disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-[#4A5568]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
