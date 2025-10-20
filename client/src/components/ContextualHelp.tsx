import { HelpCircle, Info, AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ContextualHelpProps {
  title?: string;
  content: string;
  examples?: string[];
  warnings?: string[];
  type?: 'info' | 'warning' | 'help';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function ContextualHelp({
  title,
  content,
  examples = [],
  warnings = [],
  type = 'help',
  side = 'right'
}: ContextualHelpProps) {
  const Icon = type === 'warning' ? AlertTriangle : type === 'info' ? Info : HelpCircle;
  const iconColor =
    type === 'warning'
      ? 'text-amber-500 hover:text-amber-600'
      : type === 'info'
      ? 'text-blue-500 hover:text-blue-600'
      : 'text-neutral-500 hover:text-neutral-600';

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center ${iconColor} transition-colors`}
            data-testid="contextual-help-trigger"
            aria-label={title || "Help information"}
          >
            <Icon className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-sm p-4 space-y-3"
          data-testid="contextual-help-content"
        >
          {title && (
            <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
              {title}
            </h4>
          )}
          
          <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {content}
          </p>

          {examples.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                Examples
              </h5>
              <ul className="space-y-1">
                {examples.map((example, index) => (
                  <li
                    key={index}
                    className="text-xs text-neutral-600 dark:text-neutral-400 pl-3 relative before:content-['•'] before:absolute before:left-0"
                  >
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <h5 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  Important
                </h5>
              </div>
              <ul className="space-y-1">
                {warnings.map((warning, index) => (
                  <li
                    key={index}
                    className="text-xs text-amber-700 dark:text-amber-400 pl-3 relative before:content-['⚠'] before:absolute before:left-0"
                  >
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
