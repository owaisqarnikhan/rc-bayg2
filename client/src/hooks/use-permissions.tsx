import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "../lib/queryClient";

export interface PermissionsResponse {
  permissions: string[];
}

export function usePermissions() {
  const {
    data,
    isLoading,
    error,
  } = useQuery<PermissionsResponse, Error>({
    queryKey: ["/api/user/permissions"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 0, // Always refetch permissions to ensure fresh data
    refetchOnMount: true, // Refetch on component mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const permissions = data?.permissions || [];

  const hasPermission = (permission: string): boolean => {
    // First check if permissions list contains the permission
    if (permissions.includes(permission)) {
      return true;
    }
    
    // Super admin bypass - if user has "all" permissions or is explicitly marked as super admin
    // This handles cases where superadmin permissions might not be individually listed
    if (permissions.includes("*") || permissions.includes("all")) {
      return true;
    }
    
    return false;
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => permissions.includes(permission));
  };

  // Check if user has manager role access
  // Only check for users.view permission which is exclusive to managers and super admins
  const hasManagerAccess = (): boolean => {
    // Only managers and super admins can view all users - this is the key differentiator
    return permissions.includes("users.view");
  };

  return {
    permissions,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasManagerAccess,
  };
}