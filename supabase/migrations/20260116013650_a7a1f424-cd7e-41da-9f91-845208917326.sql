-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create notes table
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  summary TEXT,
  content TEXT NOT NULL DEFAULT '',
  is_review_enabled BOOLEAN NOT NULL DEFAULT false,
  is_class_enabled BOOLEAN NOT NULL DEFAULT false,
  classroom TEXT,
  professor TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Notes policies (본인만 접근 가능)
CREATE POLICY "Users can view their own notes"
ON public.notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
ON public.notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
ON public.notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON public.notes FOR DELETE
USING (auth.uid() = user_id);

-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS on tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Tags policies
CREATE POLICY "Users can view their own tags"
ON public.tags FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
ON public.tags FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
ON public.tags FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
ON public.tags FOR DELETE
USING (auth.uid() = user_id);

-- Create note_tags junction table
CREATE TABLE public.note_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(note_id, tag_id)
);

-- Enable RLS on note_tags
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

-- Note_tags policies (노트 소유자만 접근)
CREATE POLICY "Users can view their own note_tags"
ON public.note_tags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.notes
    WHERE notes.id = note_tags.note_id
    AND notes.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own note_tags"
ON public.note_tags FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.notes
    WHERE notes.id = note_tags.note_id
    AND notes.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own note_tags"
ON public.note_tags FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.notes
    WHERE notes.id = note_tags.note_id
    AND notes.user_id = auth.uid()
  )
);

-- Create links table
CREATE TABLE public.links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on links
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- Links policies
CREATE POLICY "Users can view their own links"
ON public.links FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own links"
ON public.links FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own links"
ON public.links FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links"
ON public.links FOR DELETE
USING (auth.uid() = user_id);

-- Create calendar_events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  linked_note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'normal' CHECK (type IN ('normal', 'review')),
  tag_color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on calendar_events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Calendar_events policies
CREATE POLICY "Users can view their own calendar_events"
ON public.calendar_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar_events"
ON public.calendar_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar_events"
ON public.calendar_events FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar_events"
ON public.calendar_events FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_links_user_id ON public.links(user_id);
CREATE INDEX idx_links_note_id ON public.links(note_id);
CREATE INDEX idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX idx_calendar_events_date ON public.calendar_events(date);