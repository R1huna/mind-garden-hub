import { useState, useEffect, useCallback } from 'react';
import { Note } from '@/types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedNotes = getStorageItem<Note[]>(STORAGE_KEYS.NOTES) || [];
    setNotes(storedNotes);
    setIsLoading(false);
  }, []);

  const saveNotes = useCallback((updatedNotes: Note[]) => {
    setStorageItem(STORAGE_KEYS.NOTES, updatedNotes);
    setNotes(updatedNotes);
  }, []);

  const createNote = useCallback((title: string, content: string, tags: string[] = []): Note => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title,
      content,
      tags,
      isReviewEnabled: false,
      isClassEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedNotes = [...notes, newNote];
    saveNotes(updatedNotes);
    return newNote;
  }, [notes, saveNotes]);

  const updateNote = useCallback((id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    const updatedNotes = notes.map(note =>
      note.id === id
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note
    );
    saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  const deleteNote = useCallback((id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    saveNotes(updatedNotes);
  }, [notes, saveNotes]);

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
  };
}
