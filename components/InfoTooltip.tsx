import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type InfoTooltipProps = {
  text: string;
};

export default function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Using a button is better for accessibility */}
          <button type="button" className="ml-1.5 -translate-y-0.5">
            <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3 bg-card border-border shadow-lg rounded-lg">
          <p className="text-sm text-card-foreground">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}