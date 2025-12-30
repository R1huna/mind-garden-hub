import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useNotes } from '@/hooks/useNotes';
import { useTags } from '@/hooks/useTags';
import { ArrowLeft, Save, Plus, X, Link2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { debounce } from '@/lib/utils';

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notes, getNoteById, updateNote } = useNotes();
  const { tags: userTags, createTag } = useTags();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const note = id ? getNoteById(id) : undefined;

  // Create debounced save function with useRef to avoid recreation
  const debouncedSaveRef = useRef(
    debounce((noteId: string, updates: { title?: string; content?: string; tags?: string[] }) => {
      updateNote(noteId, updates);
      setLastSaved(new Date());
      setIsSaving(false);
    }, 1000)
  );

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags);
    }
  }, [note]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (id) {
      setIsSaving(true);
      debouncedSaveRef.current(id, { title: newTitle, content, tags });
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (id) {
      setIsSaving(true);
      debouncedSaveRef.current(id, { title, content: newContent, tags });
    }
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;

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

    if (!tags.includes(tag.name)) {
      const newTags = [...tags, tag.name];
      setTags(newTags);
      if (id) {
        updateNote(id, { tags: newTags });
        setLastSaved(new Date());
      }
    }
    setNewTagInput('');
  };

  const removeTag = (tagName: string) => {
    const newTags = tags.filter((t) => t !== tagName);
    setTags(newTags);
    if (id) {
      updateNote(id, { tags: newTags });
      setLastSaved(new Date());
    }
  };

  // Parse [[note links]] in content
  const parseBacklinks = () => {
    const linkRegex = /\[\[([^\]]+)\]\]/g;
    const matches = content.matchAll(linkRegex);
    const linkedNoteNames = [...matches].map((m) => m[1]);

    return notes.filter(
      (n) => n.id !== id && linkedNoteNames.includes(n.title)
    );
  };

  // Find notes that link to this note (backlinks)
  const findBacklinks = () => {
    if (!note) return [];
    const linkPattern = `[[${note.title}]]`;
    return notes.filter(
      (n) => n.id !== id && n.content.includes(linkPattern)
    );
  };

  const linkedNotes = parseBacklinks();
  const backlinks = findBacklinks();

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">노트를 찾을 수 없습니다.</p>
        <Button onClick={() => navigate('/notes')}>노트 목록으로</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/notes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isSaving ? (
            <span>저장 중...</span>
          ) : lastSaved ? (
            <span>마지막 저장: {format(lastSaved, 'HH:mm:ss')}</span>
          ) : null}
          <Save className="h-4 w-4" />
        </div>
      </div>

      {/* Title */}
      <Input
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        className="text-2xl font-bold border-none bg-transparent px-0 focus-visible:ring-0"
        placeholder="노트 제목"
      />

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => {
          const tagData = userTags.find((t) => t.name === tag);
          return (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer"
              style={{
                backgroundColor: tagData?.color ? `${tagData.color}20` : undefined,
                color: tagData?.color,
              }}
            >
              {tag}
              <X
                className="h-3 w-3 ml-1"
                onClick={() => removeTag(tag)}
              />
            </Badge>
          );
        })}
        <div className="flex items-center gap-1">
          <Input
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            placeholder="태그 추가"
            className="h-7 w-24 text-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleAddTag}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <Textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        className="min-h-[400px] resize-none border-none bg-transparent focus-visible:ring-0 text-base leading-relaxed"
        placeholder="마크다운으로 내용을 작성하세요...&#10;&#10;다른 노트로 링크하려면 [[노트제목]] 형식을 사용하세요."
      />

      {/* Linked Notes */}
      {linkedNotes.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              연결된 노트
            </h3>
            <div className="flex flex-wrap gap-2">
              {linkedNotes.map((linkedNote) => (
                <Badge
                  key={linkedNote.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => navigate(`/notes/${linkedNote.id}`)}
                >
                  {linkedNote.title}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Link2 className="h-4 w-4 rotate-180" />
              이 노트를 참조하는 노트
            </h3>
            <div className="flex flex-wrap gap-2">
              {backlinks.map((backlinkNote) => (
                <Badge
                  key={backlinkNote.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => navigate(`/notes/${backlinkNote.id}`)}
                >
                  {backlinkNote.title}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <div className="text-sm text-muted-foreground border-t border-border pt-4">
        <p>생성: {format(parseISO(note.createdAt), 'yyyy년 M월 d일 HH:mm')}</p>
        <p>수정: {format(parseISO(note.updatedAt), 'yyyy년 M월 d일 HH:mm')}</p>
      </div>
    </div>
  );
}
