import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, HelpCircle, AlertTriangle } from "lucide-react";
import { CT600_BOXES } from "@shared/ct600BoxMapping";

interface CT600BoxGuidanceProps {
  boxNumber: string;
  showExamples?: boolean;
  compact?: boolean;
}

export function CT600BoxGuidance({ boxNumber, showExamples = true, compact = false }: CT600BoxGuidanceProps) {
  const boxKey = `box${boxNumber}`;
  const box = CT600_BOXES[boxKey];

  if (!box) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-medium">Box {box.boxNumber}:</span> {box.description}
        </div>
      </div>
    );
  }

  return (
    <Card className="p-4 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900">
            CT600 Box {box.boxNumber}
          </Badge>
          <h4 className="font-semibold text-sm">{box.label}</h4>
        </div>

        <p className="text-sm text-muted-foreground">
          {box.description}
        </p>

        {box.helpText && (
          <Alert className="border-blue-200">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {box.helpText}
            </AlertDescription>
          </Alert>
        )}

        {box.validation && (
          <div className="text-xs space-y-1">
            <p className="font-medium text-muted-foreground">Requirements:</p>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              {box.validation.required && <li>This field is required</li>}
              {box.validation.min !== undefined && <li>Minimum value: £{box.validation.min.toLocaleString('en-GB')}</li>}
              {box.validation.max !== undefined && <li>Maximum value: £{box.validation.max.toLocaleString('en-GB')}</li>}
              {box.validation.mustBeInteger && <li>Must be a whole number</li>}
            </ul>
          </div>
        )}

        {box.conditionalOn && (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-xs text-amber-900 dark:text-amber-100">
              This box is only required if you answered "Yes" to the relevant activity question
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
}

/**
 * Display multiple CT600 boxes in a summary format
 */
interface CT600BoxSummaryProps {
  boxes: Array<{
    boxNumber: string;
    label: string;
    value: string | number;
    currency?: boolean;
    calculated?: boolean;
    highlight?: boolean;
  }>;
  title: string;
}

export function CT600BoxSummary({ boxes, title }: CT600BoxSummaryProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {boxes.map((item, index) => (
          <div 
            key={index} 
            className={`p-4 border rounded-lg ${
              item.highlight 
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950' 
                : item.calculated
                ? 'border-purple-200 bg-purple-50/50 dark:bg-purple-950/20'
                : 'border-border bg-muted/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant={item.highlight ? "default" : "outline"} className="text-xs">
                  Box {item.boxNumber}
                </Badge>
                {item.calculated && (
                  <Badge variant="secondary" className="text-xs">
                    Calculated
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className={`text-2xl font-bold ${item.highlight ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                {item.currency ? '£' : ''}{typeof item.value === 'number' 
                  ? item.value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
