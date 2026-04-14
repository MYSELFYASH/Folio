import { cn } from '@/lib/utils';

export function Badge({ className, variant = 'default', ...props }) {
  const variants = {
    default: 'border-transparent bg-terralt text-ink border border-border',
    success: 'border-transparent bg-folgreenlt text-folgreen border border-folgreen/30',
    outline: 'text-ink border-border',
  };
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
