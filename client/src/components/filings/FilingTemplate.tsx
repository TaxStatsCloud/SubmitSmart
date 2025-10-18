import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleDashed, FileUp, BarChart3, Clock, Calendar, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";

interface FilingTemplateProps {
  title: string;
  description: string;
  icon: ReactNode;
  status?: string;
  progress?: number;
  dueDate?: string;
  documents?: any[];
  children?: ReactNode;
  wizardRoute?: string;
}

const FilingTemplate = ({
  title,
  description,
  icon,
  status = "not_started",
  progress = 0,
  dueDate,
  documents = [],
  children,
  wizardRoute
}: FilingTemplateProps) => {
  // Function to get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "default";
      case "overdue":
        return "destructive";
      case "pending":
        return "warning";
      default:
        return "outline";
    }
  };

  // Function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <BarChart3 className="h-4 w-4 mr-1" />;
      case "in_progress":
        return <CircleDashed className="h-4 w-4 mr-1 animate-spin" />;
      case "overdue":
        return <AlertTriangle className="h-4 w-4 mr-1" />;
      case "pending":
        return <Clock className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  // Function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            {icon}
            <span className="ml-2">{title}</span>
          </h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={getStatusVariant(status)} className="text-sm py-1.5 px-3">
            {getStatusIcon(status)}
            {status === "not_started" ? "Not Started" : status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
          </Badge>
          
          {wizardRoute ? (
            <Link href={wizardRoute}>
              <Button data-testid="button-start-filing">
                {status === "not_started" ? "Start Filing" : "Continue Filing"}
              </Button>
            </Link>
          ) : (
            <Button data-testid="button-start-filing">
              {status === "not_started" ? "Start Filing" : "Continue Filing"}
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Filing Progress</CardTitle>
            <CardDescription>
              Track your filing completion progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span>Progress: {progress}%</span>
                {dueDate && (
                  <span className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    Due by: {formatDate(dueDate)}
                  </span>
                )}
              </div>
              
              <Progress value={progress} className="h-2" />
              
              <Separator className="my-4" />
              
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  {children || (
                    <div className="text-center py-12">
                      <CircleDashed className="h-12 w-12 mx-auto text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">No filing in progress</h3>
                      <p className="text-muted-foreground mt-1">
                        Start your filing process to see details here
                      </p>
                      
                      <Button className="mt-4">
                        Start Filing
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="documents">
                  <div className="space-y-4">
                    {documents && documents.length > 0 ? (
                      documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center">
                            <FileUp className="h-5 w-5 text-primary mr-2" />
                            <span>{doc.name}</span>
                          </div>
                          <Button variant="outline" size="sm">View</Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileUp className="h-10 w-10 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">No documents attached yet</p>
                        <Button asChild className="mt-4" variant="outline">
                          <Link href="/upload">
                            <FileUp className="h-4 w-4 mr-2" />
                            Upload Documents
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="history">
                  <div className="text-center py-8">
                    <Clock className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No filing history available</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FilingTemplate;