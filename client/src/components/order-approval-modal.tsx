import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, ArrowRight } from "lucide-react";

interface OrderApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderTotal: string;
}

export function OrderApprovalModal({ isOpen, onClose, orderId, orderTotal }: OrderApprovalModalProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "Order Submitted",
      description: "Your order has been successfully submitted",
      status: "completed",
      icon: <CheckCircle className="h-5 w-5" />
    },
    {
      id: 2,
      title: "Awaiting Admin Approval",
      description: "Your order is being reviewed by our admin team",
      status: "current",
      icon: <Clock className="h-5 w-5" />
    },
    {
      id: 3,
      title: "Payment Processing",
      description: "Complete payment after approval",
      status: "pending",
      icon: <AlertCircle className="h-5 w-5" />
    }
  ];

  const getStepColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "current":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "pending":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto mx-2 sm:mx-4 lg:mx-auto">
        <DialogHeader>
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-green-800">Order Submitted Successfully!</DialogTitle>
            <DialogDescription className="text-gray-600 text-base sm:text-lg px-2">
              Your order #{orderId.slice(-8).toUpperCase()} has been submitted and is now awaiting admin approval
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
          {/* Order Summary */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Order ID</p>
                  <p className="font-semibold text-sm sm:text-base">#{orderId.slice(-8).toUpperCase()}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
                  <p className="font-semibold text-base sm:text-lg">${orderTotal}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Steps */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Process Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 sm:space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-3 sm:space-x-4">
                    <div className={`p-1.5 sm:p-2 rounded-full border-2 ${getStepColor(step.status)}`}>
                      {step.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                        <h3 className="font-semibold text-sm sm:text-base">{step.title}</h3>
                        <Badge variant={step.status === "completed" ? "default" : step.status === "current" ? "secondary" : "outline"} className="text-xs w-fit">
                          {step.status === "completed" ? "Done" : step.status === "current" ? "In Progress" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">{step.description}</p>
                    </div>
                    {index < steps.length - 1 && (
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-2 sm:mt-3 hidden sm:block" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-semibold text-amber-800 text-sm sm:text-base">Important Notice</h4>
                <div className="text-xs sm:text-sm text-amber-700 mt-1 space-y-1">
                  <p>• Payment methods are currently locked until admin approval</p>
                  <p>• You will receive an email notification once your order is approved</p>
                  <p>• Admin review typically takes 24 hours or less</p>
                  <p>• You can track your order status in "My Orders" section</p>
                </div>
              </div>
            </div>
          </div>

          {/* Email Confirmation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h4 className="font-semibold text-blue-800 text-sm sm:text-base">Email Confirmation Sent</h4>
                <p className="text-xs sm:text-sm text-blue-700 mt-1">
                  A confirmation email has been sent to your registered email address with order details and next steps.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Continue Shopping
          </Button>
          <Button onClick={() => window.location.href = '/orders'} className="w-full sm:w-auto">
            View My Orders
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}