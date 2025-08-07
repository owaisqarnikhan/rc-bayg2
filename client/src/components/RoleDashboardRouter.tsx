import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

/**
 * Component that automatically routes users to their appropriate dashboard
 * based on their role and permissions when they access /dashboard
 */
export function RoleDashboardRouter() {
  const { user, isLoading: authLoading } = useAuth();
  const { hasManagerAccess, isLoading: permissionsLoading } = usePermissions();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Wait for both auth and permissions to load
    if (authLoading || permissionsLoading || !user) {
      return;
    }

    // Route based on role hierarchy:
    // 1. Super Admin -> Admin Panel
    // 2. Manager (has users.view permission) -> Admin Panel  
    // 3. Regular User -> User Dashboard
    
    if (user.isSuperAdmin || hasManagerAccess()) {
      // Redirect admins and managers to admin panel
      setLocation("/admin");
    }
    // Regular users stay on /dashboard (UserDashboard)
    
  }, [user, hasManagerAccess, authLoading, permissionsLoading, setLocation]);

  // Show loading while determining the correct dashboard
  if (authLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
        <span className="ml-2 text-sm text-gray-600">Loading your dashboard...</span>
      </div>
    );
  }

  // If we reach here, it means the user is a regular user
  // and should see the user dashboard, so we return null
  // and let the UserDashboard component render normally
  return null;
}