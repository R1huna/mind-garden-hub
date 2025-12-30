import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNotes } from '@/hooks/useNotes';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useLinks } from '@/hooks/useLinks';
import { useTags } from '@/hooks/useTags';
import { Plus, Tags, Trash2, Edit2, FileText, Calendar, Link2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const DEFAULT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(220, 70%, 50%)',
  'hsl(280, 70%, 50%)',
  'hsl(340, 70%, 50%)',
  'hsl(160, 70%, 40%)',
  'hsl(30, 70%, 50%)',
];

export default function TagsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const filterTag = searchParams.get('filter');

  const { user } = useAuthContext();
  const { notes } = useNotes(user?.id);
  const { events } = useCalendarEvents(user?.id);
  const { links } = useLinks(user?.id);
  const { tags, createTag, deleteTag, updateTag } = useTags(user?.id);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);

  // Count usage for each tag
  const getTagStats = (tagName: string) => {
    const noteCount = notes.filter((n) => n.tags.includes(tagName)).length;
    const linkCount = links.filter((l) => l.tags.includes(tagName)).length;
    return { noteCount, linkCount, total: noteCount + linkCount };
  };

  // Filter content by tag
  const filteredNotes = filterTag
    ? notes.filter((n) => n.tags.includes(filterTag))
    : [];
  const filteredLinks = filterTag
    ? links.filter((l) => l.tags.includes(filterTag))
    : [];

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast({
        title: '오류',
        description: '태그 이름을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingTag) {
        updateTag(editingTag, { name: newTagName, color: selectedColor });
        toast({ title: '태그 수정', description: '태그가 수정되었습니다.' });
      } else {
        createTag(newTagName, selectedColor);
        toast({ title: '태그 생성', description: '새 태그가 생성되었습니다.' });
      }

      setNewTagName('');
      setSelectedColor(DEFAULT_COLORS[0]);
      setEditingTag(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '태그 작업에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleEditTag = (tag: typeof tags[0]) => {
    setEditingTag(tag.id);
    setNewTagName(tag.name);
    setSelectedColor(tag.color);
    setIsDialogOpen(true);
  };

  const handleDeleteTag = (tagId: string) => {
    deleteTag(tagId);
    toast({ title: '태그 삭제', description: '태그가 삭제되었습니다.' });
  };

  const clearFilter = () => {
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">태그</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTag(null);
              setNewTagName('');
              setSelectedColor(DEFAULT_COLORS[0]);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              태그 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTag ? '태그 수정' : '새 태그 만들기'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>태그 이름</Label>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="태그 이름"
                />
              </div>
              <div className="space-y-2">
                <Label>색상</Label>
                <div className="flex gap-2 flex-wrap">
                  {DEFAULT_COLORS.map((color, idx) => (
                    <button
                      key={idx}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color
                          ? 'border-foreground scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateTag} className="w-full">
                {editingTag ? '수정' : '만들기'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tag Filter Active */}
      {filterTag && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: tags.find((t) => t.name === filterTag)?.color,
                  }}
                />
                "{filterTag}" 태그 필터
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilter}>
                필터 해제
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredNotes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> 노트
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {filteredNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-2 rounded-lg border border-border hover:bg-accent/50 cursor-pointer"
                        onClick={() => navigate(`/notes/${note.id}`)}
                      >
                        <p className="font-medium text-sm truncate">{note.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {filteredLinks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Link2 className="h-4 w-4" /> 링크
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {filteredLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg border border-border hover:bg-accent/50"
                      >
                        <p className="font-medium text-sm truncate">{link.title}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {filteredNotes.length === 0 && filteredLinks.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  이 태그를 사용하는 항목이 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags Grid */}
      {tags.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tags className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              아직 생성된 태그가 없습니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => {
            const stats = getTagStats(tag.name);
            return (
              <Card
                key={tag.id}
                className="group cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSearchParams({ filter: tag.name })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium">{tag.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTag(tag);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTag(tag.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" /> {stats.noteCount} 노트
                    </span>
                    <span className="flex items-center gap-1">
                      <Link2 className="h-3 w-3" /> {stats.linkCount} 링크
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
