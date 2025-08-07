import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, Eye, MessageSquare } from "lucide-react";
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

export function OrderApprovalManagement() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ orderId, remarks }: { orderId: string; remarks: string }) => {
      const res = await apiRequest(`/api/admin/orders/${orderId}/approve`, "PUT", {
        adminRemarks: remarks,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsApprovalDialogOpen(false);
      setAdminRemarks("");
      toast({
        title: "Order Approved",
        description: "Customer has been notified via email.",
      });
    },
    onError: () => {
      toast({
        title: "Approval Failed",
        description: "Please try again.",
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
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsRejectionDialogOpen(false);
      setAdminRemarks("");
      toast({
        title: "Order Rejected",
        description: "Customer has been notified via email.",
      });
    },
    onError: () => {
      toast({
        title: "Rejection Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    if (selectedOrder) {
      approveMutation.mutate({
        orderId: selectedOrder.id,
        remarks: adminRemarks,
      });
    }
  };

  const handleReject = () => {
    if (selectedOrder) {
      rejectMutation.mutate({
        orderId: selectedOrder.id,
        remarks: adminRemarks,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending Approval</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingOrders = orders?.filter(order => order.adminApprovalStatus === "pending") || [];
  const processedOrders = orders?.filter(order => order.adminApprovalStatus !== "pending") || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Order Approval Management</h2>
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
            <span>{pendingOrders.length} Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>{processedOrders.filter(o => o.adminApprovalStatus === "approved").length} Approved</span>
          </div>
        </div>
      </div>

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-yellow-600" />
              Pending Approval ({pendingOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                      <p className="text-sm text-gray-600">
                        {order.user?.firstName} {order.user?.lastName} ({order.user?.email})
                      </p>
                      <p className="text-xs text-gray-500">
                        Submitted {formatDistanceToNow(new Date(order.createdAt))} ago
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${order.total}</p>
                      {getStatusBadge(order.adminApprovalStatus)}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Dialog open={isApprovalDialogOpen && selectedOrder?.id === order.id} onOpenChange={setIsApprovalDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Approve Order</DialogTitle>
                          <DialogDescription>
                            Approve order #{order.id.slice(0, 8)} for ${order.total}. The customer will be notified via email.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          <Label htmlFor="approval-remarks">Admin Remarks (Optional)</Label>
                          <Textarea
                            id="approval-remarks"
                            placeholder="Add any notes for the customer..."
                            value={adminRemarks}
                            onChange={(e) => setAdminRemarks(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleApprove} disabled={approveMutation.isPending}>
                            {approveMutation.isPending ? "Approving..." : "Approve Order"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isRejectionDialogOpen && selectedOrder?.id === order.id} onOpenChange={setIsRejectionDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Order</DialogTitle>
                          <DialogDescription>
                            Reject order #{order.id.slice(0, 8)} for ${order.total}. Please provide a reason for rejection.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          <Label htmlFor="rejection-remarks">Reason for Rejection *</Label>
                          <Textarea
                            id="rejection-remarks"
                            placeholder="Please provide a reason for rejecting this order..."
                            value={adminRemarks}
                            onChange={(e) => setAdminRemarks(e.target.value)}
                            required
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsRejectionDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleReject} 
                            disabled={rejectMutation.isPending || !adminRemarks.trim()}
                          >
                            {rejectMutation.isPending ? "Rejecting..." : "Reject Order"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processed Orders */}
      {processedOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Processed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <h4 className="font-medium">Order #{order.id.slice(0, 8)}</h4>
                    <p className="text-sm text-gray-600">
                      {order.user?.firstName} {order.user?.lastName}
                    </p>
                    {order.adminRemarks && (
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {order.adminRemarks}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${order.total}</p>
                    {getStatusBadge(order.adminApprovalStatus)}
                    {order.adminApprovedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(order.adminApprovedAt))} ago
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pendingOrders.length === 0 && processedOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-600">Orders requiring approval will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}