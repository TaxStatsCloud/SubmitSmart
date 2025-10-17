import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AvatarPlaceholder from "@/components/ui/avatar-placeholder";

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Your new password and confirmation password do not match.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateUser({
        fullName: formData.fullName,
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
      
      setIsEditing(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>User Profile | PromptSubmissions</title>
        <meta name="description" content="View and edit your user profile information." />
      </Helmet>

      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Your Profile</h1>
          <p className="text-neutral-600">
            Manage your personal information and account settings.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="shadow-sm border-neutral-200">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="profile-form" onSubmit={handleSubmit}>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center md:w-1/3">
                    <AvatarPlaceholder 
                      src={user?.profileImage || ""} 
                      name={user?.fullName || ""} 
                      size="lg" 
                      className="w-24 h-24"
                    />
                    {isEditing && (
                      <Button 
                        variant="outline" 
                        className="mt-4 text-sm"
                        type="button"
                      >
                        Change Photo
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Role</Label>
                      <div className="mt-1 px-3 py-2 border border-neutral-200 rounded-md bg-neutral-50 text-neutral-700">
                        {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
                      </div>
                    </div>
                    
                    {isEditing && (
                      <div className="pt-4 border-t border-neutral-200">
                        <h4 className="font-medium text-neutral-800 mb-3">Change Password</h4>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                              id="currentPassword"
                              name="currentPassword"
                              type="password"
                              value={formData.currentPassword}
                              onChange={handleChange}
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="newPassword">New Password</Label>
                              <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                value={formData.newPassword}
                                onChange={handleChange}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="confirmPassword">Confirm New Password</Label>
                              <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-end">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    className="mr-2"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        fullName: user?.fullName || "",
                        email: user?.email || "",
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    form="profile-form"
                    className="bg-[hsl(var(--primary-500))] hover:bg-[hsl(var(--primary-600))]"
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button 
                  className="bg-[hsl(var(--primary-500))] hover:bg-[hsl(var(--primary-600))]"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </CardFooter>
          </Card>
          
          <Card className="shadow-sm border-neutral-200">
            <CardHeader>
              <CardTitle>Account Preferences</CardTitle>
              <CardDescription>
                Manage your notification settings and account preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-neutral-800 mb-3">Email Notifications</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center justify-between p-3 border rounded-md">
                      <span className="text-sm text-neutral-700">Filing deadline reminders</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--primary-500))]"></div>
                      </label>
                    </li>
                    <li className="flex items-center justify-between p-3 border rounded-md">
                      <span className="text-sm text-neutral-700">Document processing updates</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--primary-500))]"></div>
                      </label>
                    </li>
                    <li className="flex items-center justify-between p-3 border rounded-md">
                      <span className="text-sm text-neutral-700">Product updates and news</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--primary-500))]"></div>
                      </label>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default UserProfile;
