import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent } from '@/types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';
import { addDays, format } from 'date-fns';

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedEvents = getStorageItem<CalendarEvent[]>(STORAGE_KEYS.EVENTS) || [];
    setEvents(storedEvents);
    setIsLoading(false);
  }, []);

  const saveEvents = useCallback((updatedEvents: CalendarEvent[]) => {
    setStorageItem(STORAGE_KEYS.EVENTS, updatedEvents);
    setEvents(updatedEvents);
  }, []);

  const createEvent = useCallback((
    title: string,
    date: string,
    linkedNoteId: string | null = null,
    type: 'normal' | 'review' = 'normal',
    tagColor: string = 'hsl(var(--primary))'
  ): CalendarEvent => {
    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      title,
      date,
      linkedNoteId,
      type,
      tagColor,
    };

    const updatedEvents = [...events, newEvent];
    saveEvents(updatedEvents);
    return newEvent;
  }, [events, saveEvents]);

  const createReviewEvents = useCallback((noteId: string, noteTitle: string, baseDate: Date) => {
    const reviewDays = [1, 3, 7, 30];
    const reviewEvents: CalendarEvent[] = reviewDays.map(days => ({
      id: crypto.randomUUID(),
      title: `복습: ${noteTitle}`,
      date: format(addDays(baseDate, days), 'yyyy-MM-dd'),
      linkedNoteId: noteId,
      type: 'review' as const,
      tagColor: 'hsl(var(--accent))',
    }));

    const updatedEvents = [...events, ...reviewEvents];
    saveEvents(updatedEvents);
  }, [events, saveEvents]);

  const deleteEvent = useCallback((id: string) => {
    const updatedEvents = events.filter(e => e.id !== id);
    saveEvents(updatedEvents);
  }, [events, saveEvents]);

  const deleteEventsByNoteId = useCallback((noteId: string) => {
    const updatedEvents = events.filter(e => e.linkedNoteId !== noteId);
    saveEvents(updatedEvents);
  }, [events, saveEvents]);

  const getEventsByDate = useCallback((date: string): CalendarEvent[] => {
    return events.filter(e => e.date === date);
  }, [events]);

  return {
    events,
    isLoading,
    createEvent,
    createReviewEvents,
    deleteEvent,
    deleteEventsByNoteId,
    getEventsByDate,
  };
}
