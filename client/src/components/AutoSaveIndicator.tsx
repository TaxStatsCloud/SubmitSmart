import { Cloud, CloudOff, Check, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  onSaveNow?: () => void;
}

export function AutoSaveIndicator({
  isSaving,
  lastSaved,
  hasUnsavedChanges,
  onSaveNow
}: AutoSaveIndicatorProps) {
  const getStatus = () => {
    if (isSaving) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
        text: 'Saving...',
        color: 'text-blue-600 dark:text-blue-400'
      };
    }

    if (hasUnsavedChanges) {
      return {
        icon: <CloudOff className="h-4 w-4 text-amber-500" />,
        text: 'Unsaved changes',
        color: 'text-amber-600 dark:text-amber-400'
      };
    }

    if (lastSaved) {
      return {
        icon: <Check className="h-4 w-4 text-green-500" />,
        text: `Saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`,
        color: 'text-green-600 dark:text-green-400'
      };
    }

    return {
      icon: <Cloud className="h-4 w-4 text-neutral-400" />,
      text: 'Not saved',
      color: 'text-neutral-500 dark:text-neutral-400'
    };
  };

  const status = getStatus();

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1.5">
        {status.icon}
        <span className={status.color}>{status.text}</span>
      </div>
      
      {hasUnsavedChanges && !isSaving && onSaveNow && (
        <button
          onClick={onSaveNow}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Save now
        </button>
      )}
    </div>
  );
}
