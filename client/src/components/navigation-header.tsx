import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  User, 
  Package, 
  Settings, 
  LogOut,
  Menu,
  Store
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { CartItem, Product, SiteSettings } from "@shared/schema";

type CartItemWithProduct = CartItem & { product: Product };

export function NavigationHeader() {
  const { user, logoutMutation } = useAuth();
  const { hasManagerAccess, isLoading: permissionsLoading } = usePermissions();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: cartItems } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });



  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });

  const cartCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account",
        });
        setLocation("/auth");
      },
    });
  };

  const getNavigationItems = () => {
    const baseItems = [
      { label: "Dashboard", href: "/", icon: Store },
      { label: "Categories", href: "/categories", icon: Package },
      { label: "Products", href: "/products", icon: Package },
    ];

    // HARDCODED FIX: Only show "My Orders" for regular customers, not admin/manager
    // Use role-based permission check instead of isAdmin flag
    if (!user?.isSuperAdmin && !hasManagerAccess()) {
      baseItems.push({ label: "My Orders", href: "/orders", icon: Package });
    }

    return baseItems;
  };

  const NavigationItems = ({ mobile = false }) => (
    <>
      {getNavigationItems().map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.href}
            variant="ghost"
            className={`${mobile ? 'justify-start w-full' : ''} transition-colors duration-200 font-medium rounded-none hover:bg-transparent`}
            style={{ 
              color: siteSettings?.headerTextColor || '#64748b'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = siteSettings?.tabTextColor || '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = siteSettings?.headerTextColor || '#64748b';
            }}
            onClick={() => {
              setLocation(item.href);
              if (mobile) setIsMobileMenuOpen(false);
            }}
          >
            {mobile && <Icon className="mr-2 h-4 w-4" />}
            {item.label}
          </Button>
        );
      })}
    </>
  );

  const logoComponent = (
    <div className="flex items-center space-x-2">
      {siteSettings?.logoUrl ? (
        <img
          src={siteSettings.logoUrl}
          alt={siteSettings.siteName || "InnovanceOrbit"}
          className="h-16 w-auto"
          onError={(e) => {
            // Fallback to text logo if image fails to load
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      <span className={`text-3xl font-bold ${siteSettings?.logoUrl ? 'hidden' : ''}`}>
        {siteSettings?.siteName || "InnovanceOrbit"}
      </span>
    </div>
  );

  return (
    <header 
      className="bg-white shadow-sm border-b sticky top-0 z-50 nav-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-20 sm:h-24">
          {/* Left Section - Navigation Tabs */}
          <div className="flex items-center justify-start">
            <nav className="hidden lg:flex space-x-4 xl:space-x-6">
              <NavigationItems />
            </nav>
            
            {/* Mobile Menu for left navigation */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden"
                  style={{ color: siteSettings?.headerTextColor || '#374151' }}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex flex-col space-y-4 mt-6">
                  <NavigationItems mobile />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Center Section - Logo */}
          <div className="flex items-center justify-center px-2">
            <Button
              variant="ghost"
              className="text-lg sm:text-xl lg:text-2xl font-bold hover:bg-transparent flex items-center space-x-2 sm:space-x-3 transition-colors duration-200 px-2"
              style={{ color: siteSettings?.headerTextColor || '#2563eb' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = siteSettings?.tabTextColor || '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = siteSettings?.headerTextColor || '#2563eb';
              }}
              onClick={() => setLocation("/")}
            >
              {siteSettings?.logoUrl && siteSettings.logoUrl.trim() !== "" ? (
                <img 
                  src={siteSettings.logoUrl} 
                  alt={siteSettings.siteName || "Store"} 
                  className="w-auto max-w-[150px] sm:max-w-[200px]"
                  style={{ height: `${siteSettings.headerLogoHeight || 64}px` }}
                />
              ) : (!siteSettings?.siteName || siteSettings.siteName.trim() === "") ? (
                <Store className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
              ) : null}
              {siteSettings?.siteName && siteSettings.siteName.trim() !== "" && (
                <span className="text-center truncate max-w-[120px] sm:max-w-[200px]">{siteSettings.siteName}</span>
              )}
            </Button>
          </div>

          {/* Right Section - User Actions */}
          <div className="flex items-center justify-end space-x-2 sm:space-x-4">


            {/* Shopping Cart - Only for regular customers, not admin/manager */}
            {!user?.isAdmin && !hasManagerAccess() && (
              <Button
                variant="ghost"
                size="icon"
                className="relative transition-colors duration-200"
                style={{ color: siteSettings?.headerTextColor || '#64748b' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = siteSettings?.tabTextColor || '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = siteSettings?.headerTextColor || '#64748b';
                }}
                onClick={() => setLocation("/cart")}
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {cartCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-xs px-1 sm:px-1.5 py-0.5 min-w-[1rem] sm:min-w-[1.25rem] h-4 sm:h-5 flex items-center justify-center"
                    style={{ 
                      backgroundColor: '#0ea5e9',
                      color: '#ffffff'
                    }}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 px-1 sm:px-3">
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                    <AvatarFallback 
                      className="text-white text-xs sm:text-sm"
                      style={{ backgroundColor: '#2563eb' }}
                    >
                      {user?.username.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span 
                    className="hidden md:block font-medium text-sm"
                    style={{ color: siteSettings?.headerTextColor || '#374151' }}
                  >
                    {user?.username || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Show loading while permissions are being fetched */}
                {permissionsLoading && (
                  <>
                    <DropdownMenuItem disabled>
                      <Settings className="mr-2 h-4 w-4" />
                      Loading...
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Super Admin Panel */}
                {!permissionsLoading && user?.isSuperAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => setLocation("/admin")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Super Admin Panel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Manager Panel */}
                {!permissionsLoading && !user?.isSuperAdmin && hasManagerAccess() && (
                  <>
                    <DropdownMenuItem onClick={() => setLocation("/admin")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Manager Panel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Regular User Panel */}
                {!permissionsLoading && !user?.isSuperAdmin && !hasManagerAccess() && (
                  <>
                    <DropdownMenuItem onClick={() => setLocation("/dashboard")}>
                      <User className="mr-2 h-4 w-4" />
                      User Panel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/orders")}>
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600"
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent mr-2"></div>
                      Signing Out...
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </div>
    </header>
  );
}
