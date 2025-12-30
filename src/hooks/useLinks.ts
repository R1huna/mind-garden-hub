import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

export function useLinks(userId: string | undefined) {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLinks([]);
      setIsLoading(false);
      return;
    }

    const allLinks = getStorageItem<Link[]>(STORAGE_KEYS.LINKS) || [];
    const userLinks = allLinks.filter(l => l.userId === userId);
    setLinks(userLinks);
    setIsLoading(false);
  }, [userId]);

  const saveLinks = useCallback((updatedLinks: Link[]) => {
    const allLinks = getStorageItem<Link[]>(STORAGE_KEYS.LINKS) || [];
    const otherUserLinks = allLinks.filter(l => l.userId !== userId);
    setStorageItem(STORAGE_KEYS.LINKS, [...otherUserLinks, ...updatedLinks]);
    setLinks(updatedLinks);
  }, [userId]);

  const createLink = useCallback((
    url: string,
    title: string,
    description: string = '',
    tags: string[] = [],
    linkedNoteId: string | null = null
  ): Link => {
    if (!userId) throw new Error('User not authenticated');

    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new Error('유효한 URL을 입력해주세요.');
    }

    const newLink: Link = {
      id: crypto.randomUUID(),
      userId,
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
  }, [userId, links, saveLinks]);

  const deleteLink = useCallback((id: string) => {
    const updatedLinks = links.filter(l => l.id !== id);
    saveLinks(updatedLinks);
  }, [links, saveLinks]);

  const updateLink = useCallback((id: string, updates: Partial<Omit<Link, 'id' | 'userId' | 'createdAt'>>) => {
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
