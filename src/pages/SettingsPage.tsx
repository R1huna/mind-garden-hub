import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const handleClearData = () => {
    if (confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      localStorage.clear();
      toast({
        title: '데이터 삭제',
        description: '모든 데이터가 삭제되었습니다. 페이지를 새로고침합니다.',
      });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">설정</h1>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle>테마</CardTitle>
          <CardDescription>앱의 외관을 설정합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setTheme('light')}
            >
              <Sun className="h-4 w-4 mr-2" />
              라이트
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setTheme('dark')}
            >
              <Moon className="h-4 w-4 mr-2" />
              다크
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            데이터 관리
          </CardTitle>
          <CardDescription>
            현재 데이터는 브라우저의 로컬 스토리지에 저장됩니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-accent/50">
            <p className="text-sm text-muted-foreground">
              ⚠️ 로컬 스토리지 데이터는 브라우저를 변경하거나 캐시를 삭제하면 사라질 수 있습니다.
              중요한 데이터는 별도로 백업하시기 바랍니다.
            </p>
          </div>
          <Button variant="destructive" onClick={handleClearData}>
            모든 데이터 삭제
          </Button>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>LearnFlow 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>버전: 1.0.0</p>
            <p>개인 학습 관리를 위한 웹 애플리케이션</p>
            <p className="pt-2">
              기능: 달력, 노트, 링크 모음, 태그 관리, 복습 일정 자동 생성
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
