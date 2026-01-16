import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Note {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  content: string;
  tags: string[];
  isReviewEnabled: boolean;
  isClassEnabled: boolean;
  classroom?: string;
  professor?: string;
  createdAt: string;
  updatedAt: string;
}

interface DbNote {
  id: string;
  user_id: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  content: string;
  is_review_enabled: boolean;
  is_class_enabled: boolean;
  classroom: string | null;
  professor: string | null;
  created_at: string;
  updated_at: string;
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotes = useCallback(async () => {
    if (!user) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const { data: notesData, error } = await supabase
      .from('notes')
      .select(`
        *,
        note_tags(
          tag_id,
          tags(name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      setIsLoading(false);
      return;
    }

    const formattedNotes: Note[] = (notesData || []).map((note: any) => ({
      id: note.id,
      title: note.title,
      subtitle: note.subtitle || undefined,
      summary: note.summary || undefined,
      content: note.content,
      tags: note.note_tags?.map((nt: any) => nt.tags?.name).filter(Boolean) || [],
      isReviewEnabled: note.is_review_enabled,
      isClassEnabled: note.is_class_enabled,
      classroom: note.classroom || undefined,
      professor: note.professor || undefined,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    }));

    setNotes(formattedNotes);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const createNote = useCallback(async (title: string, content: string, tags: string[] = []): Promise<Note | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title,
        content,
        is_review_enabled: false,
        is_class_enabled: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return null;
    }

    // Handle tags
    if (tags.length > 0) {
      for (const tagName of tags) {
        // Get or create tag
        let { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', tagName)
          .single();

        let tagId = existingTag?.id;

        if (!tagId) {
          const { data: newTag } = await supabase
            .from('tags')
            .insert({ user_id: user.id, name: tagName })
            .select('id')
            .single();
          tagId = newTag?.id;
        }

        if (tagId) {
          await supabase
            .from('note_tags')
            .insert({ note_id: data.id, tag_id: tagId });
        }
      }
    }

    await fetchNotes();

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      tags,
      isReviewEnabled: data.is_review_enabled,
      isClassEnabled: data.is_class_enabled,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }, [user, fetchNotes]);

  const updateNote = useCallback(async (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    if (!user) return;

    const dbUpdates: Partial<DbNote> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.subtitle !== undefined) dbUpdates.subtitle = updates.subtitle || null;
    if (updates.summary !== undefined) dbUpdates.summary = updates.summary || null;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.isReviewEnabled !== undefined) dbUpdates.is_review_enabled = updates.isReviewEnabled;
    if (updates.isClassEnabled !== undefined) dbUpdates.is_class_enabled = updates.isClassEnabled;
    if (updates.classroom !== undefined) dbUpdates.classroom = updates.classroom || null;
    if (updates.professor !== undefined) dbUpdates.professor = updates.professor || null;

    const { error } = await supabase
      .from('notes')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating note:', error);
      return;
    }

    // Handle tags update if provided
    if (updates.tags !== undefined) {
      // Remove existing tags
      await supabase
        .from('note_tags')
        .delete()
        .eq('note_id', id);

      // Add new tags
      for (const tagName of updates.tags) {
        let { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', tagName)
          .single();

        let tagId = existingTag?.id;

        if (!tagId) {
          const { data: newTag } = await supabase
            .from('tags')
            .insert({ user_id: user.id, name: tagName })
            .select('id')
            .single();
          tagId = newTag?.id;
        }

        if (tagId) {
          await supabase
            .from('note_tags')
            .insert({ note_id: id, tag_id: tagId });
        }
      }
    }

    await fetchNotes();
  }, [user, fetchNotes]);

  const deleteNote = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting note:', error);
      return;
    }

    await fetchNotes();
  }, [fetchNotes]);

  const getNoteById = useCallback((id: string): Note | undefined => {
    return notes.find(n => n.id === id);
  }, [notes]);

  return {
    notes,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    getNoteById,
    refetch: fetchNotes,
  };
}
