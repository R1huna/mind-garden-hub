import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useNotes } from '@/hooks/useNotes';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useTags } from '@/hooks/useTags';
import { format, parseISO } from 'date-fns';
import { Plus, Search, FileText, Trash2, MapPin, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function NotesPage() {
  const { notes, createNote, deleteNote, updateNote } = useNotes();
  const { createReviewEvents, deleteEventsByNoteId } = useCalendarEvents();
  const { tags: userTags, createTag } = useTags();
  const navigate = useNavigate();

  const handleReviewToggle = (e: React.MouseEvent, noteId: string, currentValue: boolean) => {
    e.stopPropagation();
    updateNote(noteId, { isReviewEnabled: !currentValue });
    toast({
      title: !currentValue ? '복습 활성화' : '복습 비활성화',
      description: !currentValue ? '이 노트가 복습 목록에 추가되었습니다.' : '이 노트가 복습 목록에서 제거되었습니다.',
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateNote = () => {
    if (!newNoteTitle.trim()) {
      toast({
        title: '오류',
        description: '노트 제목을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    const note = createNote(newNoteTitle, '', selectedTags);
    
    // Create review events
    createReviewEvents(note.id, note.title, new Date());

    setNewNoteTitle('');
    setSelectedTags([]);
    setIsDialogOpen(false);

    toast({
      title: '노트 생성',
      description: '새 노트가 생성되었습니다. 복습 일정도 자동 추가되었습니다.',
    });

    navigate(`/notes/${note.id}`);
  };

  const handleDeleteNote = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    deleteNote(noteId);
    deleteEventsByNoteId(noteId);
    toast({
      title: '노트 삭제',
      description: '노트와 관련 복습 일정이 삭제되었습니다.',
    });
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    
    // Check if tag exists in user's tags
    let tag = userTags.find((t) => t.name.toLowerCase() === newTagInput.toLowerCase());
    
    if (!tag) {
      try {
        tag = createTag(newTagInput);
      } catch (error) {
        toast({
          title: '오류',
          description: error instanceof Error ? error.message : '태그 생성에 실패했습니다.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (!selectedTags.includes(tag.name)) {
      setSelectedTags([...selectedTags, tag.name]);
    }
    setNewTagInput('');
  };

  const removeTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagName));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">노트</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              새 노트
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 노트 만들기</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="노트 제목"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateNote()}
                />
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="태그 추가"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button variant="outline" onClick={handleAddTag}>
                    추가
                  </Button>
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map((tag) => {
                      const tagData = userTags.find((t) => t.name === tag);
                      return (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                          style={{
                            backgroundColor: tagData?.color
                              ? `${tagData.color}20`
                              : undefined,
                            color: tagData?.color,
                          }}
                          onClick={() => removeTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
              <Button onClick={handleCreateNote} className="w-full">
                노트 만들기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="노트 검색..."
          className="pl-10"
        />
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {notes.length === 0
                ? '아직 작성된 노트가 없습니다.'
                : '검색 결과가 없습니다.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="cursor-pointer hover:border-primary/50 transition-colors group"
              onClick={() => navigate(`/notes/${note.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-medium line-clamp-1 flex-1">
                    {note.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    <div 
                      className="flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Label htmlFor={`review-${note.id}`} className="text-xs text-muted-foreground cursor-pointer">
                        복습
                      </Label>
                      <Switch
                        id={`review-${note.id}`}
                        checked={note.isReviewEnabled ?? false}
                        onCheckedChange={() => handleReviewToggle({} as React.MouseEvent, note.id, note.isReviewEnabled ?? false)}
                        className="scale-75"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={(e) => handleDeleteNote(e, note.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Subtitle */}
                {note.subtitle && (
                  <p className="text-sm text-muted-foreground font-medium mb-1">
                    {note.subtitle}
                  </p>
                )}
                {/* Summary or Content */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {note.summary || note.content || '내용 없음'}
                </p>
                {/* Class Info - Only when isClassEnabled is true */}
                {note.isClassEnabled && (note.classroom || note.professor) && (
                  <div className="bg-primary/5 border border-primary/10 rounded-md p-2 mb-3 space-y-1">
                    {note.classroom && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>강의실: {note.classroom}</span>
                      </div>
                    )}
                    {note.professor && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>교수: {note.professor}</span>
                      </div>
                    )}
                  </div>
                )}
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {note.tags.slice(0, 3).map((tag) => {
                      const tagData = userTags.find((t) => t.name === tag);
                      return (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: tagData?.color
                              ? `${tagData.color}20`
                              : undefined,
                            color: tagData?.color,
                          }}
                        >
                          {tag}
                        </Badge>
                      );
                    })}
                    {note.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{note.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(note.updatedAt), 'yyyy.MM.dd HH:mm')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
