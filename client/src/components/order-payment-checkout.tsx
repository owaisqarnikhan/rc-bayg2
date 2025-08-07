import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ArrowLeft, Package, CheckCircle, AlertCircle } from "lucide-react";
import { BahrainPaymentMethods } from "@/components/BahrainPaymentMethods";
import type { Order, OrderItem, Product } from "@shared/schema";

type OrderWithItems = Order & { items: (OrderItem & { product: Product })[] };

interface OrderPaymentCheckoutProps {
  orderId: string;
}

export function OrderPaymentCheckout({ orderId }: OrderPaymentCheckoutProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: order, isLoading } = useQuery<OrderWithItems>({
    queryKey: [`/api/orders/${orderId}`],
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const res = await apiRequest(`/api/orders/${orderId}/payment`, "PUT", paymentData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });
      setLocation("/orders");
    },
    onError: () => {
      toast({
        title: "Payment Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handlePaymentSuccess = (paymentData: any) => {
    updateOrderMutation.mutate({
      paymentMethod: paymentData.method,
      paymentIntentId: paymentData.transactionId || `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "processing", // Update order status to processing after payment
    });
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Error",
      description: error,
      variant: "destructive",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-64 bg-white rounded-lg"></div>
              </div>
              <div className="h-96 bg-white rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Order Not Found</h2>
            <p className="text-slate-600 mb-8">The requested order could not be found.</p>
            <Button onClick={() => setLocation("/orders")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if order can proceed to payment
  const adminApprovalStatus = (order as any).adminApprovalStatus;
  const canProceedToPayment = adminApprovalStatus === "approved" && 
                              (order.status === "awaiting_approval" || order.status === "payment_pending");

  if (!canProceedToPayment) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Payment Not Available</h2>
            <p className="text-slate-600 mb-8">
              {adminApprovalStatus === "pending" 
                ? "This order is still awaiting admin approval." 
                : adminApprovalStatus === "rejected"
                ? "This order has been rejected by admin."
                : "Payment is not available for this order at this time."}
            </p>
            <Button onClick={() => setLocation("/orders")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const total = parseFloat(order.total);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/orders")}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Orders</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Complete Payment</h1>
              <p className="text-slate-600 mt-1">Order #{order.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4 mr-1" />
            Approved
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Items ({order.items?.length || 0})</h4>
                    <div className="space-y-3">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {item.product.imageUrl ? (
                              <img 
                                src={item.product.imageUrl} 
                                alt={item.product.name}
                                className="w-12 h-12 object-cover rounded border"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded flex items-center justify-center border">
                                <span className="text-slate-600 font-semibold text-sm">
                                  {item.product.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-900">{item.product.name}</p>
                              <div className="text-sm text-slate-600 space-y-1">
                                <p>Qty: {item.quantity}</p>
                                {item.rentalStartDate && item.rentalEndDate && (
                                  <p>
                                    Rental: {new Date(item.rentalStartDate).toLocaleDateString()} - {new Date(item.rentalEndDate).toLocaleDateString()}
                                  </p>
                                )}
                                {item.rentalDays && (
                                  <p>Duration: {item.rentalDays} day{item.rentalDays > 1 ? 's' : ''}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-slate-600 mb-1">
                              ${(() => {
                                // Use item price if available, otherwise get contextual price
                                if (item.price) return parseFloat(item.price).toFixed(2);
                                const displayPrice = item.product.productType === "rental" && item.product.rentalPrice 
                                  ? item.product.rentalPrice 
                                  : item.product.price;
                                return parseFloat(displayPrice).toFixed(2);
                              })()} × {item.quantity}
                            </div>
                            <p className="font-medium text-slate-900">
                              ${item.totalPrice || (() => {
                                const unitPrice = item.price || (item.product.productType === "rental" && item.product.rentalPrice 
                                  ? item.product.rentalPrice 
                                  : item.product.price);
                                return (parseFloat(unitPrice) * item.quantity).toFixed(2);
                              })()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Subtotal</span>
                      <span>${order.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Tax (10% VAT)</span>
                      <span>${order.tax}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold text-slate-900 border-t pt-2">
                      <span>Total</span>
                      <span>${order.total}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>

          {/* Payment Section */}
          <div>
            <BahrainPaymentMethods
              total={total}
              orderId={order.id}
              shippingData={(order as any).shippingAddress}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              isLocked={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}