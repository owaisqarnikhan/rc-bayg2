import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Package, 
  DollarSign,
  Calendar,
  User,
  MapPin
} from "lucide-react";

interface Order {
  id: string;
  userId: string;
  status: string;
  adminApprovalStatus: string;
  total: string;
  subtotal: string;
  tax: string;
  vatPercentage: string;
  paymentMethod: string;
  shippingAddress: any;
  adminRemarks?: string;
  adminApprovedBy?: string;
  adminApprovedAt?: string;
  estimatedDeliveryDays: number;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
  items?: Array<{
    id: string;
    quantity: number;
    price: string;
    product: {
      name: string;
      image?: string;
    };
  }>;
}

export function OrderManager() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [adminRemarks, setAdminRemarks] = useState("");

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  const approveOrderMutation = useMutation({
    mutationFn: async ({ orderId, remarks }: { orderId: string; remarks: string }) => {
      const res = await apiRequest(`/api/admin/orders/${orderId}/approve`, "PUT", {
        adminRemarks: remarks
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Order Approved",
        description: "Customer has been notified via email",
      });
      setApprovalAction(null);
      setAdminRemarks("");
      setSelectedOrder(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve order",
        variant: "destructive",
      });
    },
  });

  const rejectOrderMutation = useMutation({
    mutationFn: async ({ orderId, remarks }: { orderId: string; remarks: string }) => {
      const res = await apiRequest(`/api/admin/orders/${orderId}/reject`, "PUT", {
        adminRemarks: remarks
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Order Rejected",
        description: "Customer has been notified via email",
      });
      setApprovalAction(null);
      setAdminRemarks("");
      setSelectedOrder(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject order",
        variant: "destructive",
      });
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest(`/api/admin/orders/${orderId}/complete`, "PUT");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Order Completed",
        description: "Customer has been notified of delivery",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete order",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string, approvalStatus: string) => {
    if (approvalStatus === "pending") {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Awaiting Approval</Badge>;
    }
    if (approvalStatus === "approved") {
      return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    }
    if (approvalStatus === "rejected") {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
    
    switch (status) {
      case "payment_pending":
        return <Badge variant="outline"><DollarSign className="w-3 h-3 mr-1" />Payment Pending</Badge>;
      case "processing":
        return <Badge variant="secondary"><Package className="w-3 h-3 mr-1" />Processing</Badge>;
      case "shipped":
        return <Badge variant="default"><Package className="w-3 h-3 mr-1" />Shipped</Badge>;
      case "delivered":
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApprovalAction = () => {
    if (!selectedOrder || !approvalAction) return;

    if (approvalAction === 'approve') {
      approveOrderMutation.mutate({
        orderId: selectedOrder.id,
        remarks: adminRemarks
      });
    } else {
      rejectOrderMutation.mutate({
        orderId: selectedOrder.id,
        remarks: adminRemarks
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
        <div className="text-sm text-gray-500">
          {orders?.length || 0} total orders
        </div>
      </div>

      <div className="grid gap-4">
        {orders?.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                  {getStatusBadge(order.status, order.adminApprovalStatus)}
                </div>
                <div className="flex items-center space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Order Details - #{order.id.slice(-8)}</DialogTitle>
                        <DialogDescription>
                          Complete order information and management actions
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        {/* Customer Information */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              Customer Information
                            </h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p><strong>Name:</strong> {order.user?.name}</p>
                              <p><strong>Email:</strong> {order.user?.email}</p>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              Order Information
                            </h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                              <p><strong>Delivery:</strong> {order.estimatedDeliveryDays} days</p>
                              <p><strong>Payment:</strong> {order.paymentMethod}</p>
                            </div>
                          </div>
                        </div>



                        {/* Order Items */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                          <div className="space-y-2">
                            {order.items?.map((item) => (
                              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <div>
                                  <p className="font-medium">{item.product.name}</p>
                                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">${item.price}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Totals */}
                        <div className="bg-gray-50 p-4 rounded">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>${order.subtotal}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>VAT ({order.vatPercentage}%):</span>
                              <span>${order.tax}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                              <span>Total:</span>
                              <span>${order.total}</span>
                            </div>
                          </div>
                        </div>

                        {/* Admin Remarks */}
                        {order.adminRemarks && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Admin Remarks</h4>
                            <div className="bg-blue-50 p-3 rounded text-sm">
                              {order.adminRemarks}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {order.adminApprovalStatus === "pending" && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setApprovalAction('approve');
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setApprovalAction('reject');
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}

                  {order.status === "payment_pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => completeOrderMutation.mutate(order.id)}
                    >
                      <Package className="w-4 h-4 mr-1" />
                      Mark Delivered
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Customer</p>
                  <p className="font-medium">{order.user?.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Amount</p>
                  <p className="font-medium">${order.total} (incl. {order.vatPercentage}% VAT)</p>
                </div>
                <div>
                  <p className="text-gray-600">Order Date</p>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {orders?.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600">Orders will appear here once customers start placing them.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Approval Action Dialog */}
      <Dialog open={!!approvalAction} onOpenChange={() => {
        setApprovalAction(null);
        setAdminRemarks("");
        setSelectedOrder(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve Order' : 'Reject Order'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve' 
                ? 'Approve this order and notify the customer to proceed with payment.'
                : 'Reject this order and notify the customer with a reason.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="remarks">
                {approvalAction === 'approve' ? 'Additional Notes (Optional)' : 'Reason for Rejection (Required)'}
              </Label>
              <Textarea
                id="remarks"
                placeholder={approvalAction === 'approve' 
                  ? "Add any additional notes for the customer..." 
                  : "Please provide a reason for rejecting this order..."
                }
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setApprovalAction(null);
                  setAdminRemarks("");
                  setSelectedOrder(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant={approvalAction === 'approve' ? 'default' : 'destructive'}
                onClick={handleApprovalAction}
                disabled={approvalAction === 'reject' && !adminRemarks.trim()}
              >
                {approvalAction === 'approve' ? 'Approve Order' : 'Reject Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}