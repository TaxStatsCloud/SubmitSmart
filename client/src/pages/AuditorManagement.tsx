import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserPlus, Mail, Calendar, CheckCircle, XCircle, Clock, Shield, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface AuditorInvitation {
  id: number;
  invitedBy: number;
  companyId: number;
  auditorEmail: string;
  auditorName: string | null;
  token: string;
  status: string;
  accessLevel: string;
  filingIds: number[] | null;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
  acceptedUserId: number | null;
}

interface Filing {
  id: number;
  type: string;
  status: string;
  submitDate: string | null;
  createdAt: string;
}

export default function AuditorManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [auditorEmail, setAuditorEmail] = useState("");
  const [auditorName, setAuditorName] = useState("");
  const [accessScope, setAccessScope] = useState<"all" | "specific">("all");
  const [selectedFilings, setSelectedFilings] = useState<number[]>([]);

  // Fetch auditor invitations
  const { data: invitations = [], isLoading: isLoadingInvitations } = useQuery<AuditorInvitation[]>({
    queryKey: ['/api/auditors/invitations'],
    enabled: !!user?.companyId,
  });

  // Fetch filings for selection
  const { data: filings = [] } = useQuery<Filing[]>({
    queryKey: ['/api/filings'],
    enabled: !!user?.companyId && accessScope === "specific",
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async (data: {
      auditorEmail: string;
      auditorName?: string;
      filingIds?: number[];
    }) => {
      const response = await apiRequest('POST', '/api/auditors/invite', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auditors/invitations'] });
      toast({
        title: "Invitation Sent",
        description: `Auditor invitation sent to ${auditorEmail}`,
      });
      setIsInviteDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Invitation Failed",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await apiRequest('DELETE', `/api/auditors/invitations/${invitationId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auditors/invitations'] });
      toast({
        title: "Invitation Cancelled",
        description: "Auditor invitation has been cancelled",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel invitation",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setAuditorEmail("");
    setAuditorName("");
    setAccessScope("all");
    setSelectedFilings([]);
  };

  const handleSendInvitation = () => {
    if (!auditorEmail) {
      toast({
        title: "Email Required",
        description: "Please enter the auditor's email address",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(auditorEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    sendInvitationMutation.mutate({
      auditorEmail,
      auditorName: auditorName || undefined,
      filingIds: accessScope === "specific" ? selectedFilings : undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "expired":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFilingTypeLabel = (type: string) => {
    switch (type) {
      case "annual_accounts":
        return "Annual Accounts";
      case "ct600":
        return "CT600 Tax Return";
      case "confirmation_statement":
        return "Confirmation Statement";
      default:
        return type;
    }
  };

  const activeInvitations = invitations.filter(inv => inv.status === "accepted" || inv.status === "pending");
  const expiredInvitations = invitations.filter(inv => inv.status === "expired" || inv.status === "cancelled");

  return (
    <>
      <Helmet>
        <title>Auditor Management | PromptSubmissions</title>
        <meta name="description" content="Manage external auditor access to your company filings and documents." />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
              Auditor Management
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Grant external auditors secure, read-only access to your filings and supporting documents.
            </p>
          </div>
          <Button onClick={() => setIsInviteDialogOpen(true)} data-testid="button-invite-auditor">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Auditor
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Invitations</p>
                  <p className="text-2xl font-bold" data-testid="text-active-invitations">{activeInvitations.length}</p>
                </div>
                <Shield className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Accepted</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="text-accepted-invitations">
                    {invitations.filter(inv => inv.status === "accepted").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600" data-testid="text-pending-invitations">
                    {invitations.filter(inv => inv.status === "pending").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Invitations */}
        <Card>
          <CardHeader>
            <CardTitle>Active Auditor Access</CardTitle>
            <CardDescription>
              Auditors with current or pending access to your filings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingInvitations ? (
              <div className="text-center py-8 text-muted-foreground">Loading invitations...</div>
            ) : activeInvitations.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No active auditor invitations. Click "Invite Auditor" to grant access to an external auditor.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auditor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Access Scope</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeInvitations.map((invitation) => (
                    <TableRow key={invitation.id} data-testid={`invitation-row-${invitation.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invitation.auditorName || "Unnamed Auditor"}</p>
                          <p className="text-sm text-muted-foreground">{invitation.auditorEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                      <TableCell>
                        {invitation.filingIds ? (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {invitation.filingIds.length} filing{invitation.filingIds.length !== 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">All filings</Badge>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(invitation.createdAt), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        {new Date(invitation.expiresAt) > new Date() ? (
                          format(new Date(invitation.expiresAt), "dd MMM yyyy")
                        ) : (
                          <span className="text-red-600">Expired</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {invitation.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                            disabled={cancelInvitationMutation.isPending}
                            data-testid={`button-cancel-${invitation.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Expired/Cancelled Invitations */}
        {expiredInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expired & Cancelled Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auditor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiredInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invitation.auditorName || "Unnamed Auditor"}</p>
                          <p className="text-sm text-muted-foreground">{invitation.auditorEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                      <TableCell>{format(new Date(invitation.createdAt), "dd MMM yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Info Alert */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">About Auditor Access</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Auditors receive <strong>read-only</strong> access to filings and documents</li>
              <li>Invitations expire after 30 days if not accepted</li>
              <li>You can grant access to all filings or specific filings only</li>
              <li>Auditors cannot modify, delete, or submit any data</li>
              <li>You can cancel pending invitations at any time</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>

      {/* Invite Auditor Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-invite-auditor">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite External Auditor
            </DialogTitle>
            <DialogDescription>
              Grant an external auditor read-only access to your filings and documents.
              They'll receive an email invitation to create an account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="auditor-email">Auditor Email <span className="text-red-500">*</span></Label>
              <Input
                id="auditor-email"
                type="email"
                placeholder="auditor@example.com"
                value={auditorEmail}
                onChange={(e) => setAuditorEmail(e.target.value)}
                data-testid="input-auditor-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auditor-name">Auditor Name (Optional)</Label>
              <Input
                id="auditor-name"
                placeholder="John Smith"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                data-testid="input-auditor-name"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="access-scope">Access Scope</Label>
              <Select value={accessScope} onValueChange={(value: "all" | "specific") => setAccessScope(value)}>
                <SelectTrigger id="access-scope" data-testid="select-access-scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All current and future filings</SelectItem>
                  <SelectItem value="specific">Specific filings only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {accessScope === "specific" && (
              <div className="space-y-2">
                <Label>Select Filings</Label>
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                  {filings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No filings available</p>
                  ) : (
                    filings.map((filing) => (
                      <div key={filing.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`filing-${filing.id}`}
                          checked={selectedFilings.includes(filing.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFilings([...selectedFilings, filing.id]);
                            } else {
                              setSelectedFilings(selectedFilings.filter(id => id !== filing.id));
                            }
                          }}
                          className="h-4 w-4"
                          data-testid={`checkbox-filing-${filing.id}`}
                        />
                        <label htmlFor={`filing-${filing.id}`} className="text-sm flex-1">
                          {getFilingTypeLabel(filing.type)} - {format(new Date(filing.createdAt), "dd MMM yyyy")}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsInviteDialogOpen(false);
                resetForm();
              }}
              data-testid="button-cancel-invite"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvitation}
              disabled={sendInvitationMutation.isPending}
              data-testid="button-send-invite"
            >
              {sendInvitationMutation.isPending ? (
                "Sending..."
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
