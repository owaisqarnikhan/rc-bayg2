import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertProductSchema, insertCategorySchema, insertCartItemSchema, insertSiteSettingsSchema, insertUserSchema, insertSliderImageSchema, insertUnitOfMeasureSchema, roles, permissions } from "@shared/schema";
import { db } from "./db";
import { emailService } from "./email-service";
import { emailTemplates } from "./email-templates";
// import { sendOrderSubmittedNotification, sendOrderApprovedNotification, sendOrderRejectedNotification } from "./sendgrid";
import { exportDatabase, saveExportToFile, importDatabase, validateImportFile } from "./database-utils";
import { createCredimaxTransaction, verifyCredimaxTransaction, handleCredimaxWebhook } from "./credimax";
import { requirePermission } from "./middleware";
// Removed Stripe integration - only Credimax and Cash on Delivery supported
import multer from "multer";
import path from "path";
import fs from "fs";

// Stripe integration removed - using only Credimax and Cash on Delivery

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Image upload endpoint
  app.post("/api/upload-image", upload.single('image'), (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl, message: "Image uploaded successfully" });
  });

  // Credimax payment routes
  app.post("/api/credimax/create", async (req, res) => {
    await createCredimaxTransaction(req, res);
  });

  app.get("/api/credimax/verify/:transactionId", async (req, res) => {
    await verifyCredimaxTransaction(req, res);
  });

  app.post("/api/credimax/webhook", async (req, res) => {
    await handleCredimaxWebhook(req, res);
  });

  // Cash on Delivery route
  app.post("/api/cash-on-delivery", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { orderId, amount, shippingAddress } = req.body;
      
      if (!orderId || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get the order and verify it belongs to the user
      const order = await storage.getOrderById(orderId);
      if (!order || order.userId !== req.user!.id) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Verify the order is approved and can proceed to payment
      if (order.adminApprovalStatus !== "approved") {
        return res.status(400).json({ error: "Order is not approved for payment" });
      }

      // Update order with cash on delivery payment method
      const updatedOrder = await storage.updateOrder(orderId, {
        paymentMethod: "cash_on_delivery",
        status: "processing", // Update status to processing for COD
      });

      // Send order confirmation email
      try {
        const { sendPaymentConfirmationEmail } = await import("./order-approval-workflow");
        const user = await storage.getUserById(req.user!.id);
        if (user?.email) {
          const customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
          
          // Get order items for detailed email
          const orderItems = await storage.getOrderItemsByOrderId(orderId);
          const emailItems = orderItems.map(item => ({
            productName: item.product?.name || 'Unknown Product',
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.totalPrice,
            rentalStartDate: item.rentalStartDate ? new Date(item.rentalStartDate).toLocaleDateString() : undefined,
            rentalEndDate: item.rentalEndDate ? new Date(item.rentalEndDate).toLocaleDateString() : undefined,
            rentalDays: item.rentalDays || undefined
          }));
          
          await sendPaymentConfirmationEmail(user.email, {
            orderNumber: order.id.slice(-8).toUpperCase(),
            customerName: customerName,
            total: order.total,
            paymentMethod: "Cash on Delivery",
            items: emailItems
          });
        }
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
      }

      res.json({
        success: true,
        order: updatedOrder,
        message: "Cash on delivery order confirmed successfully",
      });
    } catch (error: any) {
      console.error('Cash on delivery error:', error);
      res.status(500).json({ error: "Failed to process cash on delivery" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/categories", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/category/:categoryId", async (req, res) => {
    try {
      const products = await storage.getProductsByCategory(req.params.categoryId);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      // Clean numeric fields to handle empty strings
      const cleanedBody = {
        ...req.body,
        price: req.body.price === "" ? "0" : req.body.price,
        rentalPrice: req.body.rentalPrice === "" ? undefined : req.body.rentalPrice,
      };
      
      const productData = insertProductSchema.parse(cleanedBody);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      // Clean numeric fields to handle empty strings
      const cleanedBody = {
        ...req.body,
        price: req.body.price === "" ? "0" : req.body.price,
        rentalPrice: req.body.rentalPrice === "" ? undefined : req.body.rentalPrice,
      };
      
      const product = await storage.updateProduct(req.params.id, cleanedBody);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      await storage.deleteProduct(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const cartItems = await storage.getCartItems(req.user!.id);
      res.json(cartItems);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { productId, quantity, rentalStartDate, rentalEndDate } = req.body;
      
      // Get product to calculate pricing
      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      let unitPrice: string;
      let totalPrice: string;
      let parsedStartDate: Date | null = null;
      let parsedEndDate: Date | null = null;

      // Calculate pricing based on product type
      if (product.productType === "rental" && rentalStartDate && rentalEndDate) {
        // Parse dates as date-only strings (YYYY-MM-DD) to avoid timezone issues
        const startDateParts = rentalStartDate.split('-');
        const endDateParts = rentalEndDate.split('-');
        
        if (startDateParts.length !== 3 || endDateParts.length !== 3) {
          return res.status(400).json({ 
            message: "Invalid date format. Please select valid dates." 
          });
        }
        
        const startYear = parseInt(startDateParts[0]);
        const startMonth = parseInt(startDateParts[1]);
        const startDay = parseInt(startDateParts[2]);
        
        const endYear = parseInt(endDateParts[0]);
        const endMonth = parseInt(endDateParts[1]);
        const endDay = parseInt(endDateParts[2]);
        
        // Create date objects in local timezone for storage
        parsedStartDate = new Date(startYear, startMonth - 1, startDay);
        parsedEndDate = new Date(endYear, endMonth - 1, endDay);
        
        // Check if dates are in 2025 and October (month 10)
        const isStartDateValid = startYear === 2025 && startMonth === 10 && startDay >= 18 && startDay <= 31;
        const isEndDateValid = endYear === 2025 && endMonth === 10 && endDay >= 18 && endDay <= 31;
        
        if (!isStartDateValid || !isEndDateValid) {
          return res.status(400).json({ 
            message: "Selected dates are outside the allowed rental period. Please choose dates between 18th October and 31st October 2025." 
          });
        }

        if (parsedStartDate > parsedEndDate) {
          return res.status(400).json({ 
            message: "End date must be after start date." 
          });
        }

        // Calculate rental days and pricing
        const rentalDays = Math.ceil((parsedEndDate.getTime() - parsedStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const dailyRate = parseFloat(product.rentalPrice || product.price);
        unitPrice = dailyRate.toFixed(2);
        totalPrice = (dailyRate * rentalDays * quantity).toFixed(2);
      } else {
        // For sale products, use regular pricing
        unitPrice = product.price;
        totalPrice = (parseFloat(product.price) * quantity).toFixed(2);
      }

      const cartItemData = {
        userId: req.user!.id,
        productId,
        quantity,
        rentalStartDate: parsedStartDate,
        rentalEndDate: parsedEndDate,
        unitPrice,
        totalPrice,
      };

      const cartItem = await storage.addToCart(cartItemData);
      res.status(201).json(cartItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/cart/:productId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(
        req.user!.id,
        req.params.productId,
        quantity
      );
      res.json(cartItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/cart/:productId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      await storage.removeFromCart(req.user!.id, req.params.productId);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });



  // Order routes
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      if (req.user!.isAdmin) {
        const orders = await storage.getOrders();
        res.json(orders);
      } else {
        const orders = await storage.getUserOrders(req.user!.id);
        res.json(orders);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const order = await storage.getOrderById(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can access this order
      if (!req.user!.isAdmin && order.userId !== req.user!.id) {
        return res.sendStatus(403);
      }

      res.json(order);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const { status } = req.body;
      const order = await storage.updateOrderStatus(req.params.id, status);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { customerInfo, paymentMethod, paymentIntentId } = req.body;
      
      // Get cart items
      const cartItems = await storage.getCartItems(req.user!.id);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Calculate totals with 10% VAT - use totalPrice from cart items if available, otherwise fallback to product price
      const subtotal = cartItems.reduce(
        (sum, item) => {
          // Use calculated totalPrice from cart if available (for rentals), otherwise use contextual price
          const itemTotal = item.totalPrice ? parseFloat(item.totalPrice) : (() => {
            const displayPrice = item.product.productType === "rental" && item.product.rentalPrice 
              ? item.product.rentalPrice 
              : item.product.price;
            return parseFloat(displayPrice) * item.quantity;
          })();
          return sum + itemTotal;
        },
        0
      );
      const vatPercentage = 10.00;
      const tax = subtotal * (vatPercentage / 100); // 10% VAT
      const total = subtotal + tax;

      // Create order with approval workflow - always starts as pending approval
      const order = await storage.createOrder({
        userId: req.user!.id,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),

        total: total.toFixed(2),
        vatPercentage: vatPercentage.toFixed(2),
        paymentMethod,
        paymentIntentId,
        status: "pending", // Order status starts as pending
        adminApprovalStatus: "pending", // Always requires admin approval
      });

      // Create order items and update stock
      for (const cartItem of cartItems) {
        // Calculate rental days if this is a rental item
        let rentalDays = null;
        if (cartItem.rentalStartDate && cartItem.rentalEndDate) {
          const startDate = new Date(cartItem.rentalStartDate);
          const endDate = new Date(cartItem.rentalEndDate);
          rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }

        await storage.createOrderItem({
          orderId: order.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          price: cartItem.unitPrice || (() => {
            const displayPrice = cartItem.product.productType === "rental" && cartItem.product.rentalPrice 
              ? cartItem.product.rentalPrice 
              : cartItem.product.price;
            return displayPrice;
          })(),
          totalPrice: cartItem.totalPrice || (() => {
            const displayPrice = cartItem.product.productType === "rental" && cartItem.product.rentalPrice 
              ? cartItem.product.rentalPrice 
              : cartItem.product.price;
            return (parseFloat(displayPrice) * cartItem.quantity).toFixed(2);
          })(),
          rentalStartDate: cartItem.rentalStartDate,
          rentalEndDate: cartItem.rentalEndDate,
          rentalDays: rentalDays,
        });
      }

      // Clear cart
      await storage.clearCart(req.user!.id);

      // Send email notifications asynchronously (don't block the response)
      setImmediate(async () => {
        try {
          const { sendAdminOrderNotification } = await import("./order-approval-workflow");
          const user = req.user!;
          const customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
          
          await sendAdminOrderNotification({
            orderNumber: order.id.slice(-8).toUpperCase(),
            customerName: customerName,
            customerEmail: user.email,
            total: parseFloat(order.total),
            shippingAddress: customerInfo?.address || "", // Add missing required field
            items: cartItems.map(item => ({
              productName: item.product.name,
              quantity: item.quantity,
              price: (() => {
                const displayPrice = item.product.productType === "rental" && item.product.rentalPrice 
                  ? item.product.rentalPrice 
                  : item.product.price;
                return (parseFloat(displayPrice) * item.quantity).toFixed(2);
              })()
            }))
          });
        } catch (emailError) {
          console.error('Failed to send admin notification:', emailError);
        }

        try {
          const { sendOrderSubmissionEmail } = await import("./order-approval-workflow");
          const customerName = `${req.user!.firstName || ''} ${req.user!.lastName || ''}`.trim() || req.user!.username;
          
          // Format order items for email
          const emailItems = cartItems.map(item => ({
            productName: item.product.name,
            quantity: item.quantity,
            price: item.unitPrice || (() => {
              const displayPrice = item.product.productType === "rental" && item.product.rentalPrice 
                ? item.product.rentalPrice 
                : item.product.price;
              return displayPrice;
            })(),
            totalPrice: item.totalPrice || (() => {
              const displayPrice = item.product.productType === "rental" && item.product.rentalPrice 
                ? item.product.rentalPrice 
                : item.product.price;
              return (parseFloat(displayPrice) * item.quantity).toFixed(2);
            })(),
            rentalStartDate: item.rentalStartDate ? new Date(item.rentalStartDate).toLocaleDateString() : undefined,
            rentalEndDate: item.rentalEndDate ? new Date(item.rentalEndDate).toLocaleDateString() : undefined,
            rentalDays: item.rentalStartDate && item.rentalEndDate ? 
              Math.ceil((new Date(item.rentalEndDate).getTime() - new Date(item.rentalStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : undefined
          }));
          
          await sendOrderSubmissionEmail(req.user!.email, {
            orderNumber: order.id.slice(-8).toUpperCase(),
            customerName: customerName,
            total: parseFloat(order.total),
            items: emailItems
          });
        } catch (emailError) {
          console.error('Failed to send order submission notification:', emailError);
        }
      });

      res.status(201).json({ 
        id: order.id,
        total: order.total,
        message: "Order submitted for admin approval. Admin has been notified and you will receive an email once approved." 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const { status } = req.body;
      const order = await storage.updateOrderStatus(req.params.id, status);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Order payment update route for users
  app.put("/api/orders/:id/payment", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { paymentMethod, paymentIntentId, status } = req.body;
      const orderId = req.params.id;
      
      // Get the order and verify it belongs to the user
      const order = await storage.getOrderById(orderId);
      if (!order || order.userId !== req.user!.id) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify the order is approved and can proceed to payment
      if (order.adminApprovalStatus !== "approved") {
        return res.status(400).json({ message: "Order is not approved for payment" });
      }

      // Update order with payment information
      const updatedOrder = await storage.updateOrder(orderId, {
        paymentMethod,
        paymentIntentId,
        status: status || "processing", // Update status to processing after payment
      });

      // Send payment completion email
      try {
        const { sendPaymentConfirmationEmail } = await import("./order-approval-workflow");
        const customerName = `${req.user!.firstName || ''} ${req.user!.lastName || ''}`.trim() || req.user!.username;
        
        if (req.user!.email) {
          // Get order items for detailed email
          const orderItems = await storage.getOrderItemsByOrderId(orderId);
          const emailItems = orderItems.map(item => ({
            productName: item.product?.name || 'Unknown Product',
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.totalPrice,
            rentalStartDate: item.rentalStartDate ? new Date(item.rentalStartDate).toLocaleDateString() : undefined,
            rentalEndDate: item.rentalEndDate ? new Date(item.rentalEndDate).toLocaleDateString() : undefined,
            rentalDays: item.rentalDays || undefined
          }));
          
          await sendPaymentConfirmationEmail(req.user!.email, {
            orderNumber: order.id.slice(-8).toUpperCase(),
            customerName: customerName,
            total: order.total,
            paymentMethod: paymentMethod,
            items: emailItems
          });
        }
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
      }

      res.json(updatedOrder);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get single order by ID route
  app.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const orderId = req.params.id;
      const order = await storage.getOrderWithItems(orderId);
      
      if (!order || order.userId !== req.user!.id) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Legacy SMTP test route - now handled by /api/admin/test-smtp

  // Admin approval requests route (accessible to managers and super admins)
  app.get("/api/admin/approval-requests", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    // Check if user has permission to view orders
    const { userHasPermission } = await import("./seed-comprehensive-permissions");
    const hasOrderViewPermission = await userHasPermission(req.user!.id, "orders.view");
    if (!req.user?.isAdmin && !hasOrderViewPermission) {
      return res.sendStatus(401);
    }

    try {
      const orders = await storage.getOrdersWithDetails();
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin order approval routes (accessible to managers and super admins)
  app.put("/api/admin/orders/:id/approve", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    // Check if user has permission to approve orders
    const { userHasPermission } = await import("./seed-comprehensive-permissions");
    const hasApprovePermission = await userHasPermission(req.user!.id, "orders.approve") || 
                                 await userHasPermission(req.user!.id, "orders.view");
    if (!req.user?.isAdmin && !hasApprovePermission) {
      return res.sendStatus(401);
    }

    try {
      const { adminRemarks } = req.body;
      const orderId = req.params.id;
      
      // Update order approval status
      await storage.updateOrder(orderId, {
        adminApprovalStatus: "approved",
        adminApprovedBy: req.user!.id,
        adminApprovedAt: new Date(),
        adminRemarks: adminRemarks || null,
        status: "payment_pending" // Move to payment pending after approval
      });

      // Get order details for email notification
      const order = await storage.getOrderById(orderId);
      const user = await storage.getUser(order!.userId);

      if (user && order) {
        const customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
        
        // Get order items for detailed email
        const orderItems = await storage.getOrderItemsByOrderId(orderId);
        const emailItems = orderItems.map(item => ({
          productName: item.product?.name || 'Unknown Product',
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.totalPrice,
          rentalStartDate: item.rentalStartDate ? new Date(item.rentalStartDate).toLocaleDateString() : undefined,
          rentalEndDate: item.rentalEndDate ? new Date(item.rentalEndDate).toLocaleDateString() : undefined,
          rentalDays: item.rentalDays || undefined
        }));
        
        // Send order approved email
        try {
          const { sendOrderApprovalEmail } = await import("./order-approval-workflow");
          if (user.email) {
            await sendOrderApprovalEmail(user.email, {
              orderNumber: order.id.slice(-8).toUpperCase(),
              customerName: customerName,
              total: order.total,
              items: emailItems
            });
          }
        } catch (emailError) {
          console.error('Failed to send order approved email:', emailError);
        }
      }

      res.json({ message: "Order approved successfully", orderId });
    } catch (error: any) {
      console.error('Error approving order:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/orders/:id/reject", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    // Check if user has permission to reject orders
    const { userHasPermission } = await import("./seed-comprehensive-permissions");
    const hasRejectPermission = await userHasPermission(req.user!.id, "orders.reject") || 
                               await userHasPermission(req.user!.id, "orders.view");
    if (!req.user?.isAdmin && !hasRejectPermission) {
      return res.sendStatus(401);
    }

    try {
      const { adminRemarks } = req.body;
      const orderId = req.params.id;
      
      // Update order approval status to rejected
      await storage.updateOrder(orderId, {
        adminApprovalStatus: "rejected",
        adminApprovedBy: req.user!.id,
        adminApprovedAt: new Date(),
        adminRemarks: adminRemarks || null,
        status: "cancelled" // Mark order as cancelled when rejected
      });

      // Get order details for email notification
      const order = await storage.getOrderById(orderId);
      const user = await storage.getUser(order!.userId);

      if (user && order) {
        const customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
        
        // Get order items for detailed email
        const orderItems = await storage.getOrderItemsByOrderId(orderId);
        const emailItems = orderItems.map(item => ({
          productName: item.product?.name || 'Unknown Product',
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.totalPrice,
          rentalStartDate: item.rentalStartDate ? new Date(item.rentalStartDate).toLocaleDateString() : undefined,
          rentalEndDate: item.rentalEndDate ? new Date(item.rentalEndDate).toLocaleDateString() : undefined,
          rentalDays: item.rentalDays || undefined
        }));
        
        // Send order rejected email
        try {
          const { sendOrderRejectionEmail } = await import("./order-approval-workflow");
          if (user.email) {
            await sendOrderRejectionEmail(user.email, {
              orderNumber: order.id.slice(-8).toUpperCase(),
              customerName: customerName,
              total: order.total,
              adminRemarks: adminRemarks || "No specific reason provided",
              items: emailItems
            });
          }
        } catch (emailError) {
          console.error('Failed to send order rejected email:', emailError);
        }
      }

      res.json({ message: "Order rejected successfully", orderId });
    } catch (error: any) {
      console.error('Error rejecting order:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/orders/:id/complete", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    // Check if user has permission to complete orders
    const { userHasPermission } = await import("./seed-comprehensive-permissions");
    const hasCompletePermission = await userHasPermission(req.user!.id, "orders.complete") || 
                                  await userHasPermission(req.user!.id, "orders.view");
    if (!req.user?.isAdmin && !hasCompletePermission) {
      return res.sendStatus(401);
    }

    try {
      const orderId = req.params.id;
      const deliveredAt = new Date();
      
      // Update order status to delivered
      await storage.updateOrder(orderId, {
        status: "delivered"
      });

      // Get order details for email
      const orderWithDetails = await storage.getOrderWithDetails(orderId);
      const user = await storage.getUserById(orderWithDetails.userId);

      // Send delivery confirmation email
      if (user && orderWithDetails) {
        try {
          await emailService.initialize();
          if (emailService.isReady() && user.email) {
            const template = emailTemplates.paymentConfirmation({
              customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
              orderNumber: orderWithDetails.id.slice(-8).toUpperCase(),
              total: orderWithDetails.total,
              paymentMethod: "Delivered",
              siteName: "BAYG - Bahrain Asian Youth Games 2025"
            });
            await emailService.sendEmail({
              to: user.email,
              subject: `Order Delivered #${orderWithDetails.id.slice(-8).toUpperCase()} - BAYG`,
              html: template.html,
              text: template.text
            });
          }
        } catch (emailError) {
          console.error('Failed to send delivery confirmation email:', emailError);
        }
      }

      res.json({ success: true, message: "Order marked as delivered" });
    } catch (error: any) {
      console.error('Order completion error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Email testing and SMTP routes
  app.post("/api/admin/test-smtp", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const { testEmail } = req.body;
      const targetEmail = testEmail || req.user.email;
      
      // Check if SMTP is configured first
      const settings = await storage.getSiteSettings();
      if (!settings?.smtpEnabled || !settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPassword) {
        return res.status(400).json({
          success: false,
          message: "SMTP not configured. Please configure SMTP settings first."
        });
      }
      
      console.log(`Testing SMTP with email: ${targetEmail}`);
      
      // Force reinitialize the email service  
      await emailService.initialize();
      
      if (!emailService.isReady()) {
        return res.status(400).json({
          success: false,
          message: "SMTP configuration failed. Please check your settings and try again."
        });
      }

      const result = await emailService.sendTestEmail(targetEmail);
      
      res.json({
        success: true,
        message: `Test email sent successfully to ${targetEmail}! Check your inbox to confirm SMTP is working.`,
        messageId: result.messageId
      });
    } catch (error: any) {
      console.error('SMTP test error:', error);
      
      let errorMessage = "SMTP test failed. Please check your configuration.";
      
      // Provide specific error messages for common issues
      if (error.message.includes("Authentication failed")) {
        errorMessage = "Authentication failed. Please check your username and password. For Gmail/Yahoo, use an App Password.";
      } else if (error.message.includes("ENOTFOUND")) {
        errorMessage = "Cannot connect to SMTP server. Please check your host and port settings.";
      } else if (error.message.includes("ECONNREFUSED")) {
        errorMessage = "Connection refused. Please check your port number and try again.";
      } else if (error.message.includes("wrong version number")) {
        errorMessage = "SSL/TLS configuration error. For port 587, turn OFF SSL/TLS. For port 465, turn ON SSL/TLS.";
      } else if (error.message.includes("EAUTH")) {
        errorMessage = "Authentication error. Enable 2FA and use App Password for Gmail/Yahoo, or enable 'Less secure app access'.";
      }
      
      res.status(400).json({
        success: false,
        message: errorMessage
      });
    }
  });

  app.post("/api/admin/smtp-status", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const settings = await storage.getSiteSettings();
      const isConfigured = settings?.smtpEnabled && settings?.smtpHost && settings?.smtpUser && settings?.smtpPassword;
      
      res.json({
        configured: !!isConfigured,
        enabled: settings?.smtpEnabled || false,
        host: settings?.smtpHost || '',
        port: settings?.smtpPort || 587,
        secure: settings?.smtpSecure || false,
        fromName: settings?.smtpFromName || '',
        fromEmail: settings?.smtpFromEmail || ''
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Site settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/settings", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const settingsData = insertSiteSettingsSchema.parse(req.body);
      const updated = await storage.updateSiteSettings(settingsData);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/categories", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, categoryData);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      await storage.deleteCategory(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Units of measure routes
  app.get("/api/units-of-measure", async (req, res) => {
    try {
      const units = await storage.getActiveUnitsOfMeasure();
      res.json(units);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/units-of-measure", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const units = await storage.getUnitsOfMeasure();
      res.json(units);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/units-of-measure", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const unitData = insertUnitOfMeasureSchema.parse(req.body);
      const unit = await storage.createUnitOfMeasure(unitData);
      res.status(201).json(unit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/units-of-measure/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const unit = await storage.updateUnitOfMeasure(req.params.id, req.body);
      res.json(unit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/units-of-measure/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      await storage.deleteUnitOfMeasure(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin user management routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Hash password if provided
      if (userData.password) {
        const { hashPassword } = await import("./auth");
        userData.password = await hashPassword(userData.password);
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const userData = insertUserSchema.partial().parse(req.body);
      
      // Hash password if provided
      if (userData.password && userData.password.trim() !== "") {
        const { hashPassword } = await import("./auth");
        userData.password = await hashPassword(userData.password);
      } else if (userData.password === "") {
        // Remove password from update if empty string
        delete userData.password;
      }
      
      const user = await storage.updateUser(req.params.id, userData);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      await storage.deleteUser(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin orders management
  app.get("/api/admin/orders", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const orders = await storage.getOrdersWithDetails();
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Statistics for admin dashboard
  app.get("/api/admin/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      // Check if user has permission to view statistics
      const { userHasPermission } = await import("./seed-comprehensive-permissions");
      const hasStatsPermission = await userHasPermission(req.user!.id, "reports.view") || req.user?.isAdmin || req.user?.isSuperAdmin;
      
      if (!hasStatsPermission) {
        return res.sendStatus(401);
      }

      const [orders, products, users] = await Promise.all([
        storage.getOrdersWithDetails(),
        storage.getProducts(),
        storage.getAllUsers()
      ]);

      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      
      // Basic stats for all admin users
      const stats: any = {
        revenue: totalRevenue.toFixed(2),
        orders: orders.length,
        products: products.length,
        users: users.length,
      };

      // Additional stats for Super Admin
      if (req.user?.isSuperAdmin) {
        const pendingOrders = orders.filter(order => order.status === 'pending').length;
        const activeUsers = users.filter(user => {
          // Consider users active if they have any orders in the last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return user.createdAt && new Date(user.createdAt) > thirtyDaysAgo;
        }).length;

        // Get total roles and permissions from database
        const [rolesResult, permissionsResult] = await Promise.all([
          db.select().from(roles),
          db.select().from(permissions)
        ]);

        stats.pendingOrders = pendingOrders;
        stats.activeUsers = activeUsers;
        stats.totalRoles = rolesResult.length;
        stats.totalPermissions = permissionsResult.length;
      }

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Slider images routes
  app.get("/api/slider-images", async (req, res) => {
    try {
      const images = await storage.getSliderImages();
      res.json(images);
    } catch (error: any) {
      console.error("Error getting slider images:", error);
      res.status(500).json({ message: "Failed to get slider images" });
    }
  });

  app.get("/api/slider-images/active", async (req, res) => {
    try {
      const images = await storage.getActiveSliderImages();
      res.json(images);
    } catch (error: any) {
      console.error("Error getting active slider images:", error);
      res.status(500).json({ message: "Failed to get active slider images" });
    }
  });

  app.post("/api/slider-images", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const validation = insertSliderImageSchema.parse(req.body);
      const image = await storage.createSliderImage(validation);
      res.json(image);
    } catch (error: any) {
      console.error("Error creating slider image:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/slider-images/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const { id } = req.params;
      const image = await storage.updateSliderImage(id, req.body);
      res.json(image);
    } catch (error: any) {
      console.error("Error updating slider image:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/slider-images/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const { id } = req.params;
      await storage.deleteSliderImage(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting slider image:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Database export/import routes
  app.get("/api/admin/database/export", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const exportData = await exportDatabase();
      const filename = await saveExportToFile(exportData);
      
      res.json({ 
        success: true, 
        filename,
        downloadUrl: `/uploads/${filename}`,
        message: "Database exported successfully" 
      });
    } catch (error) {
      console.error('Database export error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to export database" 
      });
    }
  });

  // Configure multer for database import
  const importUpload = multer({ 
    storage: storage_config,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for database files
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/sql' || path.extname(file.originalname).toLowerCase() === '.sql') {
        return cb(null, true);
      } else {
        cb(new Error('Only SQL files are allowed for database import'));
      }
    }
  });

  app.post("/api/admin/database/import", importUpload.single('database'), async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No database file uploaded" 
      });
    }

    try {
      const sqlContent = await validateImportFile(req.file.path);
      await importDatabase(sqlContent);
      
      // Clean up uploaded file
      await fs.promises.unlink(req.file.path);
      
      res.json({ 
        success: true, 
        message: "Database imported successfully" 
      });
    } catch (error) {
      console.error('Database import error:', error);
      
      // Clean up uploaded file on error
      if (req.file) {
        try {
          await fs.promises.unlink(req.file.path);
        } catch (cleanupError) {
          console.error('Failed to cleanup upload file:', cleanupError);
        }
      }
      
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to import database" 
      });
    }
  });

  // Excel import/export routes
  app.get("/api/admin/export/excel/bulk", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    try {
      const { exportDataToExcel } = await import('./excelUtils');
      const excelBuffer = await exportDataToExcel();
      
      const filename = `data-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(excelBuffer);
    } catch (error) {
      console.error('Excel export error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to export Excel file" 
      });
    }
  });

  // Individual sheet export routes
  app.get("/api/admin/export/excel/:sheetType", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    const { sheetType } = req.params;
    
    try {
      let excelBuffer: Buffer;
      let filename: string;
      
      switch (sheetType) {
        case 'products':
          const { exportProductsToExcel } = await import('./excelUtils');
          excelBuffer = await exportProductsToExcel();
          filename = `products-export-${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'categories':
          const { exportCategoriesToExcel } = await import('./excelUtils');
          excelBuffer = await exportCategoriesToExcel();
          filename = `categories-export-${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'users':
          const { exportUsersToExcel } = await import('./excelUtils');
          excelBuffer = await exportUsersToExcel();
          filename = `users-export-${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'orders':
          const { exportOrdersToExcel } = await import('./excelUtils');
          excelBuffer = await exportOrdersToExcel();
          filename = `orders-export-${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'order-items':
          const { exportOrderItemsToExcel } = await import('./excelUtils');
          excelBuffer = await exportOrderItemsToExcel();
          filename = `order-items-export-${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'units':
          const { exportUnitsToExcel } = await import('./excelUtils');
          excelBuffer = await exportUnitsToExcel();
          filename = `units-export-${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'site-settings':
          const { exportSiteSettingsToExcel } = await import('./excelUtils');
          excelBuffer = await exportSiteSettingsToExcel();
          filename = `site-settings-export-${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'slider-images':
          const { exportSliderImagesToExcel } = await import('./excelUtils');
          excelBuffer = await exportSliderImagesToExcel();
          filename = `slider-images-export-${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        default:
          return res.status(400).json({ 
            success: false, 
            message: "Invalid sheet type" 
          });
      }
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(excelBuffer);
    } catch (error) {
      console.error('Excel export error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to export Excel file" 
      });
    }
  });

  // Configure multer for Excel import
  const excelUpload = multer({ 
    storage: storage_config,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for Excel files
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      const allowedExtensions = ['.xlsx', '.xls'];
      
      if (allowedMimeTypes.includes(file.mimetype) || 
          allowedExtensions.includes(path.extname(file.originalname).toLowerCase())) {
        return cb(null, true);
      } else {
        cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
      }
    }
  });

  app.post("/api/admin/import/excel", excelUpload.single('excel'), async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No Excel file uploaded" 
      });
    }

    try {
      const { parseExcelFile } = await import('./excelUtils');
      const fileBuffer = await fs.promises.readFile(req.file.path);
      const parsedData = parseExcelFile(fileBuffer);
      
      // Import data in order: foundational data first, then dependent data
      let importCounts = {
        categories: 0,
        products: 0,
        users: 0,
        orders: 0,
        orderItems: 0,
        unitsOfMeasure: 0,
        sliderImages: 0,
        siteSettings: 0
      };

      if (parsedData.categories.length > 0) {
        await storage.importCategories(parsedData.categories);
        importCounts.categories = parsedData.categories.length;
      }
      
      if (parsedData.unitsOfMeasure.length > 0) {
        await storage.importUnitsOfMeasure(parsedData.unitsOfMeasure);
        importCounts.unitsOfMeasure = parsedData.unitsOfMeasure.length;
      }
      
      if (parsedData.products.length > 0) {
        await storage.importProducts(parsedData.products);
        importCounts.products = parsedData.products.length;
      }
      
      if (parsedData.users.length > 0) {
        await storage.importUsers(parsedData.users);
        importCounts.users = parsedData.users.length;
      }

      if (parsedData.orders.length > 0) {
        await storage.importOrders(parsedData.orders);
        importCounts.orders = parsedData.orders.length;
      }

      if (parsedData.orderItems.length > 0) {
        await storage.importOrderItems(parsedData.orderItems);
        importCounts.orderItems = parsedData.orderItems.length;
      }

      if (parsedData.sliderImages.length > 0) {
        await storage.importSliderImages(parsedData.sliderImages);
        importCounts.sliderImages = parsedData.sliderImages.length;
      }

      if (parsedData.siteSettings.length > 0) {
        await storage.importSiteSettings(parsedData.siteSettings);
        importCounts.siteSettings = parsedData.siteSettings.length;
      }
      
      // Clean up uploaded file
      await fs.promises.unlink(req.file.path);
      
      const totalImported = Object.values(importCounts).reduce((sum, count) => sum + count, 0);
      
      res.json({ 
        success: true, 
        message: `Successfully imported ${totalImported} total records: ${importCounts.categories} categories, ${importCounts.products} products, ${importCounts.users} users, ${importCounts.orders} orders, ${importCounts.orderItems} order items, ${importCounts.unitsOfMeasure} units of measure, ${importCounts.sliderImages} slider images, and ${importCounts.siteSettings} site settings`,
        imported: importCounts
      });
    } catch (error) {
      console.error('Excel import error:', error);
      
      // Clean up uploaded file on error
      if (req.file) {
        try {
          await fs.promises.unlink(req.file.path);
        } catch (cleanupError) {
          console.error('Failed to cleanup upload file:', cleanupError);
        }
      }
      
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to import Excel file" 
      });
    }
  });

  // Individual sheet import routes  
  app.post("/api/admin/import/excel/:sheetType", excelUpload.single('excel'), async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(401);
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No Excel file uploaded" 
      });
    }

    const { sheetType } = req.params;

    try {
      const { parseExcelFile } = await import('./excelUtils');
      const fileBuffer = await fs.promises.readFile(req.file.path);
      const parsedData = parseExcelFile(fileBuffer);
      
      let importCount = 0;
      let successMessage = "";

      switch (sheetType) {
        case 'products':
          if (parsedData.products.length > 0) {
            await storage.importProducts(parsedData.products);
            importCount = parsedData.products.length;
            successMessage = `Successfully imported ${importCount} products`;
          }
          break;
        case 'categories':
          if (parsedData.categories.length > 0) {
            await storage.importCategories(parsedData.categories);
            importCount = parsedData.categories.length;
            successMessage = `Successfully imported ${importCount} categories`;
          }
          break;
        case 'users':
          if (parsedData.users.length > 0) {
            await storage.importUsers(parsedData.users);
            importCount = parsedData.users.length;
            successMessage = `Successfully imported ${importCount} users`;
          }
          break;
        case 'orders':
          if (parsedData.orders.length > 0) {
            await storage.importOrders(parsedData.orders);
            importCount = parsedData.orders.length;
            successMessage = `Successfully imported ${importCount} orders`;
          }
          break;
        case 'order-items':
          if (parsedData.orderItems.length > 0) {
            await storage.importOrderItems(parsedData.orderItems);
            importCount = parsedData.orderItems.length;
            successMessage = `Successfully imported ${importCount} order items`;
          }
          break;
        case 'units':
          if (parsedData.unitsOfMeasure.length > 0) {
            await storage.importUnitsOfMeasure(parsedData.unitsOfMeasure);
            importCount = parsedData.unitsOfMeasure.length;
            successMessage = `Successfully imported ${importCount} units of measure`;
          }
          break;
        case 'site-settings':
          if (parsedData.siteSettings.length > 0) {
            await storage.importSiteSettings(parsedData.siteSettings);
            importCount = parsedData.siteSettings.length;
            successMessage = `Successfully imported ${importCount} site settings`;
          }
          break;
        case 'slider-images':
          if (parsedData.sliderImages.length > 0) {
            await storage.importSliderImages(parsedData.sliderImages);
            importCount = parsedData.sliderImages.length;
            successMessage = `Successfully imported ${importCount} slider images`;
          }
          break;
        default:
          await fs.promises.unlink(req.file.path);
          return res.status(400).json({ 
            success: false, 
            message: "Invalid sheet type" 
          });
      }
      
      // Clean up uploaded file
      await fs.promises.unlink(req.file.path);
      
      res.json({ 
        success: true, 
        message: successMessage,
        imported: importCount
      });
    } catch (error) {
      console.error(`Excel import error (${sheetType}):`, error);
      
      // Clean up uploaded file on error
      if (req.file) {
        try {
          await fs.promises.unlink(req.file.path);
        } catch (cleanupError) {
          console.error('Failed to cleanup upload file:', cleanupError);
        }
      }
      
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : `Failed to import ${sheetType} Excel file` 
      });
    }
  });

  // Permission Management Routes (Super Admin only)
  app.get("/api/admin/roles", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isSuperAdmin) {
      return res.status(401).json({ message: "Super Admin access required" });
    }
    
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.get("/api/admin/permission-modules", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isSuperAdmin) {
      return res.status(401).json({ message: "Super Admin access required" });
    }
    
    try {
      const modules = await storage.getAllPermissionModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching permission modules:", error);
      res.status(500).json({ message: "Failed to fetch permission modules" });
    }
  });

  app.get("/api/admin/permissions/:moduleId", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isSuperAdmin) {
      return res.status(401).json({ message: "Super Admin access required" });
    }
    
    try {
      const { moduleId } = req.params;
      const permissions = await storage.getPermissionsByModule(moduleId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.get("/api/admin/role-permissions/:roleId", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isSuperAdmin) {
      return res.status(401).json({ message: "Super Admin access required" });
    }
    
    try {
      const { roleId } = req.params;
      const permissions = await storage.getRolePermissions(roleId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });

  app.post("/api/admin/assign-permissions", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isSuperAdmin) {
      return res.status(401).json({ message: "Super Admin access required" });
    }
    
    try {
      const { roleId, permissionIds } = req.body;
      await storage.assignPermissionsToRole(roleId, permissionIds);
      res.json({ message: "Permissions assigned successfully" });
    } catch (error) {
      console.error("Error assigning permissions:", error);
      res.status(500).json({ message: "Failed to assign permissions" });
    }
  });

  app.post("/api/admin/assign-role", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isSuperAdmin) {
      return res.status(401).json({ message: "Super Admin access required" });
    }
    
    try {
      const { userId, roleId } = req.body;
      await storage.assignRoleToUser(userId, roleId);
      res.json({ message: "Role assigned successfully" });
    } catch (error) {
      console.error("Error assigning role:", error);
      res.status(500).json({ message: "Failed to assign role" });
    }
  });

  // Super Admin permission assignment endpoint
  app.post("/api/admin/assign-permissions", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isSuperAdmin) {
      return res.status(401).json({ message: "Super Admin access required" });
    }
    
    try {
      const { roleId, permissionIds } = req.body;
      await storage.assignPermissionsToRole(roleId, permissionIds);
      res.json({ message: "Permissions assigned successfully" });
    } catch (error) {
      console.error("Error assigning permissions:", error);
      res.status(500).json({ message: "Failed to assign permissions" });
    }
  });

  app.get("/api/user/permissions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { getUserPermissions } = await import("./seed-permissions");
      const permissions = await getUserPermissions(req.user.id);
      res.json({ permissions });
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ message: "Failed to fetch user permissions" });
    }
  });

  // Update user profile
  app.patch("/api/user/profile", requirePermission("users.profile"), async (req, res) => {
    try {
      const userId = req.user!.id;
      const { firstName, lastName, email } = req.body;
      
      const updatedUser = await storage.updateUserProfile(userId, {
        firstName,
        lastName, 
        email
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Role and Permission Management Routes (Super Admin Only)
  app.get("/api/admin/roles", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isSuperAdmin) {
      return res.status(401).json({ message: "Super Admin access required" });
    }
    
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: error.message || "Failed to fetch roles" });
    }
  });

  app.get("/api/admin/permission-modules", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isSuperAdmin) {
      return res.status(401).json({ message: "Super Admin access required" });
    }
    
    try {
      const modules = await storage.getAllPermissionModules();
      res.json(modules);
    } catch (error: any) {
      console.error("Error fetching permission modules:", error);
      res.status(500).json({ message: error.message || "Failed to fetch permission modules" });
    }
  });

  app.get("/api/admin/permissions/:moduleId", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isSuperAdmin) {
      return res.status(401).json({ message: "Super Admin access required" });
    }
    
    try {
      const permissions = await storage.getPermissionsByModule(req.params.moduleId);
      res.json(permissions);
    } catch (error: any) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: error.message || "Failed to fetch permissions" });
    }
  });

  app.get("/api/admin/role-permissions/:roleId", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isSuperAdmin) {
      return res.status(401).json({ message: "Super Admin access required" });
    }
    
    try {
      const permissions = await storage.getRolePermissions(req.params.roleId);
      res.json(permissions);
    } catch (error: any) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ message: error.message || "Failed to fetch role permissions" });
    }
  });

  app.post("/api/admin/assign-permissions", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isSuperAdmin) {
      return res.status(401).json({ message: "Super Admin access required" });
    }
    
    try {
      const { roleId, permissionIds } = req.body;
      
      if (!roleId || !Array.isArray(permissionIds)) {
        return res.status(400).json({ message: "Role ID and permission IDs array are required" });
      }

      await storage.assignPermissionsToRole(roleId, permissionIds);
      res.json({ message: "Permissions assigned successfully" });
    } catch (error: any) {
      console.error("Error assigning permissions:", error);
      res.status(500).json({ message: error.message || "Failed to assign permissions" });
    }
  });

  app.post("/api/admin/assign-role", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isSuperAdmin) {
      return res.status(401).json({ message: "Super Admin access required" });
    }
    
    try {
      const { userId, roleId } = req.body;
      
      if (!userId || !roleId) {
        return res.status(400).json({ message: "User ID and Role ID are required" });
      }

      await storage.assignRoleToUser(userId, roleId);
      res.json({ message: "Role assigned successfully" });
    } catch (error: any) {
      console.error("Error assigning role:", error);
      res.status(500).json({ message: error.message || "Failed to assign role" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
