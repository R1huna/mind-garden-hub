import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Link {
  id: string;
  url: string;
  title: string;
  description: string;
  tags: string[];
  linkedNoteId: string | null;
  createdAt: string;
}

export function useLinks() {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchLinks = useCallback(async () => {
    if (!user) {
      setLinks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from('links')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching links:', error);
      setIsLoading(false);
      return;
    }

    const formattedLinks: Link[] = (data || []).map((link) => ({
      id: link.id,
      url: link.url,
      title: link.title,
      description: link.description || '',
      tags: [], // Tags are stored separately in note_tags, links don't have direct tags
      linkedNoteId: link.note_id,
      createdAt: link.created_at,
    }));

    setLinks(formattedLinks);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const createLink = useCallback(async (
    url: string,
    title: string,
    description: string = '',
    tags: string[] = [],
    linkedNoteId: string | null = null
  ): Promise<Link | null> => {
    if (!user) return null;

    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new Error('유효한 URL을 입력해주세요.');
    }

    const { data, error } = await supabase
      .from('links')
      .insert({
        user_id: user.id,
        url,
        title,
        description,
        note_id: linkedNoteId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating link:', error);
      throw new Error(error.message);
    }

    await fetchLinks();

    return {
      id: data.id,
      url: data.url,
      title: data.title,
      description: data.description || '',
      tags,
      linkedNoteId: data.note_id,
      createdAt: data.created_at,
    };
  }, [user, fetchLinks]);

  const deleteLink = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting link:', error);
      return;
    }

    await fetchLinks();
  }, [fetchLinks]);

  const updateLink = useCallback(async (id: string, updates: Partial<Omit<Link, 'id' | 'createdAt'>>) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.url !== undefined) dbUpdates.url = updates.url;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.linkedNoteId !== undefined) dbUpdates.note_id = updates.linkedNoteId;

    const { error } = await supabase
      .from('links')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating link:', error);
      return;
    }

    await fetchLinks();
  }, [fetchLinks]);

  return {
    links,
    isLoading,
    createLink,
    deleteLink,
    updateLink,
    refetch: fetchLinks,
  };
}
