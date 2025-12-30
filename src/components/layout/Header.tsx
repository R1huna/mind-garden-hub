import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sun, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useNotes } from '@/hooks/useNotes';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useTags } from '@/hooks/useTags';
import { useAuthContext } from '@/contexts/AuthContext';

export function Header() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { notes } = useNotes(user?.id);
  const { events } = useCalendarEvents(user?.id);
  const { tags } = useTags(user?.id);

  const handleSelect = (type: string, id: string) => {
    setOpen(false);
    switch (type) {
      case 'note':
        navigate(`/notes/${id}`);
        break;
      case 'event':
        navigate('/calendar');
        break;
      case 'tag':
        navigate(`/tags?filter=${id}`);
        break;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      {/* Search */}
      <div className="flex-1 max-w-md ml-12 lg:ml-0">
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">검색...</span>
          <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground ml-auto">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      {/* Theme toggle */}
      <Button variant="ghost" size="icon" onClick={toggleTheme}>
        {theme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>

      {/* Search Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="노트, 일정, 태그 검색..." />
        <CommandList>
          <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>

          {notes.length > 0 && (
            <CommandGroup heading="노트">
              {notes.slice(0, 5).map((note) => (
                <CommandItem
                  key={note.id}
                  onSelect={() => handleSelect('note', note.id)}
                >
                  {note.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {events.length > 0 && (
            <CommandGroup heading="일정">
              {events.slice(0, 5).map((event) => (
                <CommandItem
                  key={event.id}
                  onSelect={() => handleSelect('event', event.id)}
                >
                  {event.title} - {event.date}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {tags.length > 0 && (
            <CommandGroup heading="태그">
              {tags.map((tag) => (
                <CommandItem
                  key={tag.id}
                  onSelect={() => handleSelect('tag', tag.name)}
                >
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </header>
  );
}
