import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  X, 
  ArrowLeft,
  ShoppingBag,
  Calendar,
  DollarSign,
  CreditCard,
  AlertCircle
} from "lucide-react";
import type { Order, OrderItem, Product } from "@shared/schema";

type OrderWithItems = Order & { items: (OrderItem & { product: Product })[] };

export default function OrdersPage() {
  const [, setLocation] = useLocation();

  const { data: orders, isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "payment_pending":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "awaiting_approval":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "confirmed":  
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <X className="h-4 w-4" />;
      case "payment_pending":
        return <CreditCard className="h-4 w-4" />;
      case "awaiting_approval":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getApprovalStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <X className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: string | null | undefined) => {
    if (!status) return "Pending";
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const canProceedToPayment = (order: OrderWithItems) => {
    const adminApprovalStatus = (order as any).adminApprovalStatus;
    const orderStatus = order.status;
    return adminApprovalStatus === "approved" && 
           (orderStatus === "awaiting_approval" || orderStatus === "payment_pending");
  };

  const getDisplayStatus = (order: OrderWithItems) => {
    const adminApprovalStatus = (order as any).adminApprovalStatus;
    const orderStatus = order.status;
    
    if (adminApprovalStatus === "pending") return "Awaiting Admin Approval";
    if (adminApprovalStatus === "rejected") return "Rejected by Admin";
    if (adminApprovalStatus === "approved" && orderStatus === "awaiting_approval") return "Payment Required";
    
    return formatStatus(orderStatus);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
                <p className="text-slate-600">Track your order history and status</p>
              </div>
            </div>
          </div>
          {orders && orders.length > 0 && (
            <Badge variant="secondary" className="px-3 py-1">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </Badge>
          )}
        </div>

        {/* Empty State */}
        {!orders || orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">No orders yet</h3>
              <p className="text-slate-600 mb-8">
                You haven't placed any orders yet. Start shopping to see your orders here.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => setLocation("/products")} 
                  className="w-full sm:w-auto"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Browse Products
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/categories")}
                  className="w-full sm:w-auto"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Shop by Category
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-900">
                          Order #{order.id.slice(-8).toUpperCase()}
                        </CardTitle>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(order.createdAt!).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4" />
                            <span>${order.total}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Package className="h-4 w-4" />
                            <span>{order.items?.length || 0} items</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      {/* Admin Approval Status */}
                      <Badge 
                        className={`flex items-center space-x-1 px-3 py-1.5 border ${getApprovalStatusColor((order as any).adminApprovalStatus)}`}
                        variant="outline"
                      >
                        {getApprovalStatusIcon((order as any).adminApprovalStatus)}
                        <span className="font-medium text-xs">
                          {(order as any).adminApprovalStatus === "pending" ? "Awaiting Approval" : 
                           (order as any).adminApprovalStatus === "approved" ? "Approved" : 
                           (order as any).adminApprovalStatus === "rejected" ? "Rejected" : "Unknown"}
                        </span>
                      </Badge>
                      
                      {/* Order Status */}
                      <Badge 
                        className={`flex items-center space-x-1 px-3 py-1.5 border ${getStatusColor(order.status)}`}
                        variant="outline"
                      >
                        {getStatusIcon(order.status)}
                        <span className="font-medium text-xs">{getDisplayStatus(order)}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Order Items */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900 mb-3">Order Items:</h4>
                    <div className="grid gap-3">
                      {order.items?.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg">
                          {item.product.imageUrl ? (
                            <img 
                              src={item.product.imageUrl} 
                              alt={item.product.name}
                              className="w-12 h-12 object-cover rounded-md border"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-md flex items-center justify-center border">
                              <span className="text-slate-600 font-semibold text-sm">
                                {item.product.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {item.product.name}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-slate-600">
                              <span>Qty: {item.quantity}</span>
                              <span>${(() => {
                                // Use item price if available, otherwise get contextual price
                                if (item.price) return item.price;
                                const displayPrice = item.product.productType === "rental" && item.product.rentalPrice 
                                  ? item.product.rentalPrice 
                                  : item.product.price;
                                return parseFloat(displayPrice).toFixed(2);
                              })()}</span>
                              {item.product.unitOfMeasure && (
                                <span>per {item.product.unitOfMeasure}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {order.items && order.items.length > 3 && (
                        <div className="text-center py-2 text-sm text-slate-600">
                          and {order.items.length - 3} more items...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Payment Method</h4>
                      <p className="text-sm text-slate-600">
                        {order.paymentMethod || "Not specified"}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        Status: <span className="font-medium">{formatStatus((order as any).paymentStatus)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Admin Remarks */}
                  {(order as any).adminRemarks && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h4 className="font-medium text-slate-900 mb-2">Admin Note</h4>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700 italic">"{(order as any).adminRemarks}"</p>
                      </div>
                    </div>
                  )}

                  {(order as any).orderNotes && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h4 className="font-medium text-slate-900 mb-2">Order Notes</h4>
                      <p className="text-sm text-slate-600">{(order as any).orderNotes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {canProceedToPayment(order) && (
                    <div className="mt-6 pt-4 border-t border-slate-200">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <div>
                            <h4 className="text-sm font-medium text-green-800">Order Approved!</h4>
                            <p className="text-sm text-green-700 mt-1">
                              Your order has been approved by admin. You can now proceed with payment.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => setLocation(`/checkout/${order.id}`)}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Proceed to Payment
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Pending Approval Message */}
                  {(order as any).adminApprovalStatus === "pending" && (
                    <div className="mt-6 pt-4 border-t border-slate-200">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                          <div>
                            <h4 className="text-sm font-medium text-yellow-800">Awaiting Admin Approval</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                              Your order is being reviewed by our admin team. You'll receive an email notification once approved.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rejected Order Message */}
                  {(order as any).adminApprovalStatus === "rejected" && (
                    <div className="mt-6 pt-4 border-t border-slate-200">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <X className="h-5 w-5 text-red-600 mr-2" />
                          <div>
                            <h4 className="text-sm font-medium text-red-800">Order Rejected</h4>
                            <p className="text-sm text-red-700 mt-1">
                              Unfortunately, this order was rejected by admin. 
                              {(order as any).adminRemarks && " Please check the admin note above for details."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}