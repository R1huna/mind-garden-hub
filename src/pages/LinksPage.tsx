import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLinks } from '@/hooks/useLinks';
import { useNotes } from '@/hooks/useNotes';
import { useTags } from '@/hooks/useTags';
import { Plus, Search, ExternalLink, Trash2, Link2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

export default function LinksPage() {
  const { links, createLink, deleteLink } = useLinks();
  const { notes } = useNotes();
  const { tags: userTags, createTag } = useTags();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkDescription, setNewLinkDescription] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('none');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filteredLinks = links.filter(
    (link) =>
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateLink = async () => {
    if (!newLinkUrl.trim() || !newLinkTitle.trim()) {
      toast({
        title: '오류',
        description: 'URL과 제목을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      await createLink(
        newLinkUrl,
        newLinkTitle,
        newLinkDescription,
        selectedTags,
        selectedNoteId === 'none' ? null : selectedNoteId
      );

      setNewLinkUrl('');
      setNewLinkTitle('');
      setNewLinkDescription('');
      setSelectedNoteId('none');
      setSelectedTags([]);
      setIsDialogOpen(false);

      toast({
        title: '링크 추가',
        description: '새 링크가 추가되었습니다.',
      });
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '링크 추가에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    await deleteLink(linkId);
    toast({
      title: '링크 삭제',
      description: '링크가 삭제되었습니다.',
    });
  };

  const handleAddTag = async () => {
    if (!newTagInput.trim()) return;

    let tag = userTags.find((t) => t.name.toLowerCase() === newTagInput.toLowerCase());

    if (!tag) {
      try {
        tag = await createTag(newTagInput);
      } catch (error) {
        toast({
          title: '오류',
          description: error instanceof Error ? error.message : '태그 생성에 실패했습니다.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (tag && !selectedTags.includes(tag.name)) {
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
        <h1 className="text-2xl font-bold text-foreground">링크 모음</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              링크 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 링크 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  type="url"
                />
              </div>
              <div className="space-y-2">
                <Label>제목</Label>
                <Input
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  placeholder="링크 제목"
                />
              </div>
              <div className="space-y-2">
                <Label>설명 (선택)</Label>
                <Textarea
                  value={newLinkDescription}
                  onChange={(e) => setNewLinkDescription(e.target.value)}
                  placeholder="링크에 대한 설명"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>연결할 노트 (선택)</Label>
                <Select value={selectedNoteId} onValueChange={setSelectedNoteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="노트 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">없음</SelectItem>
                    {notes.map((note) => (
                      <SelectItem key={note.id} value={note.id}>
                        {note.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>태그</Label>
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
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTags.map((tag) => {
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
                          onClick={() => removeTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
              <Button onClick={handleCreateLink} className="w-full" disabled={isCreating}>
                {isCreating ? '추가 중...' : '링크 추가'}
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
          placeholder="링크 검색..."
          className="pl-10"
        />
      </div>

      {/* Links List */}
      {filteredLinks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {links.length === 0 ? '아직 저장된 링크가 없습니다.' : '검색 결과가 없습니다.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLinks.map((link) => {
            const linkedNote = notes.find((n) => n.id === link.linkedNoteId);
            return (
              <Card key={link.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{link.title}</h3>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-2">{link.url}</p>
                      {link.description && (
                        <p className="text-sm text-muted-foreground mb-2">{link.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        {link.tags.map((tag) => {
                          const tagData = userTags.find((t) => t.name === tag);
                          return (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                              style={{
                                backgroundColor: tagData?.color ? `${tagData.color}20` : undefined,
                                color: tagData?.color,
                              }}
                            >
                              {tag}
                            </Badge>
                          );
                        })}
                        {linkedNote && (
                          <Badge variant="outline" className="text-xs">
                            📄 {linkedNote.title}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(parseISO(link.createdAt), 'yyyy.MM.dd')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteLink(link.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
