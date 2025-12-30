import { useState, useEffect, useCallback } from 'react';
import { Note } from '@/types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

export function useNotes(userId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    const allNotes = getStorageItem<Note[]>(STORAGE_KEYS.NOTES) || [];
    const userNotes = allNotes.filter(n => n.userId === userId);
    setNotes(userNotes);
    setIsLoading(false);
  }, [userId]);

  const saveNotes = useCallback((updatedNotes: Note[]) => {
    const allNotes = getStorageItem<Note[]>(STORAGE_KEYS.NOTES) || [];
    const otherUserNotes = allNotes.filter(n => n.userId !== userId);
    setStorageItem(STORAGE_KEYS.NOTES, [...otherUserNotes, ...updatedNotes]);
    setNotes(updatedNotes);
  }, [userId]);

  const createNote = useCallback((title: string, content: string, tags: string[] = []): Note => {
    if (!userId) throw new Error('User not authenticated');

    const newNote: Note = {
      id: crypto.randomUUID(),
      userId,
      title,
      content,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedNotes = [...notes, newNote];
    saveNotes(updatedNotes);
    return newNote;
  }, [userId, notes, saveNotes]);

  const updateNote = useCallback((id: string, updates: Partial<Omit<Note, 'id' | 'userId' | 'createdAt'>>) => {
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
