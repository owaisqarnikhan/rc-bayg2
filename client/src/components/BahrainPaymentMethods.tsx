import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, Banknote, Smartphone, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export type PaymentMethod = "credimax" | "cash_on_delivery";

interface BahrainPaymentMethodsProps {
  total: number;
  orderId: string;
  shippingData: any;
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
  isLocked?: boolean;
  lockReason?: string;
}

export function BahrainPaymentMethods({
  total,
  orderId,
  shippingData,
  onPaymentSuccess,
  onPaymentError,
  isLocked = false,
  lockReason = "Payment is locked until admin approval",
}: BahrainPaymentMethodsProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("credimax");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const paymentMethods = [
    {
      id: "credimax" as PaymentMethod,
      name: "Credimax",
      description: "Pay securely using Credimax - Bahrain's trusted payment gateway",
      icon: <CreditCard className="h-5 w-5" />,
      available: true,
    },
    {
      id: "cash_on_delivery" as PaymentMethod,
      name: "Cash on Delivery",
      description: "Pay when your order arrives at your doorstep",
      icon: <Banknote className="h-5 w-5" />,
      available: true,
    },
  ];

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      if (selectedMethod === "credimax") {
        const response = await apiRequest("/api/credimax/create", "POST", {
          amount: total,
          currency: "BHD",
          orderId,
          customerInfo: {
            name: `${shippingData.firstName} ${shippingData.lastName}`,
            email: shippingData.email,
            phone: shippingData.phone,
          },
        });

        const paymentData = await response.json();

        if (paymentData.paymentUrl) {
          // Redirect to Credimax payment gateway
          toast({
            title: "Redirecting to Credimax",
            description: "You will be redirected to complete your payment",
          });
          
          // Simulate successful payment for demo
          setTimeout(() => {
            onPaymentSuccess({
              method: "credimax",
              transactionId: paymentData.transactionId,
              amount: total,
            });
          }, 2000);
        }
      } else if (selectedMethod === "cash_on_delivery") {
        const response = await apiRequest("/api/cash-on-delivery", "POST", {
          orderId,
          amount: total,
          shippingAddress: shippingData,
        });

        const result = await response.json();

        if (result.success) {
          toast({
            title: "Order Confirmed",
            description: "Your cash on delivery order has been placed successfully",
          });

          onPaymentSuccess({
            method: "cash_on_delivery",
            orderId,
            amount: total,
          });
        }
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      onPaymentError(error.message || "Payment failed");
      toast({
        title: "Payment Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Methods
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose your preferred payment method for Bahrain
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLocked && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Payment Currently Locked</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{lockReason}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <RadioGroup
          value={selectedMethod}
          onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
          disabled={isLocked}
        >
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
                selectedMethod === method.id && !isLocked
                  ? "border-primary bg-primary/5"
                  : "border-border"
              } ${!method.available || isLocked ? "opacity-50" : "cursor-pointer"}`}
            >
              <RadioGroupItem
                value={method.id}
                id={method.id}
                disabled={!method.available || isLocked}
              />
              <Label
                htmlFor={method.id}
                className={`flex-1 cursor-pointer ${
                  !method.available || isLocked ? "cursor-not-allowed" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                    {method.icon}
                  </div>
                  <div>
                    <div className="font-medium">
                      {method.name}
                      {!method.available && !isLocked && (
                        <span className="ml-2 text-xs text-gray-500">(Coming Soon)</span>
                      )}
                      {isLocked && (
                        <span className="ml-2 text-xs text-yellow-600">(Locked)</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {method.description}
                    </div>
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-lg font-semibold">
              ${total.toFixed(2)}
            </span>
          </div>

          <Button
            onClick={handlePayment}
            disabled={isProcessing || !paymentMethods.find(m => m.id === selectedMethod)?.available || isLocked}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : selectedMethod === "cash_on_delivery" ? (
              "Place Order (Cash on Delivery)"
            ) : (
              `Pay $${total.toFixed(2)}`
            )}
          </Button>

          {selectedMethod === "cash_on_delivery" && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              You will pay ${total.toFixed(2)} when your order is delivered
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}