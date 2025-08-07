import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  X, 
  AlertCircle,
  Calendar,
  DollarSign,
  Eye,
  CreditCard
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Order {
  id: string;
  userId: string;
  status: string;
  total: string;
  subtotal: string;
  tax: string;
  adminApprovalStatus: string;
  adminApprovedBy?: string;
  adminApprovedAt?: string;
  adminRemarks?: string;
  paymentMethod?: string;
  customerInfo?: any;
  createdAt: string;
  items?: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: string;
    product: {
      id: string;
      name: string;
      imageUrl?: string;
    };
  }>;
}

export function UserRequestSection() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

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

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "processing":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "confirmed":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "payment_pending":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (approvalStatus: string, orderStatus: string) => {
    if (approvalStatus === "rejected") return <X className="h-4 w-4" />;
    if (approvalStatus === "pending") return <Clock className="h-4 w-4" />;
    
    switch (orderStatus) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "payment_pending":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getDisplayStatus = (approvalStatus: string, orderStatus: string) => {
    if (approvalStatus === "pending") return "Awaiting Approval";
    if (approvalStatus === "rejected") return "Rejected";
    if (approvalStatus === "approved" && orderStatus === "awaiting_approval") return "Payment Pending";
    
    switch (orderStatus) {
      case "payment_pending":
        return "Payment Pending";
      case "processing":
        return "Confirmed";
      case "shipped":
        return "Shipped";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return "Processing";
    }
  };

  const getNextAction = (approvalStatus: string, orderStatus: string) => {
    if (approvalStatus === "pending") return "Waiting for admin review";
    if (approvalStatus === "rejected") return "Order was rejected";
    if (approvalStatus === "approved" && orderStatus === "awaiting_approval") return "Complete payment to proceed";
    
    switch (orderStatus) {
      case "payment_pending":
        return "Complete payment to proceed";
      case "processing":
        return "Order is being prepared";
      case "shipped":
        return "Package is on the way";
      case "delivered":
        return "Order completed successfully";
      case "cancelled":
        return "Order was cancelled";
      default:
        return "Processing your order";
    }
  };

  const canPayment = (approvalStatus: string, orderStatus: string) => {
    return approvalStatus === "approved" && (orderStatus === "awaiting_approval" || orderStatus === "payment_pending");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Order Requests</h2>
        </div>
        <div className="space-y-4">
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
    );
  }

  const pendingOrders = orders?.filter(order => order.adminApprovalStatus === 'pending') || [];
  const approvedOrders = orders?.filter(order => order.adminApprovalStatus === 'approved') || [];
  const rejectedOrders = orders?.filter(order => order.adminApprovalStatus === 'rejected') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Order Requests</h2>
          <p className="text-gray-600 mt-1">Track your order approval status and progress</p>
        </div>
        <div className="flex items-center space-x-4">
          {pendingOrders.length > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {pendingOrders.length} Pending Approval
            </Badge>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingOrders.length}</p>
                <p className="text-sm text-gray-600">Awaiting Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedOrders.length}</p>
                <p className="text-sm text-gray-600">Approved Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-full">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedOrders.length}</p>
                <p className="text-sm text-gray-600">Rejected Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      {!orders || orders.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't submitted any orders for approval yet. Start shopping to see your orders here.
            </p>
            <Button onClick={() => window.location.href = '/products'}>
              Browse Products
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Order #{order.id.slice(-8).toUpperCase()}
                    </CardTitle>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDistanceToNow(new Date(order.createdAt))} ago</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                        <span>${order.total}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={`${getApprovalStatusColor(order.adminApprovalStatus)} border`}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(order.adminApprovalStatus, order.status)}
                        <span>{getDisplayStatus(order.adminApprovalStatus, order.status)}</span>
                      </div>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Items ({order.items?.length || 0})</h4>
                    <div className="space-y-2">
                      {order.items?.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.quantity}x {item.product.name}
                          </span>
                          <span className="font-medium">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      {(order.items?.length || 0) > 3 && (
                        <div className="text-sm text-gray-500">
                          +{(order.items?.length || 0) - 3} more items
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="border-t pt-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {order.adminApprovalStatus === "pending" ? (
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                        ) : order.adminApprovalStatus === "approved" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {getNextAction(order.adminApprovalStatus, order.status)}
                        </p>
                        {order.adminApprovalStatus === "pending" && (
                          <p className="text-xs text-gray-500 mt-1">
                            Admin review typically takes 24 hours or less
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Admin Remarks */}
                  {order.adminRemarks && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium text-gray-900 mb-2">Admin Note</h4>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700 italic">"{order.adminRemarks}"</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {canPayment(order.adminApprovalStatus, order.status) && (
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => window.location.href = `/checkout/${order.id}`}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Complete Payment
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}