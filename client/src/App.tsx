import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProductsPage from "@/pages/products-page";
import CategoriesPage from "@/pages/categories-page";
import CategoryDetailPage from "@/pages/category-detail-page";
import ProductDetailPage from "@/pages/product-detail-page";
import CartPage from "@/pages/cart-page";
import CheckoutPage from "@/pages/checkout-page";

import OrdersPage from "@/pages/orders-page";
import UserDashboard from "@/pages/user-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ProfilePage from "@/pages/profile-page";
import { ProtectedRoute } from "./lib/protected-route";
import Footer from "@/components/footer";
import { NavigationHeader } from "@/components/navigation-header";
import { useTheme } from "./hooks/use-theme";
import { useLocation } from "wouter";
import { useEffect } from "react";
import type { SiteSettings } from "@shared/schema";

// Component to handle dynamic title updates based on site settings
function DynamicTitleUpdater() {
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (settings?.browserTabTitle) {
      document.title = settings.browserTabTitle;
    } else if (settings?.siteName) {
      document.title = settings.siteName;
    }
  }, [settings?.browserTabTitle, settings?.siteName]);

  return null;
}

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  useTheme(); // This will automatically apply the theme from settings
  return <div>{children}</div>;
}

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/categories" component={CategoriesPage} />
      <ProtectedRoute path="/category/:categoryId" component={CategoryDetailPage} />
      <ProtectedRoute path="/products" component={ProductsPage} />
      <ProtectedRoute path="/products/:id" component={ProductDetailPage} />
      <ProtectedRoute path="/cart" component={CartPage} />

      <ProtectedRoute path="/orders" component={OrdersPage} />
      <ProtectedRoute path="/checkout/:orderId" component={CheckoutPage} />
      <ProtectedRoute path="/checkout" component={CheckoutPage} />
      <ProtectedRoute path="/dashboard" component={UserDashboard} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const isAuthPage = location === "/auth";

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicTitleUpdater />
      {!isAuthPage && <NavigationHeader />}
      <div className="flex-1">
        <Router />
      </div>
      {!isAuthPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeWrapper>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </ThemeWrapper>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
