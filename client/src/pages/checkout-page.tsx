import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { OrderApprovalModal } from "@/components/order-approval-modal";
import { OrderPaymentCheckout } from "@/components/order-payment-checkout";
import type { CartItem, Product } from "@shared/schema";

const customerInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
});

type CustomerInfoData = z.infer<typeof customerInfoSchema>;
type CartItemWithProduct = CartItem & { product: Product };

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();

  // If orderId is provided, render order payment checkout
  if (params.orderId) {
    return <OrderPaymentCheckout orderId={params.orderId} />;
  }

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; total: string } | null>(null);

  const { data: cartItems, isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
  });

  const form = useForm<CustomerInfoData>({
    resolver: zodResolver(customerInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiRequest("/api/orders", "POST", orderData);
      return res.json();
    },
    onSuccess: (data) => {
      // Don't invalidate cart immediately - wait until modal is closed
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      setCreatedOrder({
        id: data.id,
        total: data.total
      });
      setShowApprovalModal(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Don't show empty cart message if we're showing the success modal
  if ((!cartItems || cartItems.length === 0) && !showApprovalModal) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Cart is Empty</h1>
          <p className="text-slate-600 mb-8">Add some products to your cart before checkout.</p>
          <Button onClick={() => setLocation("/products")}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = cartItems?.reduce((total, item) => {
    // Use calculated total price from cart item if available, otherwise calculate from appropriate price
    const itemTotal = item.totalPrice ? parseFloat(item.totalPrice) : (() => {
      const displayPrice = item.product.productType === "rental" && item.product.rentalPrice 
        ? item.product.rentalPrice 
        : item.product.price;
      return parseFloat(displayPrice) * item.quantity;
    })();
    return total + itemTotal;
  }, 0) || 0;

  const tax = subtotal * 0.10;
  const total = subtotal + tax;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  const onSubmit = (customerData: CustomerInfoData) => {
    createOrderMutation.mutate({
      customerInfo: customerData,
      status: "awaiting_approval",
      adminApprovalStatus: "pending",
    });
  };

  const handleApprovalModalClose = () => {
    setShowApprovalModal(false);
    setCreatedOrder(null);
    // Now invalidate cart query and redirect to products page
    queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    setLocation("/products");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        {...form.register("firstName")}
                        className="mt-1"
                      />
                      {form.formState.errors.firstName && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        {...form.register("lastName")}
                        className="mt-1"
                      />
                      {form.formState.errors.lastName && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      className="mt-1"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...form.register("phone")}
                      className="mt-1"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full mt-8"
                    disabled={createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Submitting Order...
                      </>
                    ) : (
                      "Submit Order for Approval"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartItems?.map((item) => {
                    // Use calculated total price from cart item if available, otherwise calculate from appropriate price
                    const itemTotal = item.totalPrice ? parseFloat(item.totalPrice) : (() => {
                      const displayPrice = item.product.productType === "rental" && item.product.rentalPrice 
                        ? item.product.rentalPrice 
                        : item.product.price;
                      return parseFloat(displayPrice) * item.quantity;
                    })();
                    const unitPrice = item.unitPrice ? parseFloat(item.unitPrice) : (() => {
                      const displayPrice = item.product.productType === "rental" && item.product.rentalPrice 
                        ? item.product.rentalPrice 
                        : item.product.price;
                      return parseFloat(displayPrice);
                    })();
                    
                    return (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-200">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">{item.product.name}</h4>
                          <div className="text-sm text-slate-600 space-y-1">
                            <p>Quantity: {item.quantity}</p>
                            {item.rentalStartDate && item.rentalEndDate && (
                              <p>
                                Rental: {new Date(item.rentalStartDate).toLocaleDateString()} - {new Date(item.rentalEndDate).toLocaleDateString()}
                              </p>
                            )}
                            <p>Unit Price: ${unitPrice.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-900">
                            ${itemTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="space-y-2 pt-4 border-t border-slate-200">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>VAT (10%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Order Approval Modal */}
      {showApprovalModal && createdOrder && (
        <OrderApprovalModal
          isOpen={showApprovalModal}
          onClose={handleApprovalModalClose}
          orderId={createdOrder.id}
          orderTotal={createdOrder.total}
        />
      )}
    </div>
  );
}