import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNotes } from '@/hooks/useNotes';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useTags } from '@/hooks/useTags';
import { FileText, Calendar, Tag, TrendingUp } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuthContext();
  const { notes } = useNotes(user?.id);
  const { events } = useCalendarEvents(user?.id);
  const { tags } = useTags(user?.id);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  // This week's events
  const thisWeekEvents = events.filter((event) => {
    const eventDate = parseISO(event.date);
    return isWithinInterval(eventDate, { start: weekStart, end: weekEnd });
  });

  // Recently modified notes
  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Most used tags
  const tagCounts = notes.reduce((acc, note) => {
    note.tags.forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const stats = [
    {
      title: '이번 주 일정',
      value: thisWeekEvents.length,
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: '전체 노트',
      value: notes.length,
      icon: FileText,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: '태그',
      value: tags.length,
      icon: Tag,
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
    },
    {
      title: '복습 일정',
      value: events.filter((e) => e.type === 'review').length,
      icon: TrendingUp,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
        <p className="text-muted-foreground">
          {format(today, 'yyyy년 M월 d일 EEEE', { locale: ko })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Notes */}
        <Card>
          <CardHeader>
            <CardTitle>최근 수정한 노트</CardTitle>
            <CardDescription>가장 최근에 수정된 노트들</CardDescription>
          </CardHeader>
          <CardContent>
            {recentNotes.length === 0 ? (
              <p className="text-muted-foreground text-sm">아직 작성된 노트가 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {recentNotes.map((note) => (
                  <li key={note.id}>
                    <Link
                      to={`/notes/${note.id}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{note.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(note.updatedAt), 'M/d HH:mm')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Top Tags */}
        <Card>
          <CardHeader>
            <CardTitle>자주 사용하는 태그</CardTitle>
            <CardDescription>가장 많이 사용된 태그들</CardDescription>
          </CardHeader>
          <CardContent>
            {topTags.length === 0 ? (
              <p className="text-muted-foreground text-sm">아직 사용된 태그가 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {topTags.map(([tagName, count]) => {
                  const tag = tags.find((t) => t.name === tagName);
                  return (
                    <li
                      key={tagName}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag?.color || 'hsl(var(--primary))' }}
                        />
                        <span className="font-medium text-sm">{tagName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{count}개 노트</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* This Week's Events */}
      <Card>
        <CardHeader>
          <CardTitle>이번 주 일정</CardTitle>
          <CardDescription>
            {format(weekStart, 'M월 d일', { locale: ko })} -{' '}
            {format(weekEnd, 'M월 d일', { locale: ko })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {thisWeekEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">이번 주에 예정된 일정이 없습니다.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {thisWeekEvents.map((event) => (
                <Link
                  key={event.id}
                  to={event.linkedNoteId ? `/notes/${event.linkedNoteId}` : '/calendar'}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div
                    className="w-1 h-10 rounded-full"
                    style={{ backgroundColor: event.tagColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(event.date), 'M월 d일 (E)', { locale: ko })}
                    </p>
                  </div>
                  {event.type === 'review' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                      복습
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
