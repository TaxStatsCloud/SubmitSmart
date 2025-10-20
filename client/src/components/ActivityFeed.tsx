import { formatDistanceToNow } from 'date-fns';
import { 
  FileText, Upload, Check, X, DollarSign, User, 
  Building, FileCheck, AlertCircle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface Activity {
  id: number;
  userId: number;
  companyId?: number;
  type: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  userName?: string;
  companyName?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  title?: string;
  maxHeight?: string;
  showCompany?: boolean;
}

const activityIcons: Record<string, React.ElementType> = {
  filing_submitted: FileCheck,
  filing_payment: DollarSign,
  document_uploaded: Upload,
  filing_approved: Check,
  filing_rejected: X,
  user_invited: User,
  company_added: Building,
  filing_created: FileText,
  default: AlertCircle
};

const activityColors: Record<string, string> = {
  filing_submitted: 'text-blue-500',
  filing_payment: 'text-green-500',
  document_uploaded: 'text-purple-500',
  filing_approved: 'text-green-500',
  filing_rejected: 'text-red-500',
  user_invited: 'text-amber-500',
  company_added: 'text-indigo-500',
  filing_created: 'text-neutral-500',
  default: 'text-neutral-400'
};

export function ActivityFeed({
  activities,
  title = 'Recent Activity',
  maxHeight = '400px',
  showCompany = true
}: ActivityFeedProps) {
  const getIcon = (type: string) => {
    const Icon = activityIcons[type] || activityIcons.default;
    const color = activityColors[type] || activityColors.default;
    return <Icon className={`h-4 w-4 ${color}`} />;
  };

  return (
    <Card data-testid="activity-feed">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }} className="pr-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  data-testid={`activity-${activity.id}`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900 dark:text-neutral-100">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {activity.userName && (
                        <span>{activity.userName}</span>
                      )}
                      {showCompany && activity.companyName && (
                        <>
                          <span>•</span>
                          <span>{activity.companyName}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                    </div>

                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(activity.metadata).map(([key, value]) => (
                          <Badge
                            key={key}
                            variant="outline"
                            className="text-xs"
                          >
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
