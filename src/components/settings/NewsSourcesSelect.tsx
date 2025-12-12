import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const NEWS_SOURCES = [
  { id: 'bloomberg', label: 'Bloomberg Markets', description: 'Financial markets news' },
  { id: 'reuters', label: 'Reuters Business', description: 'Global business headlines' },
  { id: 'crypto', label: 'Digital Assets', description: 'Cryptocurrency & blockchain news' },
];

interface NewsSourcesSelectProps {
  value: string[];
  onChange: (sources: string[]) => void;
}

export function NewsSourcesSelect({ value, onChange }: NewsSourcesSelectProps) {
  const handleToggle = (sourceId: string) => {
    if (value.includes(sourceId)) {
      onChange(value.filter(id => id !== sourceId));
    } else {
      onChange([...value, sourceId]);
    }
  };

  return (
    <div className="space-y-3">
      {NEWS_SOURCES.map((source) => (
        <div key={source.id} className="flex items-start gap-3">
          <Checkbox
            id={`news-${source.id}`}
            checked={value.includes(source.id)}
            onCheckedChange={() => handleToggle(source.id)}
          />
          <div className="grid gap-0.5 leading-none">
            <Label
              htmlFor={`news-${source.id}`}
              className="text-sm font-normal cursor-pointer"
            >
              {source.label}
            </Label>
            <p className="text-xs text-muted-foreground">{source.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
