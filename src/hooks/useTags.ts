import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

const DEFAULT_COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
];

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchTags = useCallback(async () => {
    if (!user) {
      setTags([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tags:', error);
      setIsLoading(false);
      return;
    }

    const formattedTags: Tag[] = (data || []).map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    }));

    setTags(formattedTags);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const createTag = useCallback(async (name: string, color?: string): Promise<Tag | null> => {
    if (!user) return null;

    // Check if tag already exists
    const existingTag = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existingTag) {
      throw new Error('이미 존재하는 태그입니다.');
    }

    const { data, error } = await supabase
      .from('tags')
      .insert({
        user_id: user.id,
        name,
        color: color || DEFAULT_COLORS[tags.length % DEFAULT_COLORS.length],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tag:', error);
      throw new Error(error.message);
    }

    await fetchTags();

    return {
      id: data.id,
      name: data.name,
      color: data.color,
    };
  }, [user, tags, fetchTags]);

  const deleteTag = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting tag:', error);
      return;
    }

    await fetchTags();
  }, [fetchTags]);

  const updateTag = useCallback(async (id: string, updates: Partial<Omit<Tag, 'id'>>) => {
    const { error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating tag:', error);
      return;
    }

    await fetchTags();
  }, [fetchTags]);

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
    refetch: fetchTags,
  };
}
