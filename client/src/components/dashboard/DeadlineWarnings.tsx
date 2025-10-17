import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, FileText } from "lucide-react";
import { useFilings } from "@/hooks/use-filings";
import { Link } from "wouter";

const DeadlineWarnings = () => {
  const { upcomingFilings, isLoading } = useFilings();

  if (isLoading) {
    return null;
  }

  // Calculate urgency for each filing
  const filingsWithUrgency = upcomingFilings.map(filing => {
    if (!filing.dueDate) return { ...filing, urgency: 'none', daysRemaining: Infinity };
    
    const dueDate = new Date(filing.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let urgency: 'critical' | 'warning' | 'normal' | 'none' = 'none';
    if (daysRemaining < 0) {
      urgency = 'critical'; // Overdue
    } else if (daysRemaining <= 30) {
      urgency = 'critical';
    } else if (daysRemaining <= 60) {
      urgency = 'warning';
    } else {
      urgency = 'normal';
    }

    return { ...filing, urgency, daysRemaining };
  });

  // Filter and sort by urgency
  const criticalFilings = filingsWithUrgency.filter(f => f.urgency === 'critical').slice(0, 3);
  const warningFilings = filingsWithUrgency.filter(f => f.urgency === 'warning').slice(0, 2);

  // Only show if there are urgent filings
  if (criticalFilings.length === 0 && warningFilings.length === 0) {
    return null;
  }

  const formatDaysRemaining = (days: number) => {
    if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days remaining`;
  };

  const getFilingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'annual_accounts': 'Annual Accounts',
      'confirmation_statement': 'Confirmation Statement',
      'corporation_tax': 'Corporation Tax',
    };
    return labels[type] || type;
  };

  return (
    <div className="mb-6 space-y-4" data-testid="deadline-warnings-section">
      {/* Critical Deadlines */}
      {criticalFilings.length > 0 && (
        <Card className="border-red-200 bg-red-50" data-testid="critical-deadlines-card">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">
                  Urgent: {criticalFilings.length} Filing{criticalFilings.length > 1 ? 's' : ''} Due Soon
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  These filings require immediate attention to avoid penalties
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {criticalFilings.map((filing) => (
                <div 
                  key={filing.id} 
                  className="bg-white rounded-lg p-4 border border-red-200"
                  data-testid={`critical-filing-${filing.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-red-600" />
                        <h4 className="font-medium text-neutral-900">
                          {getFilingTypeLabel(filing.type)}
                        </h4>
                      </div>
                      <p className="text-sm text-neutral-600">{filing.company}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-3.5 w-3.5 text-red-600" />
                        <span className="text-sm font-medium text-red-700">
                          {formatDaysRemaining(filing.daysRemaining)}
                        </span>
                        {filing.dueDate && (
                          <span className="text-sm text-neutral-500">
                            • Due {new Date(filing.dueDate).toLocaleDateString('en-GB', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-red-600 hover:bg-red-700"
                      asChild
                      data-testid={`start-filing-${filing.id}`}
                    >
                      <Link href={`/filings/${filing.id}`}>
                        {filing.status === 'draft' || filing.status === 'in_progress' ? 'Continue' : 'Start Filing'}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Deadlines */}
      {warningFilings.length > 0 && (
        <Card className="border-amber-200 bg-amber-50" data-testid="warning-deadlines-card">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-amber-100 p-2 rounded-full">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">
                  Upcoming: {warningFilings.length} Filing{warningFilings.length > 1 ? 's' : ''} in Next 60 Days
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  Plan ahead to avoid last-minute rushes
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {warningFilings.map((filing) => (
                <div 
                  key={filing.id} 
                  className="bg-white rounded-lg p-4 border border-amber-200"
                  data-testid={`warning-filing-${filing.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-amber-600" />
                        <h4 className="font-medium text-neutral-900">
                          {getFilingTypeLabel(filing.type)}
                        </h4>
                      </div>
                      <p className="text-sm text-neutral-600">{filing.company}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">
                          {formatDaysRemaining(filing.daysRemaining)}
                        </span>
                        {filing.dueDate && (
                          <span className="text-sm text-neutral-500">
                            • Due {new Date(filing.dueDate).toLocaleDateString('en-GB', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-amber-600 text-amber-700 hover:bg-amber-100"
                      asChild
                      data-testid={`start-filing-${filing.id}`}
                    >
                      <Link href={`/filings/${filing.id}`}>
                        {filing.status === 'draft' || filing.status === 'in_progress' ? 'Continue' : 'Start Filing'}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeadlineWarnings;
