'use client';

import { Search, X } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from '@/components/shared/link';
import { APP_ROUTES } from '@/constants/enums';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  title: string;
  slug: string;
  firstLectureId?: string;
}

interface StudentCoursesSearchProps {
  onSearch: (query: string) => void;
  suggestions?: Suggestion[];
  placeholder?: string;
}

export default function StudentCoursesSearch({
  onSearch,
  suggestions = [],
  placeholder = 'البحث في دوراتي',
}: StudentCoursesSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [canDisable, setCanDisable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkSize = () => setCanDisable(window.innerWidth >= 640);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setOpen(false);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        if (!query && window.innerWidth < 640) {
          setIsExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [query]);

  const filtered = suggestions
    .filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);

  const showDropdown = open && query.trim().length > 0 && filtered.length > 0;

  const handleSelect = useCallback(
    (title: string) => {
      setQuery(title);
      onSearch(title);
      setOpen(false);
    },
    [onSearch],
  );

  const handleClear = () => {
    setQuery('');
    onSearch('');
    setOpen(false);
  };

  const highlight = (text: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong className="text-primary font-bold">
          {text.slice(idx, idx + query.length)}
        </strong>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-[320px]">
      <form
        onSubmit={handleSearch}
        className="flex items-center justify-end gap-2"
      >
        <InputGroup
          className={cn(
            'flex-1 h-10 rounded-lg border-muted-foreground/20 bg-background/50 overflow-hidden px-1 transition-all duration-300',
            !isExpanded && 'hidden sm:flex',
          )}
        >
          <InputGroupInput
            ref={inputRef}
            type="text"
            dir="rtl"
            value={query}
            placeholder={placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => query && setOpen(true)}
            className="flex-1 px-4 h-full border-none focus-visible:ring-0 bg-transparent text-sm"
          />

          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleClear}
              className="text-muted-foreground hover:text-primary hover:bg-transparent transition-colors"
            >
              <X size={16} />
            </Button>
          )}
        </InputGroup>

        <Button
          type="submit"
          onClick={(e) => {
            if (window.innerWidth < 640 && !isExpanded) {
              e.preventDefault();
              setIsExpanded(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }}
          disabled={canDisable && !query.trim()}
          size="icon"
          className="h-10 w-10 shrink-0 rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <Search size={18} />
        </Button>
      </form>

      {showDropdown && (
        <div
          className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 bg-background 

        border border-muted-foreground/10 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          <ScrollArea className="max-h-64">
            <ul className="py-2" dir="rtl">
              {filtered.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`${APP_ROUTES.MY_COURSES}/${s.slug}/learn`}
                    onClick={() => handleSelect(s.title)}
                    className="block w-full  px-5 py-3 text-[13px] hover:bg-primary/5 hover:text-primary 
                    transition-all border-b border-muted/30 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Search size={14} className="text-muted-foreground/50" />
                      <span>{highlight(s.title)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
