import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, format } from 'date-fns';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  linkedNoteId: string | null;
  type: 'normal' | 'review';
  tagColor: string;
}

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      setIsLoading(false);
      return;
    }

    const formattedEvents: CalendarEvent[] = (data || []).map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      linkedNoteId: event.linked_note_id,
      type: event.type as 'normal' | 'review',
      tagColor: event.tag_color,
    }));

    setEvents(formattedEvents);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = useCallback(async (
    title: string,
    date: string,
    linkedNoteId: string | null = null,
    type: 'normal' | 'review' = 'normal',
    tagColor: string = '#3B82F6'
  ): Promise<CalendarEvent | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        user_id: user.id,
        title,
        date,
        linked_note_id: linkedNoteId,
        type,
        tag_color: tagColor,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return null;
    }

    await fetchEvents();

    return {
      id: data.id,
      title: data.title,
      date: data.date,
      linkedNoteId: data.linked_note_id,
      type: data.type as 'normal' | 'review',
      tagColor: data.tag_color,
    };
  }, [user, fetchEvents]);

  const createReviewEvents = useCallback(async (noteId: string, noteTitle: string, baseDate: Date) => {
    if (!user) return;

    const reviewDays = [1, 3, 7, 30];
    const reviewEvents = reviewDays.map(days => ({
      user_id: user.id,
      title: `복습: ${noteTitle}`,
      date: format(addDays(baseDate, days), 'yyyy-MM-dd'),
      linked_note_id: noteId,
      type: 'review' as const,
      tag_color: '#8B5CF6',
    }));

    const { error } = await supabase
      .from('calendar_events')
      .insert(reviewEvents);

    if (error) {
      console.error('Error creating review events:', error);
      return;
    }

    await fetchEvents();
  }, [user, fetchEvents]);

  const deleteEvent = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      return;
    }

    await fetchEvents();
  }, [fetchEvents]);

  const deleteEventsByNoteId = useCallback(async (noteId: string) => {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('linked_note_id', noteId);

    if (error) {
      console.error('Error deleting events by note id:', error);
      return;
    }

    await fetchEvents();
  }, [fetchEvents]);

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
    refetch: fetchEvents,
  };
}
