export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  date: string;
  linkedNoteId: string | null;
  type: 'normal' | 'review';
  tagColor: string;
}

export interface Link {
  id: string;
  userId: string;
  url: string;
  title: string;
  description: string;
  tags: string[];
  linkedNoteId: string | null;
  createdAt: string;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
