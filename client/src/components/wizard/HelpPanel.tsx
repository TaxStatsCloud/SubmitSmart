import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HelpCircle, FileText, Calculator, CheckCircle, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HelpTip {
  icon?: typeof HelpCircle;
  title: string;
  description: string;
  tips?: string[];
}

interface HelpPanelProps {
  title: string;
  currentStep?: number;
  tips: HelpTip[];
  documentRequirements?: {
    required: string[];
    optional?: string[];
  };
}

export function HelpPanel({ title, currentStep, tips, documentRequirements }: HelpPanelProps) {
  return (
    <Card className="h-full sticky top-6 bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-lg text-neutral-900 dark:text-neutral-100">{title}</CardTitle>
        </div>
        {currentStep && (
          <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1 font-medium">Step {currentStep} Help</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tips Section */}
        <div className="space-y-3">
          {tips.map((tip, index) => {
            const Icon = tip.icon || FileText;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-start gap-2">
                  <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{tip.title}</h4>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1">{tip.description}</p>
                    {tip.tips && tip.tips.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {tip.tips.map((item, idx) => (
                          <li key={idx} className="text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-1.5">
                            <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {index < tips.length - 1 && <div className="border-t border-neutral-200 dark:border-neutral-700" />}
              </div>
            );
          })}
        </div>

        {/* Document Requirements */}
        {documentRequirements && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Documents Needed</h4>
            </div>
            <div className="space-y-3">
              {documentRequirements.required.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Badge variant="default" className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 text-xs font-semibold">Required</Badge>
                  </div>
                  <ul className="space-y-1">
                    {documentRequirements.required.map((doc, idx) => (
                      <li key={idx} className="text-xs text-neutral-800 dark:text-neutral-200 flex items-start gap-1.5">
                        <CheckCircle className="h-3 w-3 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {documentRequirements.optional && documentRequirements.optional.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Badge variant="secondary" className="bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold">Optional</Badge>
                  </div>
                  <ul className="space-y-1">
                    {documentRequirements.optional.map((doc, idx) => (
                      <li key={idx} className="text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-1.5">
                        <CheckCircle className="h-3 w-3 text-neutral-400 dark:text-neutral-500 mt-0.5 flex-shrink-0" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Common Issues */}
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 bg-blue-50 dark:bg-blue-950 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
          <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">Common Mistakes to Avoid</h4>
          <ul className="space-y-1.5 text-xs text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-1.5">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Ensure all figures match your accounting records</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Double-check company number and dates</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Review validation messages before submitting</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
