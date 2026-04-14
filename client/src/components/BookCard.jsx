import { useState } from 'react';
import { BookOpen, Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { coverFallbackColor } from '@/lib/coverColor';
import { completionPct } from '@/lib/progress';
import { cn } from '@/lib/utils';

const statusLabel = {
  want_to_read: 'Want to read',
  reading: 'Reading',
  finished: 'Finished',
};

export function BookCard({ book, onOpen, onLogSession, className }) {
  const [imgError, setImgError] = useState(false);
  const pct = completionPct(book.current_page, book.total_pages);
  const bg = coverFallbackColor(book.title);
  const cover = book.cover_image_url;
  const showCover = cover && !imgError;

  return (
    <Card
      className={cn('overflow-hidden cursor-pointer hover:shadow-md transition-shadow group', className)}
      onClick={() => onOpen?.(book)}
    >
      <div className="flex gap-3 p-3">
        <div
          className="relative h-36 w-24 shrink-0 rounded-md overflow-hidden border border-border"
          style={{ backgroundColor: showCover ? undefined : bg }}
        >
          {showCover ? (
            <img 
              src={cover} 
              alt="" 
              className="h-full w-full object-cover" 
              onError={() => setImgError(true)} 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] font-medium text-ink2 leading-tight">
              {book.title}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <div>
            <h3 className="font-serif text-base font-medium leading-snug line-clamp-2">{book.title}</h3>
            <p className="text-xs text-ink2 mt-1 line-clamp-1">{book.authors || 'Unknown author'}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[10px]">
              {statusLabel[book.status] || book.status}
            </Badge>
            {book.genres
              ? String(book.genres)
                  .split(',')
                  .slice(0, 2)
                  .map((g) => (
                    <Badge key={g} className="text-[10px] bg-cream border-border">
                      {g.trim()}
                    </Badge>
                  ))
              : null}
          </div>
          <div className="mt-auto space-y-1">
            <div className="flex justify-between text-[10px] text-ink2">
              <span>Progress</span>
              <span>
                {book.total_pages ? `${book.current_page || 0} / ${book.total_pages}` : '—'}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-cream2 border border-border overflow-hidden">
              <div className="h-full bg-folgreen transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="flex-1 text-xs h-8"
              onClick={() => onLogSession?.(book)}
            >
              <BookOpen className="h-3.5 w-3.5 mr-1" />
              Log session
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function SummaryMini({ icon: Icon = Flame, label, value, className }) {
  return (
    <Card className={cn('p-3 flex items-center gap-3', className)}>
      <div className="rounded-lg bg-terralt p-2 text-terra">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-ink2">{label}</p>
        <p className="font-serif text-xl font-medium">{value}</p>
      </div>
    </Card>
  );
}
