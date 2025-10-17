import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Activity } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const RecentActivity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await apiRequest('GET', '/api/activities');
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [user]);

  // Function to determine the icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document_upload':
        return { icon: 'upload_file', bgColor: 'bg-[hsl(var(--primary-100))]', textColor: 'text-[hsl(var(--primary-500))]' };
      case 'user_invite':
      case 'user_accept':
        return { icon: 'account_circle', bgColor: 'bg-[hsl(var(--secondary-100))]', textColor: 'text-[hsl(var(--secondary-500))]' };
      case 'filing_generate':
        return { icon: 'auto_awesome', bgColor: 'bg-[hsl(var(--accent-100))]', textColor: 'text-[hsl(var(--accent-500))]' };
      case 'filing_update':
        return { icon: 'edit_document', bgColor: 'bg-[hsl(var(--primary-100))]', textColor: 'text-[hsl(var(--primary-500))]' };
      case 'filing_submit':
        return { icon: 'task_alt', bgColor: 'bg-[hsl(var(--success-100))]', textColor: 'text-[hsl(var(--success-500))]' };
      default:
        return { icon: 'info', bgColor: 'bg-neutral-100', textColor: 'text-neutral-500' };
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      });
    }
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-neutral-800">Recent Activity</h2>
      </div>
      
      <Card className="shadow-sm border-neutral-200">
        <CardContent className="p-4">
          {isLoading ? (
            <p className="text-sm text-neutral-500">Loading activities...</p>
          ) : activities && activities.length > 0 ? (
            <ul className="space-y-4">
              {activities.map((activity, index) => {
                const { icon, bgColor, textColor } = getActivityIcon(activity.type);
                return (
                  <li key={activity.id || index} className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center`}>
                        <span className={`material-icons ${textColor} text-sm`}>{icon}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-800" dangerouslySetInnerHTML={{ __html: activity.description }}></p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {formatDate(activity.createdAt.toString())}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className="h-8 w-8 rounded-full bg-[hsl(var(--primary-100))] flex items-center justify-center">
                    <span className="material-icons text-[hsl(var(--primary-500))] text-sm">upload_file</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-neutral-800">
                    You uploaded <span className="font-medium">Trial Balance Q2.xlsx</span>
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Today, 10:42 AM
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className="h-8 w-8 rounded-full bg-[hsl(var(--secondary-100))] flex items-center justify-center">
                    <span className="material-icons text-[hsl(var(--secondary-500))] text-sm">account_circle</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-neutral-800">
                    <span className="font-medium">James Wilson</span> accepted your invitation to collaborate
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Yesterday, 2:15 PM
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className="h-8 w-8 rounded-full bg-[hsl(var(--accent-100))] flex items-center justify-center">
                    <span className="material-icons text-[hsl(var(--accent-500))] text-sm">auto_awesome</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-neutral-800">
                    PromptSubmissions AI generated <span className="font-medium">Annual Accounts draft</span> for Bright Innovations Ltd
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    2 days ago, 9:30 AM
                  </p>
                </div>
              </li>
            </ul>
          )}
        </CardContent>
        <div className="p-3 border-t border-neutral-200 text-center">
          <Button 
            variant="ghost"
            className="text-sm text-[hsl(var(--primary-600))] hover:text-[hsl(var(--primary-700))] font-medium"
            asChild
          >
            <Link href="/activities">
              View All Activity
            </Link>
          </Button>
        </div>
      </Card>
    </section>
  );
};

export default RecentActivity;
