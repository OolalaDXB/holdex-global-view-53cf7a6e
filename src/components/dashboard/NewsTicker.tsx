import { useState, useEffect } from 'react';
import { X, Newspaper } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface NewsItem {
  title: string;
  link: string;
  source: string;
}

interface FeedConfig {
  url: string;
  source: string;
  id: string;
}

const ALL_FEEDS: FeedConfig[] = [
  { id: 'bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', source: 'Bloomberg' },
  { id: 'reuters', url: 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best', source: 'Reuters' },
  { id: 'crypto', url: 'https://cointelegraph.com/rss', source: 'Cointelegraph' },
];

// Fetch news from RSS feeds via a public CORS proxy
const fetchNews = async (enabledSources: string[]): Promise<NewsItem[]> => {
  const feeds = ALL_FEEDS.filter(feed => enabledSources.includes(feed.id));
  
  if (feeds.length === 0) {
    return [];
  }

  const allNews: NewsItem[] = [];

  for (const feed of feeds) {
    try {
      // Use rss2json API as a CORS proxy
      const response = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=5`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ok' && data.items) {
          data.items.forEach((item: any) => {
            allNews.push({
              title: item.title,
              link: item.link,
              source: feed.source,
            });
          });
        }
      }
    } catch {
      // Silently fail for individual feeds
    }
  }

  // Fallback headlines if feeds fail
  if (allNews.length === 0) {
    return [
      { title: 'Markets update: Check your portfolio for the latest changes', link: '#', source: 'BEAU' },
      { title: 'Currency markets remain volatile amid global uncertainty', link: '#', source: 'Markets' },
      { title: 'Digital assets see continued institutional interest', link: '#', source: 'Finance' },
    ];
  }

  return allNews.slice(0, 10);
};

interface NewsTickerProps {
  onDismiss?: () => void;
  enabledSources?: string[];
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ 
  onDismiss,
  enabledSources = ['bloomberg', 'reuters']
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  const { data: news = [] } = useQuery({
    queryKey: ['news-ticker', enabledSources],
    queryFn: () => fetchNews(enabledSources),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    enabled: enabledSources.length > 0,
  });

  // Rotate headlines every 10 seconds
  useEffect(() => {
    if (news.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % news.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [news.length]);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed || news.length === 0) return null;

  const currentNews = news[currentIndex];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-8 bg-secondary/95 backdrop-blur-sm border-t border-border">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Newspaper size={14} className="text-muted-foreground shrink-0" />
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            <span className="text-xs text-muted-foreground shrink-0">
              {currentNews.source}
            </span>
            <span className="text-muted-foreground/50">•</span>
            <a
              href={currentNews.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-foreground/80 hover:text-foreground truncate transition-colors"
            >
              {currentNews.title}
            </a>
          </div>
        </div>
        
        {/* Navigation dots */}
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          {news.slice(0, 5).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Dismiss news ticker"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
