import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface ValidationGuidanceProps {
  errors: Record<string, any>;
  fieldGuidance: Record<string, string>;
}

export function ValidationGuidance({ errors, fieldGuidance }: ValidationGuidanceProps) {
  const errorKeys = Object.keys(errors);
  
  if (errorKeys.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <p className="font-semibold mb-2">Please fix the following errors:</p>
        <ul className="space-y-2">
          {errorKeys.map((key) => (
            <li key={key} className="text-sm">
              <span className="font-medium">{key}:</span>{" "}
              {errors[key]?.message || "Invalid value"}
              {fieldGuidance[key] && (
                <p className="text-xs mt-1 text-neutral-600 italic">
                  💡 {fieldGuidance[key]}
                </p>
              )}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

interface ProgressChecklistProps {
  items: {
    label: string;
    completed: boolean;
    hint?: string;
  }[];
}

export function ProgressChecklist({ items }: ProgressChecklistProps) {
  const completedCount = items.filter(item => item.completed).length;
  const progressPercentage = (completedCount / items.length) * 100;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm text-blue-900">Progress Checklist</h4>
        <span className="text-xs font-medium text-blue-700">
          {completedCount}/{items.length} completed
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            {item.completed ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-neutral-300 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`text-sm ${item.completed ? 'text-neutral-900 line-through' : 'text-neutral-700'}`}>
                {item.label}
              </p>
              {!item.completed && item.hint && (
                <p className="text-xs text-neutral-600 mt-1 flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {item.hint}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
