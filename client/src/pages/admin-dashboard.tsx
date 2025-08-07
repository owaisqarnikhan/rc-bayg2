import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/use-permissions";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { ProductManager } from "@/components/admin/ProductManager";
import { SliderManager } from "@/components/admin/SliderManager";
import { UserManager } from "@/components/admin/UserManager";
import { OrderManager } from "@/components/admin/OrderManager";
import { SiteSettings } from "@/components/admin/SiteSettings";
import DatabaseManager from "@/components/admin/DatabaseManager";
import ExcelManager from "@/components/admin/ExcelManager";
import { UnitsOfMeasureManager } from "@/components/admin/UnitsOfMeasureManager";
import RolePermissionManager from "@/components/admin/RolePermissionManager";
import { 
  DollarSign, 
  ShoppingCart, 
  ShoppingBag,
  Package, 
  Users,
  FileSpreadsheet,
  Settings,
  CheckCircle,
  Shield,
  Crown,
  UserCheck,
  Clock,
  Database
} from "lucide-react";
import { AdminRequestSection } from "@/components/admin/admin-request-section";

interface AdminStats {
  revenue: string;
  orders: number;
  products: number;
  users: number;
  pendingOrders?: number;
  totalRoles?: number;
  totalPermissions?: number;
  activeUsers?: number;
}

export default function AdminDashboard() {
  const { data: user } = useQuery({ queryKey: ["/api/user"] });
  const { hasPermission } = usePermissions();
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="relative mb-8 p-6 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl overflow-hidden">
          <div 
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `url('/src/assets/geometric-design.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-blue-600/80" />
          <div className="relative z-10">
            <h1 className="text-3xl font-bold">
              {(user as any)?.isSuperAdmin ? "Super Admin Panel" : "Manager Panel"}
            </h1>
            <p className="mt-2 opacity-90">
              {(user as any)?.isSuperAdmin 
                ? "Complete system administration with full access to all features" 
                : "Limited management access - contact Super Admin for additional permissions"
              }
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className={`grid grid-cols-1 ${(user as any)?.isSuperAdmin ? 'md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8' : 'md:grid-cols-4'} gap-6 mb-8`}>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-green-800">Total Revenue</CardTitle>
              <div className="p-2 bg-green-500 rounded-full">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold text-green-700">${stats?.revenue || "0.00"}</div>
              )}
              <p className="text-xs text-green-600 mt-1">from all orders</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 hover:shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-blue-800">Total Orders</CardTitle>
              <div className="p-2 bg-blue-500 rounded-full">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold text-blue-700">{stats?.orders || 0}</div>
              )}
              <p className="text-xs text-blue-600 mt-1">completed orders</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 hover:shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-purple-800">Total Products</CardTitle>
              <div className="p-2 bg-purple-500 rounded-full">
                <Package className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold text-purple-700">{stats?.products || 0}</div>
              )}
              <p className="text-xs text-purple-600 mt-1">available</p>
            </CardContent>
          </Card>



          <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 hover:shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-orange-800">Total Users</CardTitle>
              <div className="p-2 bg-orange-500 rounded-full">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold text-orange-700">{stats?.users || 0}</div>
              )}
              <p className="text-xs text-orange-600 mt-1">registered users</p>
            </CardContent>
          </Card>

          {/* Super Admin Only Cards */}
          {(user as any)?.isSuperAdmin && (
            <>
              <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-red-200 hover:shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-red-800">Pending Orders</CardTitle>
                  <div className="p-2 bg-red-500 rounded-full">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <div className="text-3xl font-bold text-red-700">{stats?.pendingOrders || 0}</div>
                  )}
                  <p className="text-xs text-red-600 mt-1">awaiting approval</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-blue-100 border-indigo-200 hover:shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-indigo-800">Active Users</CardTitle>
                  <div className="p-2 bg-indigo-500 rounded-full">
                    <UserCheck className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <div className="text-3xl font-bold text-indigo-700">{stats?.activeUsers || 0}</div>
                  )}
                  <p className="text-xs text-indigo-600 mt-1">active this month</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200 hover:shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-yellow-800">Total Roles</CardTitle>
                  <div className="p-2 bg-yellow-500 rounded-full">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <div className="text-3xl font-bold text-yellow-700">{stats?.totalRoles || 3}</div>
                  )}
                  <p className="text-xs text-yellow-600 mt-1">system roles</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200 hover:shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-teal-800">Permissions</CardTitle>
                  <div className="p-2 bg-teal-500 rounded-full">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <div className="text-3xl font-bold text-teal-700">{stats?.totalPermissions || 85}</div>
                  )}
                  <p className="text-xs text-teal-600 mt-1">total permissions</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="approvals" className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex h-auto w-auto min-w-full p-1 bg-muted rounded-md justify-start md:justify-center flex-nowrap md:flex-wrap gap-1">
            {hasPermission("orders.approve") && (
              <TabsTrigger value="approvals" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Approvals</span>
                <span className="xs:hidden">App</span>
              </TabsTrigger>
            )}
            {hasPermission("orders.view") && (
              <TabsTrigger value="orders" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Orders</span>
                <span className="xs:hidden">Ord</span>
              </TabsTrigger>
            )}
            {hasPermission("categories.view") && (
              <TabsTrigger value="categories" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Categories</span>
                <span className="xs:hidden">Cat</span>
              </TabsTrigger>
            )}
            {hasPermission("products.view") && (
              <TabsTrigger value="products" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Products</span>
                <span className="xs:hidden">Prod</span>
              </TabsTrigger>
            )}
            {hasPermission("slider.view") && (
              <TabsTrigger value="slider" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Slider</span>
                <span className="xs:hidden">Sld</span>
              </TabsTrigger>
            )}
            {hasPermission("users.view") && (
              <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Users</span>
                <span className="xs:hidden">Usr</span>
              </TabsTrigger>
            )}
            {(user as any)?.isSuperAdmin && (
              <TabsTrigger value="permissions" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Roles</span>
                <span className="xs:hidden">Rol</span>
              </TabsTrigger>
            )}
            {hasPermission("database.export") && (
              <TabsTrigger value="excel" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Excel</span>
                <span className="xs:hidden">Exc</span>
              </TabsTrigger>
            )}
            {hasPermission("database.export") && (
              <TabsTrigger value="database" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Database</span>
                <span className="xs:hidden">DB</span>
              </TabsTrigger>
            )}
            {hasPermission("units.view") && (
              <TabsTrigger value="units" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Units</span>
                <span className="xs:hidden">Un</span>
              </TabsTrigger>
            )}
            {hasPermission("settings.view") && (
              <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Settings</span>
                <span className="xs:hidden">Set</span>
              </TabsTrigger>
            )}
            </TabsList>
          </div>

          {hasPermission("orders.approve") && (
            <TabsContent value="approvals">
              <AdminRequestSection />
            </TabsContent>
          )}

          {hasPermission("orders.view") && (
            <TabsContent value="orders">
              <OrderManager />
            </TabsContent>
          )}

          {hasPermission("categories.view") && (
            <TabsContent value="categories">
              <CategoryManager />
            </TabsContent>
          )}

          {hasPermission("products.view") && (
            <TabsContent value="products">
              <ProductManager />
            </TabsContent>
          )}

          {hasPermission("slider.view") && (
            <TabsContent value="slider">
              <SliderManager />
            </TabsContent>
          )}

          {hasPermission("users.view") && (
            <TabsContent value="users">
              <UserManager />
            </TabsContent>
          )}

          {(user as any)?.isSuperAdmin && (
            <TabsContent value="permissions">
              <RolePermissionManager />
            </TabsContent>
          )}

          {hasPermission("database.export") && (
            <TabsContent value="excel">
              <ExcelManager />
            </TabsContent>
          )}

          {hasPermission("database.export") && (
            <TabsContent value="database">
              <DatabaseManager />
            </TabsContent>
          )}

          {hasPermission("units.view") && (
            <TabsContent value="units">
              <UnitsOfMeasureManager />
            </TabsContent>
          )}

          {hasPermission("settings.view") && (
            <TabsContent value="settings">
              <SiteSettings />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}