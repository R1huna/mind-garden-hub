import { useState, useEffect, useCallback } from 'react';
import { Tag } from '@/types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

const DEFAULT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(220, 70%, 50%)',
  'hsl(280, 70%, 50%)',
  'hsl(340, 70%, 50%)',
  'hsl(160, 70%, 40%)',
  'hsl(30, 70%, 50%)',
];

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedTags = getStorageItem<Tag[]>(STORAGE_KEYS.TAGS) || [];
    setTags(storedTags);
    setIsLoading(false);
  }, []);

  const saveTags = useCallback((updatedTags: Tag[]) => {
    setStorageItem(STORAGE_KEYS.TAGS, updatedTags);
    setTags(updatedTags);
  }, []);

  const createTag = useCallback((name: string, color?: string): Tag => {
    // Check if tag already exists
    if (tags.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('이미 존재하는 태그입니다.');
    }

    const newTag: Tag = {
      id: crypto.randomUUID(),
      name,
      color: color || DEFAULT_COLORS[tags.length % DEFAULT_COLORS.length],
    };

    const updatedTags = [...tags, newTag];
    saveTags(updatedTags);
    return newTag;
  }, [tags, saveTags]);

  const deleteTag = useCallback((id: string) => {
    const updatedTags = tags.filter(t => t.id !== id);
    saveTags(updatedTags);
  }, [tags, saveTags]);

  const updateTag = useCallback((id: string, updates: Partial<Omit<Tag, 'id'>>) => {
    const updatedTags = tags.map(tag =>
      tag.id === id ? { ...tag, ...updates } : tag
    );
    saveTags(updatedTags);
  }, [tags, saveTags]);

  const getTagByName = useCallback((name: string): Tag | undefined => {
    return tags.find(t => t.name.toLowerCase() === name.toLowerCase());
  }, [tags]);

  return {
    tags,
    isLoading,
    createTag,
    deleteTag,
    updateTag,
    getTagByName,
  };
}
