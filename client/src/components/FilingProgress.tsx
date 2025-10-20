import { Check, Loader2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  errorMessage?: string;
}

interface FilingProgressProps {
  steps: ProgressStep[];
  currentStep?: string;
  className?: string;
}

export function FilingProgress({ steps, currentStep, className = '' }: FilingProgressProps) {
  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedCount / steps.length) * 100;

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <Check className="h-5 w-5 text-green-500" data-testid={`icon-${step.id}-completed`} />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" data-testid={`icon-${step.id}-progress`} />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" data-testid={`icon-${step.id}-error`} />;
      default:
        return (
          <div className="h-5 w-5 rounded-full border-2 border-neutral-300 dark:border-neutral-600" data-testid={`icon-${step.id}-pending`} />
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`} data-testid="filing-progress">
      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            Filing Progress
          </span>
          <span className="text-neutral-600 dark:text-neutral-400">
            {completedCount} of {steps.length} steps completed
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" data-testid="progress-bar" />
      </div>

      {/* Step List */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              step.status === 'in_progress'
                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                : step.status === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                : step.status === 'completed'
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-neutral-50 dark:bg-neutral-800/50'
            }`}
            data-testid={`step-${step.id}`}
          >
            {/* Step Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {getStepIcon(step)}
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  step.status === 'completed'
                    ? 'text-green-700 dark:text-green-400'
                    : step.status === 'in_progress'
                    ? 'text-blue-700 dark:text-blue-400'
                    : step.status === 'error'
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-neutral-700 dark:text-neutral-300'
                }`}>
                  {step.label}
                </span>
                {step.status === 'in_progress' && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">
                    Processing...
                  </span>
                )}
              </div>
              
              {step.description && (
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  {step.description}
                </p>
              )}

              {step.status === 'error' && step.errorMessage && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                  {step.errorMessage}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
