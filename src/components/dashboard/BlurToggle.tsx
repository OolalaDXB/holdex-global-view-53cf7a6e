import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useBlur } from '@/contexts/BlurContext';

export const BlurToggle: React.FC = () => {
  const { isBlurred, toggleBlur } = useBlur();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleBlur}
          className="h-8 w-8"
        >
          {isBlurred ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isBlurred ? 'Show amounts' : 'Hide amounts'}</p>
      </TooltipContent>
    </Tooltip>
  );
};
