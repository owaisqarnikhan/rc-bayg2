// Email templates for different notification types
export const emailTemplates = {
  orderConfirmation: (data: {
    customerName: string;
    orderNumber: string;
    total: number;
    siteName: string;
  }) => ({
    subject: `Order Confirmation #${data.orderNumber} - ${data.siteName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">${data.siteName}</h1>
          <h2 style="color: #1f2937;">Order Confirmation</h2>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px;">Dear ${data.customerName},</p>
          <p style="margin: 15px 0 0 0;">Thank you for your order! We've received your order and it's being processed.</p>
        </div>

        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="color: #065f46; margin-top: 0;">Order Details</h3>
          <p style="color: #374151; margin: 5px 0;"><strong>Order Number:</strong> #${data.orderNumber}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Total Amount:</strong> $${data.total.toFixed(2)}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Status:</strong> Awaiting Admin Approval</p>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; margin: 0;">
            <strong>Next Steps:</strong> Your order is now awaiting admin approval. You'll receive another email once it's approved and ready for payment.
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, please contact our support team.<br>
            Thank you for choosing ${data.siteName}!
          </p>
        </div>
      </div>
    `,
    text: `Order Confirmation #${data.orderNumber}

Dear ${data.customerName},

Thank you for your order! We've received your order and it's being processed.

Order Details:
- Order Number: #${data.orderNumber}
- Total Amount: $${data.total.toFixed(2)}
- Status: Awaiting Admin Approval

Next Steps: Your order is now awaiting admin approval. You'll receive another email once it's approved and ready for payment.

Thank you for choosing ${data.siteName}!`,
  }),

  orderApproved: (data: {
    customerName: string;
    orderNumber: string;
    total: number;
    siteName: string;
  }) => ({
    subject: `Order Approved #${data.orderNumber} - Ready for Payment`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">${data.siteName}</h1>
          <h2 style="color: #059669;">Order Approved!</h2>
        </div>

        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0; font-size: 16px;">Dear ${data.customerName},</p>
          <p style="margin: 15px 0 0 0;">Great news! Your order has been approved and is ready for payment.</p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Order Details</h3>
          <p style="color: #374151; margin: 5px 0;"><strong>Order Number:</strong> #${data.orderNumber}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Total Amount:</strong> $${data.total.toFixed(2)}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Status:</strong> Approved - Ready for Payment</p>
        </div>

        <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="color: #1e40af; margin: 0;">
            <strong>Next Steps:</strong> Please log in to your account to complete the payment. We accept Credimax and Cash on Delivery.
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            Thank you for your patience. We're excited to fulfill your order!<br>
            ${data.siteName}
          </p>
        </div>
      </div>
    `,
    text: `Order Approved #${data.orderNumber}

Dear ${data.customerName},

Great news! Your order has been approved and is ready for payment.

Order Details:
- Order Number: #${data.orderNumber}
- Total Amount: $${data.total.toFixed(2)}
- Status: Approved - Ready for Payment

Next Steps: Please log in to your account to complete the payment. We accept Credimax and Cash on Delivery.

Thank you for your patience. We're excited to fulfill your order!
${data.siteName}`,
  }),

  orderRejected: (data: {
    customerName: string;
    orderNumber: string;
    total: number;
    reason?: string;
    siteName: string;
  }) => ({
    subject: `Order Update #${data.orderNumber} - ${data.siteName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">${data.siteName}</h1>
          <h2 style="color: #dc2626;">Order Update Required</h2>
        </div>

        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0; font-size: 16px;">Dear ${data.customerName},</p>
          <p style="margin: 15px 0 0 0;">We need to discuss your recent order before we can proceed.</p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Order Details</h3>
          <p style="color: #374151; margin: 5px 0;"><strong>Order Number:</strong> #${data.orderNumber}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Total Amount:</strong> $${data.total.toFixed(2)}</p>
          ${data.reason ? `<p style="color: #374151; margin: 5px 0;"><strong>Note:</strong> ${data.reason}</p>` : ''}
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; margin: 0;">
            <strong>Next Steps:</strong> Please contact our support team to discuss your order and make any necessary adjustments.
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            We're here to help! Please don't hesitate to reach out with any questions.<br>
            ${data.siteName}
          </p>
        </div>
      </div>
    `,
    text: `Order Update #${data.orderNumber}

Dear ${data.customerName},

We need to discuss your recent order before we can proceed.

Order Details:
- Order Number: #${data.orderNumber}
- Total Amount: $${data.total.toFixed(2)}
${data.reason ? `- Note: ${data.reason}` : ''}

Next Steps: Please contact our support team to discuss your order and make any necessary adjustments.

We're here to help! Please don't hesitate to reach out with any questions.
${data.siteName}`,
  }),

  paymentConfirmation: (data: {
    customerName: string;
    orderNumber: string;
    total: number;
    paymentMethod: string;
    siteName: string;
  }) => ({
    subject: `Payment Confirmed #${data.orderNumber} - ${data.siteName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">${data.siteName}</h1>
          <h2 style="color: #059669;">Payment Confirmed!</h2>
        </div>

        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0; font-size: 16px;">Dear ${data.customerName},</p>
          <p style="margin: 15px 0 0 0;">Thank you! Your payment has been confirmed and your order is now being processed.</p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Payment Details</h3>
          <p style="color: #374151; margin: 5px 0;"><strong>Order Number:</strong> #${data.orderNumber}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Amount Paid:</strong> BHD ${Number(data.total).toFixed(3)}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Payment Method:</strong> ${data.paymentMethod}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Status:</strong> Processing</p>
        </div>

        <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="color: #1e40af; margin: 0;">
            <strong>What's Next:</strong> We're now preparing your order for shipment. You'll receive a tracking notification once it's on its way.
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            Thank you for your business!<br>
            ${data.siteName}
          </p>
        </div>
      </div>
    `,
    text: `Payment Confirmed #${data.orderNumber}

Dear ${data.customerName},

Thank you! Your payment has been confirmed and your order is now being processed.

Payment Details:
- Order Number: #${data.orderNumber}
- Amount Paid: BHD ${Number(data.total).toFixed(3)}
- Payment Method: ${data.paymentMethod}
- Status: Processing

What's Next: We're now preparing your order for shipment. You'll receive a tracking notification once it's on its way.

Thank you for your business!
${data.siteName}`,
  }),
};