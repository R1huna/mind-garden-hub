import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

export function useLinks() {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedLinks = getStorageItem<Link[]>(STORAGE_KEYS.LINKS) || [];
    setLinks(storedLinks);
    setIsLoading(false);
  }, []);

  const saveLinks = useCallback((updatedLinks: Link[]) => {
    setStorageItem(STORAGE_KEYS.LINKS, updatedLinks);
    setLinks(updatedLinks);
  }, []);

  const createLink = useCallback((
    url: string,
    title: string,
    description: string = '',
    tags: string[] = [],
    linkedNoteId: string | null = null
  ): Link => {
    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new Error('유효한 URL을 입력해주세요.');
    }

    const newLink: Link = {
      id: crypto.randomUUID(),
      url,
      title,
      description,
      tags,
      linkedNoteId,
      createdAt: new Date().toISOString(),
    };

    const updatedLinks = [...links, newLink];
    saveLinks(updatedLinks);
    return newLink;
  }, [links, saveLinks]);

  const deleteLink = useCallback((id: string) => {
    const updatedLinks = links.filter(l => l.id !== id);
    saveLinks(updatedLinks);
  }, [links, saveLinks]);

  const updateLink = useCallback((id: string, updates: Partial<Omit<Link, 'id' | 'createdAt'>>) => {
    const updatedLinks = links.map(link =>
      link.id === id ? { ...link, ...updates } : link
    );
    saveLinks(updatedLinks);
  }, [links, saveLinks]);

  return {
    links,
    isLoading,
    createLink,
    deleteLink,
    updateLink,
  };
}
