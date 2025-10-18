import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  FileText,
  CreditCard,
  Bell,
  BarChart3,
  Shield,
  Zap
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { FILING_COSTS } from "@shared/filingCosts";

interface OnboardingStep {
  title: string;
  description: string;
  icon: typeof FileText;
  content: JSX.Element;
  action?: {
    label: string;
    href: string;
  };
}

export default function OnboardingTutorial() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps: OnboardingStep[] = [
    {
      title: "Welcome to PromptSubmissions",
      description: "Your AI-powered UK corporate compliance platform",
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="text-neutral-700">
            PromptSubmissions automates your UK corporate filings with 100% accuracy, preparing you for the April 2027 mandatory software filing deadline.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm text-blue-900">Annual Accounts</h4>
                <p className="text-xs text-blue-700 mt-1">iXBRL filing with FRC 2025 taxonomy</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <Shield className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm text-green-900">Confirmation Statement</h4>
                <p className="text-xs text-green-700 mt-1">CS01 compliance made simple</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm text-purple-900">Corporation Tax</h4>
                <p className="text-xs text-purple-700 mt-1">CT600 automated preparation</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Understanding Credits",
      description: "How our credit system works",
      icon: CreditCard,
      content: (
        <div className="space-y-4">
          <p className="text-neutral-700">
            PromptSubmissions uses a credit-based system for filings. Credits ensure fair pricing and allow you to pay only for what you use.
          </p>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mt-4">
            <h4 className="font-semibold text-lg text-neutral-900 mb-4">Credit Costs</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-700">Annual Accounts (iXBRL)</span>
                <Badge variant="secondary" className="bg-white">{FILING_COSTS.ANNUAL_ACCOUNTS} credits (£{FILING_COSTS.ANNUAL_ACCOUNTS})</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-700">Corporation Tax (CT600)</span>
                <Badge variant="secondary" className="bg-white">{FILING_COSTS.CORPORATION_TAX} credits (£{FILING_COSTS.CORPORATION_TAX})</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-700">Confirmation Statement</span>
                <Badge variant="secondary" className="bg-white">{FILING_COSTS.CONFIRMATION_STATEMENT} credits (£{FILING_COSTS.CONFIRMATION_STATEMENT})</Badge>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-2">
              <Bell className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-amber-900">Low Balance Alerts</p>
                <p className="text-sm text-amber-700 mt-1">
                  You'll receive warnings when your credit balance runs low, so you never have interrupted workflows.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      action: {
        label: "Buy Credits",
        href: "/credits",
      },
    },
    {
      title: "Deadline Management",
      description: "Never miss a filing deadline",
      icon: Bell,
      content: (
        <div className="space-y-4">
          <p className="text-neutral-700">
            Your dashboard displays upcoming deadlines with visual urgency indicators to help you stay compliant.
          </p>
          <div className="space-y-3 mt-4">
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-red-600"></div>
                <span className="font-semibold text-sm text-red-900">Critical Alert ({"<"}30 days)</span>
              </div>
              <p className="text-sm text-red-700">
                Filings due within 30 days appear in red with urgent action buttons
              </p>
            </div>
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-amber-600"></div>
                <span className="font-semibold text-sm text-amber-900">Warning Alert (31-60 days)</span>
              </div>
              <p className="text-sm text-amber-700">
                Filings due within 60 days appear in amber to help you plan ahead
              </p>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-neutral-400"></div>
                <span className="font-semibold text-sm text-neutral-900">Normal ({">"}60 days)</span>
              </div>
              <p className="text-sm text-neutral-600">
                Filings due after 60 days appear in the upcoming filings list
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Filing Analytics",
      description: "Track your compliance progress",
      icon: BarChart3,
      content: (
        <div className="space-y-4">
          <p className="text-neutral-700">
            Monitor your filing activity, credit usage, and cost savings compared to traditional accountants.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-sm text-blue-900">Filings Completed</span>
              </div>
              <p className="text-xs text-blue-700">
                Track all your submitted and approved filings
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-sm text-green-900">Money Saved</span>
              </div>
              <p className="text-xs text-green-700">
                See how much you've saved vs traditional services
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-sm text-purple-900">Success Rate</span>
              </div>
              <p className="text-xs text-purple-700">
                Monitor your filing approval percentage
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-amber-600" />
                <span className="font-semibold text-sm text-amber-900">Credit Usage</span>
              </div>
              <p className="text-xs text-amber-700">
                30-day trend charts and usage stats
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Ready to Start Filing",
      description: "You're all set!",
      icon: CheckCircle,
      content: (
        <div className="space-y-4">
          <p className="text-neutral-700">
            You now know the essentials of PromptSubmissions. Here's what to do next:
          </p>
          <div className="space-y-3 mt-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-semibold text-sm">
                1
              </span>
              <div>
                <h4 className="font-semibold text-sm text-neutral-900">Ensure you have credits</h4>
                <p className="text-sm text-neutral-600 mt-1">
                  Current balance: <strong>{user?.credits || 0} credits</strong>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white font-semibold text-sm">
                2
              </span>
              <div>
                <h4 className="font-semibold text-sm text-neutral-900">Choose your filing type</h4>
                <p className="text-sm text-neutral-600 mt-1">
                  Start with Annual Accounts, Confirmation Statement, or Corporation Tax
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white font-semibold text-sm">
                3
              </span>
              <div>
                <h4 className="font-semibold text-sm text-neutral-900">Follow the step-by-step wizard</h4>
                <p className="text-sm text-neutral-600 mt-1">
                  Our wizards guide you through every step with validation hints
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setLocation("/");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="h-8 w-8 text-blue-600" />
          <div className="text-3xl font-bold">Welcome to PromptSubmissions</div>
        </div>
        <p className="text-neutral-600">
          Let's get you started with automated UK corporate compliance
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-neutral-600">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-3">
          {steps.map((step, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`flex flex-col items-center gap-1 ${
                index === currentStep ? 'opacity-100' : 'opacity-40'
              } hover:opacity-80 transition-opacity`}
              data-testid={`step-selector-${index}`}
              aria-label={`Go to step ${index + 1}: ${step.title}`}
            >
              {completedSteps.includes(index) ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <div
                  className={`h-5 w-5 rounded-full border-2 ${
                    index === currentStep
                      ? 'border-blue-600 bg-blue-100'
                      : 'border-neutral-300'
                  }`}
                />
              )}
              <span className="text-xs hidden sm:block">{step.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <Card className="mb-6" data-testid="onboarding-card">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
              <Icon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl mb-1">{currentStepData.title}</CardTitle>
              <p className="text-neutral-600">{currentStepData.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>{currentStepData.content}</CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            data-testid="previous-step-button"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <div className="flex gap-2">
            {currentStepData.action && (
              <Button variant="outline" asChild data-testid={`step-action-button-${currentStep}`}>
                <Link href={currentStepData.action.href}>
                  {currentStepData.action.label}
                </Link>
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} data-testid="next-step-button">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} data-testid="finish-onboarding-button">
                Go to Dashboard
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Skip */}
      <div className="text-center">
        <Button 
          variant="ghost" 
          onClick={handleComplete}
          className="text-neutral-500"
          data-testid="skip-tutorial-button"
        >
          Skip Tutorial
        </Button>
      </div>
    </div>
  );
}
