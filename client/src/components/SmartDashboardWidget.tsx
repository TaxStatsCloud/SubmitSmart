import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, FileText, Calendar, CheckCircle, 
  Clock, TrendingUp, DollarSign 
} from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { Link } from 'wouter';

interface DashboardTask {
  id: number;
  title: string;
  type: 'filing_due' | 'draft_incomplete' | 'payment_pending' | 'review_needed';
  urgency: 'high' | 'medium' | 'low';
  dueDate?: Date;
  companyName?: string;
  filingType?: string;
  actionUrl?: string;
}

interface SmartDashboardWidgetProps {
  tasks: DashboardTask[];
  creditBalance?: number;
  recentActivity?: { count: number; trend: 'up' | 'down' };
}

export function SmartDashboardWidget({
  tasks,
  creditBalance,
  recentActivity
}: SmartDashboardWidgetProps) {
  // Sort tasks by urgency and due date (most urgent first)
  const sortedTasks = [...tasks].sort((a, b) => {
    // Urgency priority: high > medium > low
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    if (a.urgency !== b.urgency) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    
    // If same urgency, sort by due date (earliest first)
    if (a.dueDate && b.dueDate) {
      return a.dueDate.getTime() - b.dueDate.getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  const urgentTasks = sortedTasks.filter(t => t.urgency === 'high');
  const todayTasks = sortedTasks.filter(t => 
    t.dueDate && differenceInDays(t.dueDate, new Date()) === 0
  );

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'filing_due': return Calendar;
      case 'draft_incomplete': return FileText;
      case 'payment_pending': return DollarSign;
      case 'review_needed': return AlertTriangle;
      default: return CheckCircle;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="smart-dashboard">
      {/* Urgent Tasks Summary */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Needs Attention Today
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {urgentTasks.length}
          </div>
          <p className="text-xs text-muted-foreground">
            {todayTasks.length} due today
          </p>
          <div className="mt-4 space-y-2">
            {urgentTasks.slice(0, 3).map(task => (
              <div
                key={task.id}
                className="flex items-center gap-2 text-sm"
                data-testid={`urgent-task-${task.id}`}
              >
                <Badge variant={getUrgencyColor(task.urgency)} className="shrink-0">
                  {task.urgency}
                </Badge>
                <span className="truncate">{task.title}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Credit Balance */}
      {creditBalance !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Credit Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creditBalance}
            </div>
            <p className="text-xs text-muted-foreground">
              credits available
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link href="/billing">Purchase More</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Activity This Week
            </CardTitle>
            <TrendingUp className={`h-4 w-4 ${
              recentActivity.trend === 'up' ? 'text-green-500' : 'text-red-500'
            }`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentActivity.count}
            </div>
            <p className="text-xs text-muted-foreground">
              {recentActivity.trend === 'up' ? 'Increase from last week' : 'Decrease from last week'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Task List */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>What Needs Attention</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">All caught up! No pending tasks.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTasks.map(task => {
                const Icon = getTaskIcon(task.type);
                const daysUntilDue = task.dueDate 
                  ? differenceInDays(task.dueDate, new Date())
                  : null;

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    data-testid={`dashboard-task-${task.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Icon className="h-5 w-5 text-neutral-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {task.companyName && (
                            <span className="text-xs text-neutral-500">
                              {task.companyName}
                            </span>
                          )}
                          {task.dueDate && (
                            <>
                              <span className="text-xs text-neutral-400">•</span>
                              <span className={`text-xs ${
                                daysUntilDue !== null && daysUntilDue < 7 
                                  ? 'text-red-600 dark:text-red-400 font-medium'
                                  : 'text-neutral-500'
                              }`}>
                                <Clock className="h-3 w-3 inline mr-1" />
                                Due {formatDistanceToNow(task.dueDate, { addSuffix: true })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={getUrgencyColor(task.urgency)}>
                        {task.urgency}
                      </Badge>
                      {task.actionUrl && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={task.actionUrl}>View</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
