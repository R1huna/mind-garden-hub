import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent } from '@/types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';
import { addDays, format } from 'date-fns';

export function useCalendarEvents(userId: string | undefined) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    const allEvents = getStorageItem<CalendarEvent[]>(STORAGE_KEYS.EVENTS) || [];
    const userEvents = allEvents.filter(e => e.userId === userId);
    setEvents(userEvents);
    setIsLoading(false);
  }, [userId]);

  const saveEvents = useCallback((updatedEvents: CalendarEvent[]) => {
    const allEvents = getStorageItem<CalendarEvent[]>(STORAGE_KEYS.EVENTS) || [];
    const otherUserEvents = allEvents.filter(e => e.userId !== userId);
    setStorageItem(STORAGE_KEYS.EVENTS, [...otherUserEvents, ...updatedEvents]);
    setEvents(updatedEvents);
  }, [userId]);

  const createEvent = useCallback((
    title: string,
    date: string,
    linkedNoteId: string | null = null,
    type: 'normal' | 'review' = 'normal',
    tagColor: string = 'hsl(var(--primary))'
  ): CalendarEvent => {
    if (!userId) throw new Error('User not authenticated');

    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      userId,
      title,
      date,
      linkedNoteId,
      type,
      tagColor,
    };

    const updatedEvents = [...events, newEvent];
    saveEvents(updatedEvents);
    return newEvent;
  }, [userId, events, saveEvents]);

  const createReviewEvents = useCallback((noteId: string, noteTitle: string, baseDate: Date) => {
    if (!userId) return;

    const reviewDays = [1, 3, 7, 30];
    const reviewEvents: CalendarEvent[] = reviewDays.map(days => ({
      id: crypto.randomUUID(),
      userId,
      title: `복습: ${noteTitle}`,
      date: format(addDays(baseDate, days), 'yyyy-MM-dd'),
      linkedNoteId: noteId,
      type: 'review' as const,
      tagColor: 'hsl(var(--accent))',
    }));

    const updatedEvents = [...events, ...reviewEvents];
    saveEvents(updatedEvents);
  }, [userId, events, saveEvents]);

  const deleteEvent = useCallback((id: string) => {
    const event = events.find(e => e.id === id);
    if (event?.type === 'review') {
      // Review events can only be deleted, not modified
    }
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
