export const emailTemplates = {
  // Order submission confirmation
  orderSubmitted: (data: {
    customerName: string;
    orderNumber: string;
    total: number;
    siteName: string;
    items?: Array<{
      productName: string;
      quantity: number;
      price: string;
      totalPrice: string;
      rentalStartDate?: string;
      rentalEndDate?: string;
      rentalDays?: number;
    }>;
  }) => ({
    subject: `Order Submitted #${data.orderNumber} - ${data.siteName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">${data.siteName}</h1>
          <h2 style="color: #059669;">Order Submitted Successfully!</h2>
        </div>

        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0; font-size: 16px;">Dear ${data.customerName},</p>
          <p style="margin: 15px 0 0 0;">Your order has been submitted successfully and is now awaiting admin approval.</p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Order Details</h3>
          <p style="color: #374151; margin: 5px 0;"><strong>Order Number:</strong> #${data.orderNumber}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Total Amount:</strong> $${Number(data.total).toFixed(2)}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Status:</strong> Pending Admin Approval</p>
          
          ${data.items && data.items.length > 0 ? `
          <div style="margin-top: 20px;">
            <h4 style="color: #1f2937; margin-bottom: 10px;">Order Items:</h4>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background: #e5e7eb;">
                  <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Product</th>
                  <th style="padding: 8px; text-align: center; border: 1px solid #d1d5db;">Qty</th>
                  <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">Price</th>
                  <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">
                      ${item.productName}
                      ${item.rentalStartDate && item.rentalEndDate ? `
                        <br><small style="color: #6b7280;">Rental: ${item.rentalStartDate} to ${item.rentalEndDate} (${item.rentalDays} day${item.rentalDays !== 1 ? 's' : ''})</small>
                      ` : ''}
                    </td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #d1d5db;">${item.quantity}</td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">$${Number(item.price).toFixed(2)}</td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">$${Number(item.totalPrice).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; margin: 0;">
            <strong>What's Next:</strong> Our admin team will review your order shortly. You'll receive an email notification once it's approved and ready for payment.
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            Thank you for choosing us!<br>
            ${data.siteName}
          </p>
        </div>
      </div>
    `,
    text: `Order Submitted #${data.orderNumber}

Dear ${data.customerName},

Your order has been submitted successfully and is now awaiting admin approval.

Order Details:
- Order Number: #${data.orderNumber}
- Total Amount: $${Number(data.total).toFixed(2)}
- Status: Pending Admin Approval

What's Next: Our admin team will review your order shortly. You'll receive an email notification once it's approved and ready for payment.

Thank you for choosing us!
${data.siteName}`,
  }),

  // Order approved notification
  orderApproved: (data: {
    customerName: string;
    orderNumber: string;
    total: number;
    siteName: string;
    items?: Array<{
      productName: string;
      quantity: number;
      price: string;
      totalPrice: string;
      rentalStartDate?: string;
      rentalEndDate?: string;
      rentalDays?: number;
    }>;
  }) => ({
    subject: `Order Approved #${data.orderNumber} - ${data.siteName}`,
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
          <p style="color: #374151; margin: 5px 0;"><strong>Total Amount:</strong> $${Number(data.total).toFixed(2)}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Status:</strong> Approved - Ready for Payment</p>
          
          ${data.items && data.items.length > 0 ? `
          <div style="margin-top: 20px;">
            <h4 style="color: #1f2937; margin-bottom: 10px;">Order Items:</h4>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background: #e5e7eb;">
                  <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Product</th>
                  <th style="padding: 8px; text-align: center; border: 1px solid #d1d5db;">Qty</th>
                  <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">Price</th>
                  <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">
                      ${item.productName}
                      ${item.rentalStartDate && item.rentalEndDate ? `
                        <br><small style="color: #6b7280;">Rental: ${item.rentalStartDate} to ${item.rentalEndDate} (${item.rentalDays} day${item.rentalDays !== 1 ? 's' : ''})</small>
                      ` : ''}
                    </td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #d1d5db;">${item.quantity}</td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">$${Number(item.price).toFixed(2)}</td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">$${Number(item.totalPrice).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
        </div>

        <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="color: #1e40af; margin: 0;">
            <strong>Next Steps:</strong> Please proceed with payment to complete your order. You can pay using Credimax or choose Cash on Delivery.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #10b981; color: white; padding: 15px 25px; border-radius: 8px; display: inline-block; font-weight: 600;">
            ✓ Order Approved - Ready for Payment
          </div>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            Thank you for your business!<br>
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
- Total Amount: $${Number(data.total).toFixed(2)}
- Status: Approved - Ready for Payment

Next Steps: Please proceed with payment to complete your order. You can pay using Credimax or choose Cash on Delivery.

Thank you for your business!
${data.siteName}`,
  }),

  // Order rejected notification
  orderRejected: (data: {
    customerName: string;
    orderNumber: string;
    total: number;
    reason?: string;
    siteName: string;
    items?: Array<{
      productName: string;
      quantity: number;
      price: string;
      totalPrice: string;
      rentalStartDate?: string;
      rentalEndDate?: string;
      rentalDays?: number;
    }>;
  }) => ({
    subject: `Order Update Required #${data.orderNumber} - ${data.siteName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">${data.siteName}</h1>
          <h2 style="color: #dc2626;">Order Requires Attention</h2>
        </div>

        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0; font-size: 16px;">Dear ${data.customerName},</p>
          <p style="margin: 15px 0 0 0;">We need to discuss your recent order before we can proceed.</p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Order Details</h3>
          <p style="color: #374151; margin: 5px 0;"><strong>Order Number:</strong> #${data.orderNumber}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Total Amount:</strong> $${Number(data.total).toFixed(2)}</p>
          ${data.reason ? `<p style="color: #374151; margin: 5px 0;"><strong>Note:</strong> ${data.reason}</p>` : ''}
          
          ${data.items && data.items.length > 0 ? `
          <div style="margin-top: 20px;">
            <h4 style="color: #1f2937; margin-bottom: 10px;">Order Items:</h4>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background: #e5e7eb;">
                  <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Product</th>
                  <th style="padding: 8px; text-align: center; border: 1px solid #d1d5db;">Qty</th>
                  <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">Price</th>
                  <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">
                      ${item.productName}
                      ${item.rentalStartDate && item.rentalEndDate ? `
                        <br><small style="color: #6b7280;">Rental: ${item.rentalStartDate} to ${item.rentalEndDate} (${item.rentalDays} day${item.rentalDays !== 1 ? 's' : ''})</small>
                      ` : ''}
                    </td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #d1d5db;">${item.quantity}</td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">$${Number(item.price).toFixed(2)}</td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">$${Number(item.totalPrice).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
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
    text: `Order Update Required #${data.orderNumber}

Dear ${data.customerName},

We need to discuss your recent order before we can proceed.

Order Details:
- Order Number: #${data.orderNumber}
- Total Amount: $${Number(data.total).toFixed(2)}
${data.reason ? `- Note: ${data.reason}` : ''}

Next Steps: Please contact our support team to discuss your order and make any necessary adjustments.

We're here to help! Please don't hesitate to reach out with any questions.
${data.siteName}`,
  }),

  // Payment confirmation
  paymentConfirmation: (data: {
    customerName: string;
    orderNumber: string;
    total: number;
    paymentMethod: string;
    siteName: string;
    items?: Array<{
      productName: string;
      quantity: number;
      price: string;
      totalPrice: string;
      rentalStartDate?: string;
      rentalEndDate?: string;
      rentalDays?: number;
    }>;
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
          <p style="color: #374151; margin: 5px 0;"><strong>Amount Paid:</strong> $${Number(data.total).toFixed(2)}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Payment Method:</strong> ${data.paymentMethod}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Status:</strong> Processing</p>
          
          ${data.items && data.items.length > 0 ? `
          <div style="margin-top: 20px;">
            <h4 style="color: #1f2937; margin-bottom: 10px;">Order Items:</h4>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background: #e5e7eb;">
                  <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Product</th>
                  <th style="padding: 8px; text-align: center; border: 1px solid #d1d5db;">Qty</th>
                  <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">Price</th>
                  <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #d1d5db;">
                      ${item.productName}
                      ${item.rentalStartDate && item.rentalEndDate ? `
                        <br><small style="color: #6b7280;">Rental: ${item.rentalStartDate} to ${item.rentalEndDate} (${item.rentalDays} day${item.rentalDays !== 1 ? 's' : ''})</small>
                      ` : ''}
                    </td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #d1d5db;">${item.quantity}</td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">$${Number(item.price).toFixed(2)}</td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">$${Number(item.totalPrice).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
        </div>

        <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="color: #1e40af; margin: 0;">
            <strong>What's Next:</strong> We're now preparing your order for shipment. You'll receive a tracking notification once it's on its way.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #10b981; color: white; padding: 15px 25px; border-radius: 8px; display: inline-block; font-weight: 600;">
            ✓ Payment Confirmed
          </div>
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
- Amount Paid: $${Number(data.total).toFixed(2)}
- Payment Method: ${data.paymentMethod}
- Status: Processing

What's Next: We're now preparing your order for shipment. You'll receive a tracking notification once it's on its way.

Thank you for your business!
${data.siteName}`,
  }),

  // Admin order notification
  adminOrderNotification: (data: {
    customerName: string;
    customerEmail: string;
    orderNumber: string;
    total: number;
    itemCount: number;
    siteName: string;
  }) => ({
    subject: `New Order Requires Approval #${data.orderNumber} - ${data.siteName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">${data.siteName}</h1>
          <h2 style="color: #f59e0b;">New Order - Admin Approval Required</h2>
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-size: 16px;"><strong>Admin Notification</strong></p>
          <p style="margin: 15px 0 0 0;">A new order has been submitted and requires your approval.</p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Order Details</h3>
          <p style="color: #374151; margin: 5px 0;"><strong>Order Number:</strong> #${data.orderNumber}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Customer:</strong> ${data.customerName}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Email:</strong> ${data.customerEmail}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Total Amount:</strong> $${Number(data.total).toFixed(2)}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Items:</strong> ${data.itemCount} item(s)</p>
        </div>

        <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="color: #1e40af; margin: 0;">
            <strong>Action Required:</strong> Please review this order in the admin dashboard and approve or reject it.
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            ${data.siteName} Admin Panel
          </p>
        </div>
      </div>
    `,
    text: `New Order Requires Approval #${data.orderNumber}

Admin Notification: A new order has been submitted and requires your approval.

Order Details:
- Order Number: #${data.orderNumber}
- Customer: ${data.customerName}
- Email: ${data.customerEmail}
- Total Amount: $${Number(data.total).toFixed(2)}
- Items: ${data.itemCount} item(s)

Action Required: Please review this order in the admin dashboard and approve or reject it.

${data.siteName} Admin Panel`,
  }),

  // Test email template
  testEmail: (recipientEmail: string) => ({
    subject: 'SMTP Test Email - Configuration Successful',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">SMTP Test Email</h1>
          <h2 style="color: #059669;">Configuration Successful!</h2>
        </div>

        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0; font-size: 16px;">Congratulations!</p>
          <p style="margin: 15px 0 0 0;">Your SMTP email configuration is working correctly. This test email was sent to ${recipientEmail}.</p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Test Details</h3>
          <p style="color: #374151; margin: 5px 0;"><strong>Recipient:</strong> ${recipientEmail}</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Status:</strong> Email delivered successfully</p>
          <p style="color: #374151; margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #10b981; color: white; padding: 15px 25px; border-radius: 8px; display: inline-block; font-weight: 600;">
            ✓ SMTP Configuration Working
          </div>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            Your email system is ready to send order notifications!<br>
            BAYG - Bahrain Asian Youth Games 2025
          </p>
        </div>
      </div>
    `,
    text: `SMTP Test Email - Configuration Successful

Congratulations! Your SMTP email configuration is working correctly. This test email was sent to ${recipientEmail}.

Test Details:
- Recipient: ${recipientEmail}
- Status: Email delivered successfully
- Date: ${new Date().toLocaleString()}

Your email system is ready to send order notifications!
BAYG - Bahrain Asian Youth Games 2025`,
  }),
};