import { emailService } from "./email-service";
import { emailTemplates } from "./email-templates";
import { storage } from "./storage";

export interface OrderItem {
  productName: string;
  quantity: number;
  price: string;
  totalPrice: string;
  rentalStartDate?: string;
  rentalEndDate?: string;
  rentalDays?: number;
}

export interface OrderNotificationData {
  orderNumber: string;
  customerName: string;
  total: number;
  paymentMethod?: string;
  adminRemarks?: string;
  items?: OrderItem[];
  shippingAddress?: string;
}

export async function sendOrderSubmissionEmail(customerEmail: string, data: OrderNotificationData) {
  try {
    await emailService.initialize();
    if (!emailService.isReady()) {
      console.log('Email service not ready, skipping order submission notification');
      return;
    }

    const template = emailTemplates.orderSubmitted({
      customerName: data.customerName,
      orderNumber: data.orderNumber,
      total: data.total,
      siteName: "BAYG - Bahrain Asian Youth Games 2025",
      items: data.items
    });

    await emailService.sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    console.log(`Order submission email sent to: ${customerEmail}`);
  } catch (error) {
    console.error('Failed to send order submission email:', error);
  }
}

export async function sendOrderApprovalEmail(customerEmail: string, data: OrderNotificationData) {
  try {
    await emailService.initialize();
    if (!emailService.isReady()) {
      console.log('Email service not ready, skipping order approval notification');
      return;
    }

    const template = emailTemplates.orderApproved({
      customerName: data.customerName,
      orderNumber: data.orderNumber,
      total: data.total,
      siteName: "BAYG - Bahrain Asian Youth Games 2025",
      items: data.items
    });

    await emailService.sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    console.log(`Order approval email sent to: ${customerEmail}`);
  } catch (error) {
    console.error('Failed to send order approval email:', error);
  }
}

export async function sendOrderRejectionEmail(customerEmail: string, data: OrderNotificationData) {
  try {
    await emailService.initialize();
    if (!emailService.isReady()) {
      console.log('Email service not ready, skipping order rejection notification');
      return;
    }

    const template = emailTemplates.orderRejected({
      customerName: data.customerName,
      orderNumber: data.orderNumber,
      total: data.total,
      reason: data.adminRemarks || "No specific reason provided",
      siteName: "BAYG - Bahrain Asian Youth Games 2025",
      items: data.items
    });

    await emailService.sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    console.log(`Order rejection email sent to: ${customerEmail}`);
  } catch (error) {
    console.error('Failed to send order rejection email:', error);
  }
}

export async function sendPaymentConfirmationEmail(customerEmail: string, data: OrderNotificationData) {
  try {
    await emailService.initialize();
    if (!emailService.isReady()) {
      console.log('Email service not ready, skipping payment confirmation notification');
      return;
    }

    const template = emailTemplates.paymentConfirmation({
      customerName: data.customerName,
      orderNumber: data.orderNumber,
      total: data.total,
      paymentMethod: data.paymentMethod || "Cash on Delivery",
      siteName: "BAYG - Bahrain Asian Youth Games 2025",
      items: data.items
    });

    await emailService.sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    console.log(`Payment confirmation email sent to: ${customerEmail}`);
  } catch (error) {
    console.error('Failed to send payment confirmation email:', error);
  }
}

export async function sendAdminOrderNotification(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  shippingAddress: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: string;
  }>;
}) {
  try {
    await emailService.initialize();
    if (!emailService.isReady()) {
      console.log('Email service not ready, skipping admin notification');
      return;
    }

    // Get admin users
    const adminUsers = await storage.getAllUsers();
    const admins = adminUsers.filter(user => user.isAdmin && user.email);

    if (admins.length === 0) {
      console.log('No admin users with email addresses found');
      return;
    }

    const template = emailTemplates.adminOrderNotification({
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      orderNumber: data.orderNumber,
      total: data.total,
      itemCount: data.items.length,
      siteName: "BAYG - Bahrain Asian Youth Games 2025"
    });

    // Send to all admins
    for (const admin of admins) {
      await emailService.sendEmail({
        to: admin.email!,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
    }

    console.log(`Admin order notification sent to ${admins.length} admin(s)`);
  } catch (error) {
    console.error('Failed to send admin order notification:', error);
  }
}