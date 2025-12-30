import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useNotes } from '@/hooks/useNotes';
import { useTags } from '@/hooks/useTags';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function CalendarPage() {
  const { events, createEvent, deleteEvent, getEventsByDate } = useCalendarEvents();
  const { notes } = useNotes();
  const { tags } = useTags();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('none');
  const [selectedTagColor, setSelectedTagColor] = useState('hsl(var(--primary))');

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const selectedDateEvents = getEventsByDate(dateString);

  // Get dates with events for highlighting
  const eventDates = events.reduce((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  const handleCreateEvent = () => {
    if (!newEventTitle.trim()) {
      toast({
        title: '오류',
        description: '일정 제목을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    createEvent(
      newEventTitle,
      dateString,
      selectedNoteId === 'none' ? null : selectedNoteId,
      'normal',
      selectedTagColor
    );

    setNewEventTitle('');
    setSelectedNoteId('none');
    setSelectedTagColor('hsl(var(--primary))');
    setIsDialogOpen(false);

    toast({
      title: '일정 추가',
      description: '새 일정이 추가되었습니다.',
    });
  };

  const handleDeleteEvent = (eventId: string, type: string) => {
    deleteEvent(eventId);
    toast({
      title: '일정 삭제',
      description: type === 'review' ? '복습 일정이 삭제되었습니다.' : '일정이 삭제되었습니다.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">달력</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              일정 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 일정 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>날짜</Label>
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, 'yyyy년 M월 d일 (E)', { locale: ko })}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-title">제목</Label>
                <Input
                  id="event-title"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="일정 제목"
                />
              </div>
              <div className="space-y-2">
                <Label>연결할 노트 (선택)</Label>
                <Select value={selectedNoteId} onValueChange={setSelectedNoteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="노트 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">없음</SelectItem>
                    {notes.map((note) => (
                      <SelectItem key={note.id} value={note.id}>
                        {note.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>색상</Label>
                <div className="flex gap-2 flex-wrap">
                  {['hsl(var(--primary))', 'hsl(var(--accent))', ...tags.map((t) => t.color)].map(
                    (color, idx) => (
                      <button
                        key={idx}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          selectedTagColor === color
                            ? 'border-foreground scale-110'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedTagColor(color)}
                      />
                    )
                  )}
                </div>
              </div>
              <Button onClick={handleCreateEvent} className="w-full">
                일정 추가
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Calendar */}
        <Card>
          <CardContent className="p-4">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ko}
              className="w-full"
              modifiers={{
                hasEvent: (date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  return !!eventDates[dateStr];
                },
              }}
              modifiersStyles={{
                hasEvent: {
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                  textDecorationColor: 'hsl(var(--primary))',
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Selected Date Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {format(selectedDate, 'M월 d일 (E)', { locale: ko })} 일정
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                이 날에 예정된 일정이 없습니다.
              </p>
            ) : (
              <ul className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border"
                  >
                    <div
                      className="w-1 h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: event.tagColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      {event.type === 'review' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                          복습
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {event.linkedNoteId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/notes/${event.linkedNoteId}`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEvent(event.id, event.type)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
