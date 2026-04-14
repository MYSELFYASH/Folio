import { cn } from '@/lib/utils';

export function Progress({ value = 0, className, ...props }) {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div
      className={cn('relative h-3 w-full overflow-hidden rounded-full bg-cream2 border border-border', className)}
      {...props}
    >
      <div
        className="h-full bg-folgreen transition-all duration-500 ease-out"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
