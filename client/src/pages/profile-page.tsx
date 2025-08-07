import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Mail,
  Edit,
  Save,
  ArrowLeft,
  Lock
} from "lucide-react";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  // Update form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
      });
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest(`/api/user/profile`, "PATCH", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    });
    setIsEditing(false);
  };

  if (userLoading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setLocation("/dashboard")}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            User Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your personal information and account settings
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            {!isEditing && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter your first name"
                    />
                  ) : (
                    <p className="mt-1 px-3 py-2 text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-md">
                      {user?.firstName || 'Not provided'}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter your last name"
                    />
                  ) : (
                    <p className="mt-1 px-3 py-2 text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-md">
                      {user?.lastName || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email address"
                  />
                ) : (
                  <p className="mt-1 px-3 py-2 text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user?.email || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <Label>Username</Label>
                <p className="mt-1 px-3 py-2 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {user?.username} (Cannot be changed)
                </p>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateProfileMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Member Since</Label>
              <p className="mt-1 text-gray-900 dark:text-gray-100">
                {user?.createdAt 
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Not available'
                }
              </p>
            </div>
            <div>
              <Label>Account Type</Label>
              <p className="mt-1 text-gray-900 dark:text-gray-100">
                Customer Account
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}