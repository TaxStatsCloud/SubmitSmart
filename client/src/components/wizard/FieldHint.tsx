import { HelpCircle, Info, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FieldHintProps {
  title?: string;
  description: string;
  type?: 'info' | 'help' | 'warning';
  example?: string;
  className?: string;
}

export function FieldHint({ title, description, type = 'info', example, className = "" }: FieldHintProps) {
  const Icon = type === 'warning' ? AlertCircle : type === 'help' ? HelpCircle : Info;
  const colorClass = type === 'warning' ? 'text-amber-600' : type === 'help' ? 'text-blue-600' : 'text-neutral-600';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            type="button" 
            className={`inline-flex items-center ${colorClass} hover:opacity-80 transition-opacity ${className}`}
            aria-label="Field help"
            data-testid="field-hint-trigger"
          >
            <Icon className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm" side="right">
          <div className="space-y-2">
            {title && <p className="font-semibold text-sm">{title}</p>}
            <p className="text-sm text-neutral-700">{description}</p>
            {example && (
              <div className="mt-2 pt-2 border-t border-neutral-200">
                <p className="text-xs font-medium text-neutral-600">Example:</p>
                <p className="text-xs text-neutral-500 mt-1">{example}</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface InlineHintProps {
  message: string;
  type?: 'info' | 'warning' | 'success';
}

export function InlineHint({ message, type = 'info' }: InlineHintProps) {
  const bgClass = 
    type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
    type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
    'bg-blue-50 border-blue-200 text-blue-700';

  const Icon = type === 'warning' ? AlertCircle : type === 'success' ? Info : Info;

  return (
    <div 
      className={`flex items-start gap-2 p-3 rounded-md border text-sm ${bgClass}`}
      data-testid={`inline-hint-${type}`}
    >
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <p>{message}</p>
    </div>
  );
}
