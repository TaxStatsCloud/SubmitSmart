import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Coins,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface FilingRecommendation {
  filingType: 'confirmation_statement' | 'annual_accounts' | 'corporation_tax';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  dueDate?: string;
  creditCost: number;
  actionUrl: string;
  estimatedTime: string;
  benefits: string[];
}

interface RecommendationResponse {
  recommendations: FilingRecommendation[];
  generatedAt: string;
  companyId: number | null;
}

const FilingRecommendations = () => {
  const { data, isLoading, error } = useQuery<RecommendationResponse>({
    queryKey: ['/api/recommendations'],
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Smart Filing Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Smart Filing Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-neutral-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">You're all caught up!</p>
            <p className="text-sm mt-1">No urgent filings needed at this time.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getFilingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'confirmation_statement': 'Confirmation Statement',
      'annual_accounts': 'Annual Accounts',
      'corporation_tax': 'Corporation Tax'
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'high': 'bg-red-100 text-red-800 border-red-200',
      'medium': 'bg-amber-100 text-amber-800 border-amber-200',
      'low': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[priority] || colors.low;
  };

  const getPriorityIcon = (priority: string) => {
    return priority === 'high' ? <AlertCircle className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Smart Filing Recommendations
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            AI-Powered
          </Badge>
        </div>
        <p className="text-sm text-neutral-600 mt-1">
          Personalized suggestions based on your company profile
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.recommendations.map((rec, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-neutral-50"
            data-testid={`recommendation-card-${index}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-neutral-900">
                    {getFilingTypeLabel(rec.filingType)}
                  </h4>
                  <Badge 
                    variant="outline" 
                    className={`text-xs border ${getPriorityColor(rec.priority)}`}
                  >
                    <span className="flex items-center gap-1">
                      {getPriorityIcon(rec.priority)}
                      {rec.priority.toUpperCase()}
                    </span>
                  </Badge>
                </div>
                <p className="text-sm text-neutral-600">
                  {rec.reason}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>{rec.estimatedTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Coins className="h-4 w-4 text-amber-600" />
                <span>{rec.creditCost} credits</span>
              </div>
            </div>

            {/* Benefits */}
            {rec.benefits && rec.benefits.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-neutral-700 mb-2">Key Benefits:</p>
                <ul className="space-y-1">
                  {rec.benefits.slice(0, 2).map((benefit, i) => (
                    <li key={i} className="text-xs text-neutral-600 flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Due Date */}
            {rec.dueDate && (
              <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                <strong>Due:</strong> {new Date(rec.dueDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            )}

            {/* Action Button */}
            <Button 
              asChild 
              className="w-full"
              size="sm"
              data-testid={`start-filing-button-${index}`}
            >
              <Link href={rec.actionUrl}>
                Start Filing
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default FilingRecommendations;
