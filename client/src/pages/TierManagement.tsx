import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, DollarSign, Zap, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
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

interface SubscriptionTier {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  monthlyPrice: number;
  annualPrice: number | null;
  creditMultiplier: number;
  features: Record<string, any>;
  maxCompanies: number | null;
  maxUsers: number | null;
  isActive: boolean;
  sortOrder: number;
}

const FEATURE_LIST = [
  { key: 'multi_company_management', label: 'Multi-Company Management' },
  { key: 'priority_support', label: 'Priority Support' },
  { key: 'batch_operations', label: 'Batch Operations' },
  { key: 'dedicated_support', label: 'Dedicated Support' },
  { key: 'custom_sla', label: 'Custom SLA' },
  { key: 'api_access', label: 'API Access' },
  { key: 'client_dashboard', label: 'Client Dashboard' },
];

const TierManagement = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [tierToDelete, setTierToDelete] = useState<SubscriptionTier | null>(null);
  
  const [newTier, setNewTier] = useState({
    name: "",
    displayName: "",
    description: "",
    monthlyPrice: 0,
    annualPrice: 0,
    creditMultiplier: 100,
    maxCompanies: null as number | null,
    maxUsers: null as number | null,
    features: {} as Record<string, boolean>,
    sortOrder: 0,
  });
  
  const [editTier, setEditTier] = useState({
    displayName: "",
    description: "",
    monthlyPrice: 0,
    annualPrice: 0,
    creditMultiplier: 100,
    maxCompanies: null as number | null,
    maxUsers: null as number | null,
    features: {} as Record<string, boolean>,
    isActive: true,
    sortOrder: 0,
  });

  const { data: tiers, isLoading } = useQuery<SubscriptionTier[]>({
    queryKey: ['/api/admin/tiers'],
  });

  const createTierMutation = useMutation({
    mutationFn: async (tierData: typeof newTier) => {
      const res = await apiRequest('POST', '/api/admin/tiers', tierData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tiers'] });
      setIsAddDialogOpen(false);
      resetNewTierForm();
      toast({
        title: "Success",
        description: "Subscription tier created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tier",
        variant: "destructive",
      });
    },
  });

  const updateTierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof editTier }) => {
      const res = await apiRequest('PATCH', `/api/admin/tiers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tiers'] });
      setIsEditDialogOpen(false);
      setSelectedTier(null);
      toast({
        title: "Success",
        description: "Tier updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tier",
        variant: "destructive",
      });
    },
  });

  const deleteTierMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/tiers/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tiers'] });
      setTierToDelete(null);
      toast({
        title: "Success",
        description: "Tier deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tier",
        variant: "destructive",
      });
    },
  });

  const resetNewTierForm = () => {
    setNewTier({
      name: "",
      displayName: "",
      description: "",
      monthlyPrice: 0,
      annualPrice: 0,
      creditMultiplier: 100,
      maxCompanies: null,
      maxUsers: null,
      features: {},
      sortOrder: 0,
    });
  };

  const handleCreateTier = () => {
    createTierMutation.mutate(newTier);
  };

  const handleEditTier = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    setEditTier({
      displayName: tier.displayName,
      description: tier.description || "",
      monthlyPrice: tier.monthlyPrice,
      annualPrice: tier.annualPrice || 0,
      creditMultiplier: tier.creditMultiplier,
      maxCompanies: tier.maxCompanies,
      maxUsers: tier.maxUsers,
      features: tier.features || {},
      isActive: tier.isActive,
      sortOrder: tier.sortOrder,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTier = () => {
    if (selectedTier) {
      updateTierMutation.mutate({ id: selectedTier.id, data: editTier });
    }
  };

  const formatPrice = (pence: number) => {
    return `£${(pence / 100).toFixed(2)}`;
  };

  const formatMultiplier = (value: number) => {
    return `${(value / 100).toFixed(1)}x`;
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription Tiers</h1>
          <p className="text-muted-foreground mt-1">Manage pricing plans and features</p>
        </div>
        
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-tier">
          <Plus className="mr-2 h-4 w-4" />
          Add Tier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Tiers
          </CardTitle>
          <CardDescription>
            Manage subscription plans with different pricing and features
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Price (Monthly)</TableHead>
                  <TableHead>Price (Annual)</TableHead>
                  <TableHead>Credit Multiplier</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers?.map((tier) => (
                  <TableRow key={tier.id} data-testid={`row-tier-${tier.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{tier.displayName}</div>
                        <div className="text-sm text-muted-foreground">{tier.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(tier.monthlyPrice)}</TableCell>
                    <TableCell>
                      {tier.annualPrice ? formatPrice(tier.annualPrice) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{formatMultiplier(tier.creditMultiplier)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{tier.maxCompanies ? `${tier.maxCompanies} companies` : 'Unlimited companies'}</div>
                      <div className="text-muted-foreground">
                        {tier.maxUsers ? `${tier.maxUsers} users` : 'Unlimited users'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(tier.features || {})
                          .filter(([_, value]) => typeof value === 'boolean' && value)
                          .slice(0, 3)
                          .map(([key]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {FEATURE_LIST.find(f => f.key === key)?.label || key}
                            </Badge>
                          ))}
                        {Object.entries(tier.features || {}).filter(([_, value]) => typeof value === 'boolean' && value).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{Object.entries(tier.features || {}).filter(([_, value]) => typeof value === 'boolean' && value).length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tier.isActive ? "default" : "secondary"}>
                        {tier.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditTier(tier)}
                          data-testid={`button-edit-tier-${tier.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setTierToDelete(tier)}
                          disabled={tier.name === 'basic'}
                          data-testid={`button-delete-tier-${tier.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Tier Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Subscription Tier</DialogTitle>
            <DialogDescription>
              Add a new pricing tier with custom features and limits
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">Internal Name</Label>
                <Input
                  id="new-name"
                  placeholder="e.g., premium"
                  value={newTier.name}
                  onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                  data-testid="input-new-tier-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-display-name">Display Name</Label>
                <Input
                  id="new-display-name"
                  placeholder="e.g., Premium"
                  value={newTier.displayName}
                  onChange={(e) => setNewTier({ ...newTier, displayName: e.target.value })}
                  data-testid="input-new-tier-display-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-description">Description</Label>
              <Textarea
                id="new-description"
                placeholder="Describe this tier..."
                value={newTier.description}
                onChange={(e) => setNewTier({ ...newTier, description: e.target.value })}
                data-testid="input-new-tier-description"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-monthly-price">Monthly Price (£)</Label>
                <Input
                  id="new-monthly-price"
                  type="number"
                  placeholder="99.00"
                  value={newTier.monthlyPrice / 100}
                  onChange={(e) => setNewTier({ ...newTier, monthlyPrice: Math.round(parseFloat(e.target.value || '0') * 100) })}
                  data-testid="input-new-tier-monthly-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-annual-price">Annual Price (£)</Label>
                <Input
                  id="new-annual-price"
                  type="number"
                  placeholder="990.00"
                  value={newTier.annualPrice / 100}
                  onChange={(e) => setNewTier({ ...newTier, annualPrice: Math.round(parseFloat(e.target.value || '0') * 100) })}
                  data-testid="input-new-tier-annual-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-multiplier">Credit Multiplier</Label>
                <Input
                  id="new-multiplier"
                  type="number"
                  step="0.1"
                  placeholder="1.0"
                  value={newTier.creditMultiplier / 100}
                  onChange={(e) => setNewTier({ ...newTier, creditMultiplier: Math.round(parseFloat(e.target.value || '1') * 100) })}
                  data-testid="input-new-tier-multiplier"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-max-companies">Max Companies</Label>
                <Input
                  id="new-max-companies"
                  type="number"
                  placeholder="Unlimited"
                  value={newTier.maxCompanies || ''}
                  onChange={(e) => setNewTier({ ...newTier, maxCompanies: e.target.value ? parseInt(e.target.value) : null })}
                  data-testid="input-new-tier-max-companies"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-max-users">Max Users</Label>
                <Input
                  id="new-max-users"
                  type="number"
                  placeholder="Unlimited"
                  value={newTier.maxUsers || ''}
                  onChange={(e) => setNewTier({ ...newTier, maxUsers: e.target.value ? parseInt(e.target.value) : null })}
                  data-testid="input-new-tier-max-users"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-sort-order">Sort Order</Label>
                <Input
                  id="new-sort-order"
                  type="number"
                  value={newTier.sortOrder}
                  onChange={(e) => setNewTier({ ...newTier, sortOrder: parseInt(e.target.value || '0') })}
                  data-testid="input-new-tier-sort-order"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features</Label>
              <div className="grid grid-cols-2 gap-2">
                {FEATURE_LIST.map((feature) => (
                  <div key={feature.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`new-feature-${feature.key}`}
                      checked={!!newTier.features[feature.key]}
                      onCheckedChange={(checked) =>
                        setNewTier({
                          ...newTier,
                          features: { ...newTier.features, [feature.key]: checked },
                        })
                      }
                      data-testid={`checkbox-new-feature-${feature.key}`}
                    />
                    <Label htmlFor={`new-feature-${feature.key}`} className="text-sm cursor-pointer">
                      {feature.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} data-testid="button-cancel-new-tier">
                Cancel
              </Button>
              <Button onClick={handleCreateTier} disabled={createTierMutation.isPending} data-testid="button-save-new-tier">
                {createTierMutation.isPending ? 'Creating...' : 'Create Tier'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Tier Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Subscription Tier</DialogTitle>
            <DialogDescription>
              Update pricing, features, and limits for {selectedTier?.displayName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-display-name">Display Name</Label>
                <Input
                  id="edit-display-name"
                  value={editTier.displayName}
                  onChange={(e) => setEditTier({ ...editTier, displayName: e.target.value })}
                  data-testid="input-edit-tier-display-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editTier.isActive ? 'active' : 'inactive'}
                  onValueChange={(value) => setEditTier({ ...editTier, isActive: value === 'active' })}
                >
                  <SelectTrigger data-testid="select-edit-tier-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editTier.description}
                onChange={(e) => setEditTier({ ...editTier, description: e.target.value })}
                data-testid="input-edit-tier-description"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-monthly-price">Monthly Price (£)</Label>
                <Input
                  id="edit-monthly-price"
                  type="number"
                  value={editTier.monthlyPrice / 100}
                  onChange={(e) => setEditTier({ ...editTier, monthlyPrice: Math.round(parseFloat(e.target.value || '0') * 100) })}
                  data-testid="input-edit-tier-monthly-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-annual-price">Annual Price (£)</Label>
                <Input
                  id="edit-annual-price"
                  type="number"
                  value={editTier.annualPrice / 100}
                  onChange={(e) => setEditTier({ ...editTier, annualPrice: Math.round(parseFloat(e.target.value || '0') * 100) })}
                  data-testid="input-edit-tier-annual-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-multiplier">Credit Multiplier</Label>
                <Input
                  id="edit-multiplier"
                  type="number"
                  step="0.1"
                  value={editTier.creditMultiplier / 100}
                  onChange={(e) => setEditTier({ ...editTier, creditMultiplier: Math.round(parseFloat(e.target.value || '1') * 100) })}
                  data-testid="input-edit-tier-multiplier"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-max-companies">Max Companies</Label>
                <Input
                  id="edit-max-companies"
                  type="number"
                  placeholder="Unlimited"
                  value={editTier.maxCompanies || ''}
                  onChange={(e) => setEditTier({ ...editTier, maxCompanies: e.target.value ? parseInt(e.target.value) : null })}
                  data-testid="input-edit-tier-max-companies"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-max-users">Max Users</Label>
                <Input
                  id="edit-max-users"
                  type="number"
                  placeholder="Unlimited"
                  value={editTier.maxUsers || ''}
                  onChange={(e) => setEditTier({ ...editTier, maxUsers: e.target.value ? parseInt(e.target.value) : null })}
                  data-testid="input-edit-tier-max-users"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sort-order">Sort Order</Label>
                <Input
                  id="edit-sort-order"
                  type="number"
                  value={editTier.sortOrder}
                  onChange={(e) => setEditTier({ ...editTier, sortOrder: parseInt(e.target.value || '0') })}
                  data-testid="input-edit-tier-sort-order"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features</Label>
              <div className="grid grid-cols-2 gap-2">
                {FEATURE_LIST.map((feature) => (
                  <div key={feature.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-feature-${feature.key}`}
                      checked={!!editTier.features[feature.key]}
                      onCheckedChange={(checked) =>
                        setEditTier({
                          ...editTier,
                          features: { ...editTier.features, [feature.key]: checked },
                        })
                      }
                      data-testid={`checkbox-edit-feature-${feature.key}`}
                    />
                    <Label htmlFor={`edit-feature-${feature.key}`} className="text-sm cursor-pointer">
                      {feature.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-cancel-edit-tier">
                Cancel
              </Button>
              <Button onClick={handleUpdateTier} disabled={updateTierMutation.isPending} data-testid="button-save-edit-tier">
                {updateTierMutation.isPending ? 'Updating...' : 'Update Tier'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!tierToDelete} onOpenChange={() => setTierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription Tier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{tierToDelete?.displayName}" tier?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => tierToDelete && deleteTierMutation.mutate(tierToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TierManagement;
