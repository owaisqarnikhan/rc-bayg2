import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, Eye, MessageSquare, Package, User, DollarSign, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface Order {
  id: string;
  userId: string;
  status: string;
  total: string;
  subtotal: string;
  tax: string;
  vatPercentage: string;
  adminApprovalStatus: string;
  adminApprovedBy?: string;
  adminApprovedAt?: string;
  adminRemarks?: string;
  paymentMethod?: string;
  shippingAddress: any;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
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

export function AdminRequestSection() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/approval-requests"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ orderId, remarks }: { orderId: string; remarks: string }) => {
      const res = await apiRequest(`/api/admin/orders/${orderId}/approve`, "PUT", {
        adminRemarks: remarks,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/approval-requests"] });
      setIsApprovalDialogOpen(false);
      setAdminRemarks("");
      setSelectedOrder(null);
      toast({
        title: "Order Approved",
        description: "Customer has been notified via email and can now proceed with payment.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve order",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ orderId, remarks }: { orderId: string; remarks: string }) => {
      const res = await apiRequest(`/api/admin/orders/${orderId}/reject`, "PUT", {
        adminRemarks: remarks,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/approval-requests"] });
      setIsRejectionDialogOpen(false);
      setAdminRemarks("");
      setSelectedOrder(null);
      toast({
        title: "Order Rejected",
        description: "Customer has been notified via email.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject order",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (order: Order) => {
    setSelectedOrder(order);
    setIsApprovalDialogOpen(true);
  };

  const handleReject = (order: Order) => {
    setSelectedOrder(order);
    setIsRejectionDialogOpen(true);
  };

  const confirmApproval = () => {
    if (selectedOrder) {
      approveMutation.mutate({
        orderId: selectedOrder.id,
        remarks: adminRemarks,
      });
    }
  };

  const confirmRejection = () => {
    if (selectedOrder) {
      rejectMutation.mutate({
        orderId: selectedOrder.id,
        remarks: adminRemarks,
      });
    }
  };

  const getStatusColor = (status: string) => {
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
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredOrders = orders?.filter(order => {
    if (filterStatus === 'all') return true;
    return order.adminApprovalStatus === filterStatus;
  }) || [];

  const pendingCount = orders?.filter(order => order.adminApprovalStatus === 'pending').length || 0;
  const approvedCount = orders?.filter(order => order.adminApprovalStatus === 'approved').length || 0;
  const rejectedCount = orders?.filter(order => order.adminApprovalStatus === 'rejected').length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Order Approval Requests</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Approval Requests</h2>
          <p className="text-gray-600 mt-1">Review and manage customer order approvals</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="px-3 py-1">
            {pendingCount} Pending
          </Badge>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'pending', label: 'Pending', count: pendingCount },
          { key: 'approved', label: 'Approved', count: approvedCount },
          { key: 'rejected', label: 'Rejected', count: rejectedCount },
          { key: 'all', label: 'All', count: orders?.length || 0 }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filterStatus === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filterStatus === 'pending' ? 'No Pending Requests' : `No ${filterStatus === 'all' ? '' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Orders`}
            </h3>
            <p className="text-gray-600">
              {filterStatus === 'pending' 
                ? 'All orders have been reviewed. New requests will appear here.' 
                : 'Orders matching your filter will appear here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </CardTitle>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{order.user?.firstName && order.user?.lastName 
                            ? `${order.user.firstName} ${order.user.lastName}` 
                            : order.user?.username}</span>
                        </div>
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
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getStatusColor(order.adminApprovalStatus)} border`}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(order.adminApprovalStatus)}
                        <span className="capitalize">{order.adminApprovalStatus}</span>
                      </div>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items Summary */}
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

                  {/* Customer Info */}
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-gray-900 mb-2">Customer Details</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Email:</strong> {order.user?.email}</p>
                      {order.shippingAddress && (
                        <p><strong>Address:</strong> {order.shippingAddress.address}, {order.shippingAddress.city}</p>
                      )}
                    </div>
                  </div>

                  {/* Admin Remarks */}
                  {order.adminRemarks && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium text-gray-900 mb-2">Admin Remarks</h4>
                      <p className="text-sm text-gray-600 italic">"{order.adminRemarks}"</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {order.adminApprovalStatus === 'pending' && (
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(order)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(order)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this order? The customer will be notified and can proceed with payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approval-remarks">Admin Remarks (Optional)</Label>
              <Textarea
                id="approval-remarks"
                placeholder="Add any notes for the customer..."
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmApproval}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Approving...
                </>
              ) : (
                "Approve Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this order? The customer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-remarks">Reason for Rejection *</Label>
              <Textarea
                id="rejection-remarks"
                placeholder="Please provide a reason for rejecting this order..."
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmRejection}
              disabled={rejectMutation.isPending || !adminRemarks.trim()}
              variant="destructive"
            >
              {rejectMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Rejecting...
                </>
              ) : (
                "Reject Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}