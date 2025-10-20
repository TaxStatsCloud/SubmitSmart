import { AlertCircle, CheckCircle, Info, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SmartValidationMessageProps {
  type: 'error' | 'warning' | 'success' | 'suggestion';
  message: string;
  details?: string;
  actionLabel?: string;
  onAction?: () => void;
  autoFixAvailable?: boolean;
}

export function SmartValidationMessage({
  type,
  message,
  details,
  actionLabel,
  onAction,
  autoFixAvailable = false
}: SmartValidationMessageProps) {
  const config = {
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-700 dark:text-red-400',
      iconColor: 'text-red-500'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      textColor: 'text-amber-700 dark:text-amber-400',
      iconColor: 'text-amber-500'
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-700 dark:text-green-400',
      iconColor: 'text-green-500'
    },
    suggestion: {
      icon: Lightbulb,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-700 dark:text-blue-400',
      iconColor: 'text-blue-500'
    }
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${bgColor} ${borderColor}`}
      data-testid={`validation-${type}`}
    >
      <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      
      <div className="flex-1 space-y-2">
        <div>
          <p className={`text-sm font-medium ${textColor}`}>
            {message}
          </p>
          {details && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {details}
            </p>
          )}
        </div>

        {(actionLabel || autoFixAvailable) && onAction && (
          <Button
            variant={type === 'error' ? 'destructive' : type === 'warning' ? 'outline' : 'default'}
            size="sm"
            onClick={onAction}
            className="mt-2"
            data-testid="validation-action-button"
          >
            {autoFixAvailable && '🔧 '}
            {actionLabel || (autoFixAvailable ? 'Fix automatically' : 'Take action')}
          </Button>
        )}
      </div>
    </div>
  );
}
