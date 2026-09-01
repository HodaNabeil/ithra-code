import { cn } from '@/lib/utils';
import * as React from 'react';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground hover:border-gray-alpha-300 placeholder:text-muted-foreground placeholder:text-sm selection:bg-primary selection:text-primary-foreground dark:border-gray-alpha-200 border-input h-11.5 w-full min-w-0 rounded-md border bg-card px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring!',
        'aria-invalid:ring-destructive dark:aria-invalid:ring-destructive aria-invalid:focus-visible:border-none  rounded-full  px-4',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
