import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users } from "lucide-react";

const UserManagement = () => {
  const { toast } = useToast();
  const [isAddingUser, setIsAddingUser] = useState(false);
  
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/users'],
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        
        <Button onClick={() => setIsAddingUser(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Company Users
          </CardTitle>
          <CardDescription>
            Manage users who can access your company account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(users) && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={user.profileImage || ""} alt={user.fullName} />
                            <AvatarFallback>{user.fullName?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          {user.fullName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "outline"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;