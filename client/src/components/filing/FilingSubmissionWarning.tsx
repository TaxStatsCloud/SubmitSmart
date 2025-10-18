import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface FilingSubmissionWarningProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  filingType: "annual_accounts" | "confirmation_statement" | "ct600";
  creditCost: number;
}

export function FilingSubmissionWarning({
  isOpen,
  onCancel,
  onConfirm,
  filingType,
  creditCost,
}: FilingSubmissionWarningProps) {
  const filingTypeNames = {
    annual_accounts: "Annual Accounts",
    confirmation_statement: "Confirmation Statement",
    ct600: "Corporation Tax Return (CT600)",
  };

  const authorities = {
    annual_accounts: "Companies House",
    confirmation_statement: "Companies House",
    ct600: "HMRC",
  };

  const filingName = filingTypeNames[filingType];
  const authority = authorities[filingType];

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-xl">
              Important Legal Disclaimer - Please Read Carefully
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base text-left space-y-4 pt-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold text-red-900 mb-2">
                ⚠️ Filing Responsibility & Legal Consequences
              </p>
              <p className="text-sm text-red-800">
                By clicking "I Understand & Submit", you acknowledge that:
              </p>
              <ul className="list-disc list-inside text-sm text-red-800 mt-2 space-y-1">
                <li>You are <strong>legally responsible</strong> for all information submitted to {authority}</li>
                <li>Inaccurate or false filings may result in <strong>penalties, fines, or prosecution</strong></li>
                <li>Directors can be <strong>personally liable</strong> and may face <strong>disqualification</strong></li>
                <li>Late filings incur automatic penalties starting at <strong>£150-£1,500+</strong></li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="font-semibold text-amber-900 mb-2">
                📋 Professional Review Strongly Recommended
              </p>
              <p className="text-sm text-amber-800 mb-2">
                PromptSubmissions is a <strong>software tool</strong> designed to assist with filing preparation. 
                We <strong>strongly recommend</strong> having your {filingName} reviewed by a qualified professional before submission:
              </p>
              <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                <li>Chartered Accountant (CA, ACCA, ICAEW member)</li>
                <li>Tax advisor for Corporation Tax matters</li>
                <li>Company secretary for complex corporate structures</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-semibold text-blue-900 mb-2">
                ℹ️ What This Filing Does
              </p>
              <p className="text-sm text-blue-800">
                <strong>{filingName}</strong> will be submitted to {authority} and will:
              </p>
              <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
                <li>Become part of the <strong>public record</strong> (searchable by anyone)</li>
                <li>Be used by {authority} for <strong>regulatory compliance</strong> monitoring</li>
                <li>Deduct <strong>{creditCost} credits</strong> from your account (non-refundable)</li>
                {filingType === "ct600" && (
                  <li>Determine your corporation tax liability - <strong>tax must be paid separately to HMRC</strong></li>
                )}
              </ul>
            </div>

            <div className="bg-neutral-100 border border-neutral-300 rounded-lg p-4">
              <p className="font-semibold text-neutral-900 mb-2">
                🚫 Limitation of Liability
              </p>
              <p className="text-sm text-neutral-700">
                PromptSubmissions Ltd provides this software "as is" and makes <strong>no warranties</strong> regarding:
              </p>
              <ul className="list-disc list-inside text-sm text-neutral-700 mt-2 space-y-1">
                <li>Accuracy or completeness of generated filings</li>
                <li>Suitability for your specific circumstances</li>
                <li>Compliance with all applicable laws and regulations</li>
              </ul>
              <p className="text-sm text-neutral-700 mt-2">
                We are <strong>not liable</strong> for any penalties, fines, legal consequences, or financial losses arising from your use of this platform or the accuracy of submissions.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-semibold text-green-900 mb-2">
                ✓ Final Checklist Before Submitting
              </p>
              <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                <li>All financial figures are accurate and match source documents</li>
                <li>All required fields are complete and correct</li>
                <li>You have reviewed the submission preview carefully</li>
                <li>If uncertain, you have consulted a professional advisor</li>
                <li>You understand this submission is legally binding</li>
              </ul>
            </div>

            <p className="text-xs text-neutral-600 italic border-t border-neutral-200 pt-3">
              By proceeding, you confirm that you have read, understood, and accept full responsibility 
              for this submission. This action cannot be undone once submitted to {authority}.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={onCancel} data-testid="button-cancel-filing">
            Cancel - Review Filing
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
            data-testid="button-confirm-filing"
          >
            I Understand & Submit ({creditCost} credits)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
