import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Users, Shield, Settings, Package, ShoppingCart, Tag, Ruler, Image, BarChart3, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isSystemRole: boolean;
  isActive: boolean;
}

interface PermissionModule {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  sortOrder: number;
}

interface Permission {
  id: string;
  moduleId: string;
  name: string;
  displayName: string;
  description: string;
  action: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  roleId: string | null;
}

const iconMap = {
  Users,
  Shield,
  Settings,
  Package,
  ShoppingCart,
  Tag,
  Ruler,
  Image,
  BarChart3,
  Mail
};

export default function RolePermissionManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Fetch roles
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["/api/admin/roles"],
  });

  // Fetch permission modules
  const { data: modules = [] } = useQuery<PermissionModule[]>({
    queryKey: ["/api/admin/permission-modules"],
  });

  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch permissions for selected module
  const { data: modulePermissions = [] } = useQuery<Permission[]>({
    queryKey: ["/api/admin/permissions", selectedModule],
    enabled: !!selectedModule,
  });

  // Fetch current role permissions
  const { data: rolePermissions = [] } = useQuery<Permission[]>({
    queryKey: ["/api/admin/role-permissions", selectedRole],
    enabled: !!selectedRole,
  });

  // Mutation to assign permissions to role
  const assignPermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      await apiRequest(`/api/admin/assign-permissions`, "POST", { roleId, permissionIds });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Permissions assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-permissions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign permissions",
        variant: "destructive",
      });
    },
  });

  // Mutation to assign role to user
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      await apiRequest(`/api/admin/assign-role`, "POST", { userId, roleId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Role assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    },
  });

  // Update selected permissions when role changes
  useEffect(() => {
    if (rolePermissions.length > 0) {
      setSelectedPermissions(rolePermissions.map(p => p.id));
    } else {
      setSelectedPermissions([]);
    }
  }, [rolePermissions]);

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSavePermissions = () => {
    if (!selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role first",
        variant: "destructive",
      });
      return;
    }

    assignPermissionsMutation.mutate({
      roleId: selectedRole,
      permissionIds: selectedPermissions,
    });
  };

  const handleAssignRole = () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select both user and role",
        variant: "destructive",
      });
      return;
    }

    assignRoleMutation.mutate({
      userId: selectedUser,
      roleId: selectedRole,
    });
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Shield;
    return <IconComponent className="h-5 w-5" />;
  };

  const roleOptions = roles.filter(role => !role.isSystemRole); // Hide Super Admin role from assignment

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Role & Permission Management</h2>
        <p className="text-muted-foreground">
          Manage user roles and assign specific permissions (Super Admin Only)
        </p>
      </div>

      <Tabs defaultValue="permissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="permissions">Manage Permissions</TabsTrigger>
          <TabsTrigger value="assign-roles">Assign Roles to Users</TabsTrigger>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Assignment</CardTitle>
              <CardDescription>
                Select a role and assign specific permissions to control access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role to manage" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span>{role.displayName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRole && (
                <div className="space-y-4">
                  <Separator />
                  
                  {/* Module Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Permission Modules</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                      {modules.map((module) => (
                        <Button
                          key={module.id}
                          variant={selectedModule === module.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedModule(module.id)}
                          className="h-auto p-3 flex flex-col items-center space-y-1"
                        >
                          {getIconComponent(module.icon)}
                          <span className="text-xs text-center">{module.displayName}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Permission Selection */}
                  {selectedModule && modulePermissions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">
                        {modules.find(m => m.id === selectedModule)?.displayName} Permissions
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {modulePermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => handlePermissionToggle(permission.id)}
                            />
                            <div className="space-y-1">
                              <label 
                                htmlFor={permission.id} 
                                className="text-sm font-medium cursor-pointer"
                              >
                                {permission.displayName}
                              </label>
                              <Badge variant="secondary" className="text-xs">
                                {permission.action}
                              </Badge>
                              {permission.description && (
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button 
                      onClick={handleSavePermissions}
                      disabled={assignPermissionsMutation.isPending}
                    >
                      {assignPermissionsMutation.isPending ? "Saving..." : "Save Permissions"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assign-roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assign Roles to Users</CardTitle>
              <CardDescription>
                Assign roles to users to give them specific permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* User Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select User</label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(user => !user.isSuperAdmin).map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>{user.username} ({user.email})</span>
                            {user.isAdmin && (
                              <Badge variant="secondary" className="text-xs">Admin</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Role</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4" />
                            <span>{role.displayName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleAssignRole}
                  disabled={assignRoleMutation.isPending}
                >
                  {assignRoleMutation.isPending ? "Assigning..." : "Assign Role"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current User-Role Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Current Role Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.isSuperAdmin ? (
                        <Badge variant="destructive">Super Admin</Badge>
                      ) : user.isAdmin ? (
                        <Badge variant="default">Admin</Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                      {user.roleId && (
                        <Badge variant="outline">
                          {roles.find(r => r.id === user.roleId)?.displayName || "Unknown Role"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">System Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roles.length}</div>
                <p className="text-sm text-muted-foreground">Total roles in system</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Permission Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{modules.length}</div>
                <p className="text-sm text-muted-foreground">Available modules</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">46</div>
                <p className="text-sm text-muted-foreground">System permissions</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Permission Modules Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((module) => (
                  <div key={module.id} className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      {getIconComponent(module.icon)}
                      <h4 className="font-medium">{module.displayName}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}