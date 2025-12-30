export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  linkedNoteId: string | null;
  type: 'normal' | 'review';
  tagColor: string;
}

export interface Link {
  id: string;
  url: string;
  title: string;
  description: string;
  tags: string[];
  linkedNoteId: string | null;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}
