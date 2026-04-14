import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StarRating({ value = 0, onChange, readOnly = false, className }) {
  const v = Math.min(5, Math.max(0, Number(value) || 0));
  return (
    <div className={cn('flex items-center gap-0.5', className)} role={readOnly ? undefined : 'radiogroup'}>
      {[1, 2, 3, 4, 5].map((n) =>
        readOnly ? (
          <Star
            key={n}
            className={cn('h-5 w-5', n <= v ? 'fill-terra text-terra' : 'text-ink3')}
            aria-hidden
          />
        ) : (
          <button
            key={n}
            type="button"
            aria-label={`${n} stars`}
            className="rounded p-0.5 transition-colors hover:scale-105 focus:outline-none focus:ring-2 focus:ring-terra"
            onClick={() => onChange?.(n)}
          >
            <Star className={cn('h-6 w-6', n <= v ? 'fill-terra text-terra' : 'text-ink3')} />
          </button>
        )
      )}
    </div>
  );
}
