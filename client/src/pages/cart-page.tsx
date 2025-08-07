import { useQuery, useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import type { CartItem, Product } from "@shared/schema";

type CartItemWithProduct = CartItem & { product: Product };

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: cartItems, isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const res = await apiRequest(`/api/cart/${productId}`, "PUT", { quantity });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest(`/api/cart/${productId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Success",
        description: "Item removed from cart",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    },
  });

  const subtotal = cartItems?.reduce(
    (sum, item) => {
      // Use totalPrice from cart item if available (for rentals), otherwise calculate from appropriate price
      const itemTotal = item.totalPrice ? parseFloat(item.totalPrice) : (() => {
        const displayPrice = item.product.productType === "rental" && item.product.rentalPrice 
          ? item.product.rentalPrice 
          : item.product.price;
        return parseFloat(displayPrice) * item.quantity;
      })();
      return sum + itemTotal;
    },
    0
  ) || 0;

  const tax = subtotal * 0.10; // 10% VAT
  const total = subtotal + tax;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <Card>
            <CardContent className="p-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border-b last:border-b-0">
                  <Skeleton className="h-20 w-20" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 text-slate-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h1>
            <p className="text-slate-600 mb-8">Add some products to get started!</p>
            <Button onClick={() => setLocation("/products")}>
              Continue Shopping
            </Button>
          </div>
        </div>
        
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Shopping Cart</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Cart Items ({cartItems.length})</CardTitle>
          </CardHeader>
          
          <CardContent className="divide-y divide-slate-200">
            {cartItems.map((item) => (
              <div key={item.id} className="py-6 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex-shrink-0">
                  {item.product.imageUrl ? (
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center">
                      <span className="text-slate-500 text-xs">{item.product.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{item.product.name}</h3>
                  <p className="text-slate-600">{item.product.description}</p>
                  
                  {/* Rental Information */}
                  {item.product.productType === "rental" && item.rentalStartDate && item.rentalEndDate && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-blue-600">
                        📅 Rental Period: {new Date(item.rentalStartDate).toLocaleDateString()} - {new Date(item.rentalEndDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-green-600">
                        💰 Daily Rate: ${item.unitPrice || item.product.rentalPrice}
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-2 flex items-center space-x-4">
                    <span className="text-primary font-semibold">
                      {item.totalPrice ? `Total: $${parseFloat(item.totalPrice).toFixed(2)}` : 
                        `$${parseFloat(
                          item.product.productType === "rental" && item.product.rentalPrice 
                            ? item.product.rentalPrice 
                            : item.product.price
                        ).toFixed(2)}`}
                    </span>
                    
                    {/* Only show quantity controls for sale products, not rentals */}
                    {item.product.productType !== "rental" && (
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => 
                            updateQuantityMutation.mutate({
                              productId: item.productId,
                              quantity: Math.max(1, item.quantity - 1)
                            })
                          }
                          disabled={updateQuantityMutation.isPending}
                        >
                          {updateQuantityMutation.isPending ? (
                            <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
                          ) : (
                            <Minus className="h-4 w-4" />
                          )}
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => 
                            updateQuantityMutation.mutate({
                              productId: item.productId,
                              quantity: item.quantity + 1
                            })
                          }
                          disabled={updateQuantityMutation.isPending}
                        >
                          {updateQuantityMutation.isPending ? (
                            <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {/* Show quantity for rental items as read-only */}
                    {item.product.productType === "rental" && (
                      <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-bold text-slate-900">
                    ${item.totalPrice ? parseFloat(item.totalPrice).toFixed(2) : (() => {
                      const displayPrice = item.product.productType === "rental" && item.product.rentalPrice 
                        ? item.product.rentalPrice 
                        : item.product.price;
                      return (parseFloat(displayPrice) * item.quantity).toFixed(2);
                    })()}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => removeItemMutation.mutate(item.productId)}
                    disabled={removeItemMutation.isPending}
                  >
                    {removeItemMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border border-red-400 border-t-transparent"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardContent className="p-6 bg-slate-50">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT (10%):</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setLocation("/products")}
              >
                Continue Shopping
              </Button>
              <Button 
                className="flex-1"
                onClick={() => setLocation("/checkout")}
              >
                Proceed to Checkout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
