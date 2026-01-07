import { ExternalLink } from 'lucide-react';

interface LinkRendererProps {
  text: string;
  className?: string;
}

// URL regex pattern
const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;

export function LinkRenderer({ text, className = '' }: LinkRendererProps) {
  if (!text) return null;

  const parts = text.split(URL_REGEX);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (URL_REGEX.test(part)) {
          // Reset regex lastIndex
          URL_REGEX.lastIndex = 0;
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 
                bg-primary/10 text-primary hover:bg-primary/20
                rounded-md no-underline transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1
                break-all"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="text-sm">{truncateUrl(part)}</span>
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

// Truncate long URLs for display
function truncateUrl(url: string, maxLength: number = 40): string {
  if (url.length <= maxLength) return url;
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const path = urlObj.pathname;
    
    if (domain.length + 10 >= maxLength) {
      return domain.slice(0, maxLength - 3) + '...';
    }
    
    const remainingLength = maxLength - domain.length - 3;
    const truncatedPath = path.length > remainingLength 
      ? path.slice(0, remainingLength) + '...'
      : path;
    
    return domain + truncatedPath;
  } catch {
    return url.slice(0, maxLength - 3) + '...';
  }
}

export default LinkRenderer;
