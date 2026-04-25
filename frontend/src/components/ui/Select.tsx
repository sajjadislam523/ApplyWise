import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:       string;
  error?:       string;
  options:      { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium text-[#8B98A8] uppercase tracking-wide">
            {label}{props.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref} id={selectId}
          className={cn(
            'h-9 w-full rounded-lg border bg-[#0F1419] px-3 text-sm text-white transition-colors',
            'border-white/8 hover:border-white/15',
            'focus:border-[#6EE7B7]/50 focus:outline-hidden focus:ring-1 focus:ring-[#6EE7B7]/30',
            error && 'border-red-700/50',
            props.disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        >
          {placeholder && <option value="" className="bg-[#0F1419]">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#0F1419]">{o.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
