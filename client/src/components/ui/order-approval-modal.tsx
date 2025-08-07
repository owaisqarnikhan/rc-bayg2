import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, X } from "lucide-react";

interface OrderApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderTotal: string;
}

export function OrderApprovalModal({ isOpen, onClose, orderId, orderTotal }: OrderApprovalModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <AlertDialogTitle className="text-xl">Order Request Submitted</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-left">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border-l-4 border-blue-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p>
                      Your order request has been sent to the admin. Once the admin accepts your request, you will receive a notification via email, and then you can proceed with the payment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Order ID:</span>
                <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {orderId.slice(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Amount:</span>
                <span className="font-semibold">${orderTotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <span className="text-yellow-600 dark:text-yellow-400">Pending Approval</span>
              </div>
            </div>

            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
              <div className="text-sm text-green-800 dark:text-green-300 space-y-1">
                <p>• Check your email for notifications</p>
                <p>• Visit your orders page for status updates</p>
                <p>• Payment will be available after approval</p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-center space-x-2 pt-4">
          <Button onClick={onClose} className="flex-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Got it
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}