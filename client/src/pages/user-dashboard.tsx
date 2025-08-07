import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { RoleDashboardRouter } from "@/components/RoleDashboardRouter";
import { 
  ShoppingCart, 
  Package, 
  User, 
  CreditCard, 
  Calendar, 
  MapPin,
  Phone,
  Mail,
  Edit,
  Eye,
  History
} from "lucide-react";

export default function UserDashboard() {
  const [, setLocation] = useLocation();

  // Role-based dashboard routing - this will redirect admins/managers to /admin
  // and allow regular users to continue to this dashboard
  const dashboardRouter = <RoleDashboardRouter />;

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch user's orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Fetch cart data
  const { data: cart = [], isLoading: cartLoading } = useQuery({
    queryKey: ["/api/cart"],
  });

  // Calculate totals
  const cartTotal = cart.reduce((sum: number, item: any) => 
    sum + (parseFloat(item.product?.price || 0) * item.quantity), 0
  );
  
  const totalSpent = orders.reduce((sum: number, order: any) => 
    sum + parseFloat(order.totalAmount || 0), 0
  );

  const recentOrders = orders.slice(0, 3);

  if (userLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {dashboardRouter}
      <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            User Panel - Welcome back, {user?.firstName || user?.username}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Your personal dashboard to manage orders, profile, and shopping preferences
          </p>
        </div>
        <Button onClick={() => setLocation("/profile")} variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-800">Cart Items</CardTitle>
            <div className="p-2 bg-blue-500 rounded-full">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {cartLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-blue-700">{cart.length}</div>
            )}
            <p className="text-xs text-blue-600 mt-1">
              Total: ${cartTotal.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-green-800">Total Orders</CardTitle>
            <div className="p-2 bg-green-500 rounded-full">
              <Package className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-700">{orders.length}</div>
            )}
            <p className="text-xs text-green-600 mt-1">all time orders</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-800">Total Spent</CardTitle>
            <div className="p-2 bg-purple-500 rounded-full">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-purple-700">${totalSpent.toFixed(2)}</div>
            )}
            <p className="text-xs text-purple-600 mt-1">lifetime value</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-orange-800">Member Since</CardTitle>
            <div className="p-2 bg-orange-500 rounded-full">
              <Calendar className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {user?.createdAt ? new Date(user.createdAt).getFullYear() : 'N/A'}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              {user?.createdAt 
                ? new Date(user.createdAt).toLocaleDateString()
                : 'join date'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            My Orders
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="cart" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Shopping Cart
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Order History</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/orders")}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All Orders
            </Button>
          </div>
          
          {ordersLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order: any) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Order #{order.orderNumber}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${parseFloat(order.totalAmount || 0).toFixed(2)}</p>
                        <Badge variant={
                          order.status === 'delivered' ? 'default' :
                          order.status === 'approved' ? 'secondary' :
                          order.status === 'pending' ? 'outline' : 'destructive'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No orders yet</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setLocation("/products")}
                >
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Username
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">
                    {user?.username || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user?.email || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    First Name
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">
                    {user?.firstName || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Name
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">
                    {user?.lastName || 'Not provided'}
                  </p>
                </div>
              </div>
              <div className="pt-4">
                <Button onClick={() => setLocation("/profile")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cart Tab */}
        <TabsContent value="cart" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Shopping Cart</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/cart")}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              View Full Cart
            </Button>
          </div>
          
          {cartLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : cart.length > 0 ? (
            <div className="space-y-4">
              {cart.slice(0, 3).map((item: any) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{item.product?.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${(parseFloat(item.product?.price || 0) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {cart.length > 3 && (
                <p className="text-center text-gray-600 dark:text-gray-400">
                  And {cart.length - 3} more items...
                </p>
              )}
              <Card className="bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between font-semibold">
                    <p>Cart Total:</p>
                    <p>${cartTotal.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Your cart is empty</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setLocation("/products")}
                >
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}