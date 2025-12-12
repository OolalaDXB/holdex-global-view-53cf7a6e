import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CERTAINTY_LEVELS, CertaintyLevel } from '@/lib/certainty';

interface CertaintySelectProps {
  value: string;
  onValueChange: (value: CertaintyLevel) => void;
}

export function CertaintySelect({ value, onValueChange }: CertaintySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CERTAINTY_LEVELS.map((level) => (
          <SelectItem key={level.value} value={level.value}>
            <span className="flex items-center gap-2">
              {level.icon && <span className="text-xs">{level.icon}</span>}
              <span>{level.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
