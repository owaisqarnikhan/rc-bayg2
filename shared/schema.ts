import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").default(""),
  lastName: text("last_name").default(""),
  isAdmin: boolean("is_admin").default(false),
  isSuperAdmin: boolean("is_super_admin").default(false),
  roleId: varchar("role_id"),
  // Stripe integration removed - using only Credimax and Cash on Delivery
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Roles table
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  isSystemRole: boolean("is_system_role").default(false), // For super admin role
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Permission modules
export const permissionModules = pgTable("permission_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  icon: varchar("icon").default("Shield"), // Lucide icon name
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Permissions within modules
export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").references(() => permissionModules.id).notNull(),
  name: varchar("name").notNull(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  action: varchar("action").notNull(), // create, read, update, delete, manage
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Role permissions mapping
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").references(() => roles.id).notNull(),
  permissionId: varchar("permission_id").references(() => permissions.id).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(""),
  imageUrl: text("image_url").default(""),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const unitsOfMeasure = pgTable("units_of_measure", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  abbreviation: text("abbreviation").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(""),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").default(""),
  categoryId: varchar("category_id").references(() => categories.id),

  sku: text("sku").unique().default(""),
  unitOfMeasure: text("unit_of_measure").default("piece"), // piece, kg, liter, meter, box, pack, etc.
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").default(0),
  productType: text("product_type").notNull().default("sale"), // sale, rental
  rentalPeriod: text("rental_period"), // daily, weekly, monthly (for rental products)
  rentalPrice: decimal("rental_price", { precision: 10, scale: 2 }), // price per rental period
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  // Rental-specific fields
  rentalStartDate: timestamp("rental_start_date"), // For rental products
  rentalEndDate: timestamp("rental_end_date"), // For rental products
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }), // Calculated price per unit (daily rate for rentals)
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }), // Total calculated price for this cart item
  createdAt: timestamp("created_at").default(sql`now()`),
});



export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("pending"), // pending, awaiting_approval, approved, rejected, payment_pending, processing, shipped, delivered, cancelled
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0.00"), // This will be the VAT amount (10%)

  vatPercentage: decimal("vat_percentage", { precision: 5, scale: 2 }).notNull().default("10.00"), // VAT percentage
  adminApprovalStatus: text("admin_approval_status").notNull().default("pending"), // pending, approved, rejected
  adminApprovedBy: varchar("admin_approved_by").references(() => users.id),
  adminApprovedAt: timestamp("admin_approved_at"),
  adminRemarks: text("admin_remarks"), // Admin can add notes for approval/rejection

  paymentMethod: text("payment_method"), // credimax, cash_on_delivery
  paymentIntentId: text("payment_intent_id"),

  createdAt: timestamp("created_at").default(sql`now()`),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Unit price
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(), // Total price for this line item
  // Rental-specific fields
  rentalStartDate: timestamp("rental_start_date"), // For rental products
  rentalEndDate: timestamp("rental_end_date"), // For rental products
  rentalDays: integer("rental_days"), // Number of rental days
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  cartItems: many(cartItems),
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const unitsOfMeasureRelations = relations(unitsOfMeasure, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  unitOfMeasure: one(unitsOfMeasure, {
    fields: [products.unitOfMeasure],
    references: [unitsOfMeasure.name],
  }),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));



export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  // Stripe fields omitted - using only Credimax and Cash on Delivery
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertUnitOfMeasureSchema = createInsertSchema(unitsOfMeasure).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});



export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

// Relations for new permission system
export const usersRelations2 = relations(users, ({ one }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions),
}));

export const permissionModulesRelations = relations(permissionModules, ({ many }) => ({
  permissions: many(permissions),
}));

export const permissionsRelations = relations(permissions, ({ one, many }) => ({
  module: one(permissionModules, {
    fields: [permissions.moduleId],
    references: [permissionModules.id],
  }),
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

// Insert schemas for new tables
export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPermissionModuleSchema = createInsertSchema(permissionModules).omit({
  id: true,
  createdAt: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type UnitOfMeasure = typeof unitsOfMeasure.$inferSelect;
export type InsertUnitOfMeasure = z.infer<typeof insertUnitOfMeasureSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type PermissionModule = typeof permissionModules.$inferSelect;
export type InsertPermissionModule = z.infer<typeof insertPermissionModuleSchema>;
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;


export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default("default"),
  siteName: text("site_name").notNull().default("BAYG"),
  browserTabTitle: text("browser_tab_title").notNull().default("BAYG"),
  headerLogo: text("header_logo"),
  footerLogo: text("footer_logo"),
  logoUrl: text("logo_url"), // Main site logo
  faviconUrl: text("favicon_url"), // Site favicon
  theme: text("theme").default("default"), // default, ocean, forest, sunset, midnight, coral, violet, emerald, ruby, sapphire, rose, bronze, slate, mint, lavender
  textColor: text("text_color").default("#1e293b"),
  headerTextColor: text("header_text_color").default("#64748b"),
  tabTextColor: text("tab_text_color").default("#2563eb"),
  tabActiveTextColor: text("tab_active_text_color").default("#2563eb"),

  footerDescription: text("footer_description"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  contactAddress: text("contact_address"),
  supportEmail: text("support_email"),
  adminEmail: text("admin_email").default("admin@innovanceorbit.com"), // Admin notifications
  businessHours: text("business_hours"),
  officeHoursTitle: text("office_hours_title").default("Office Hours"),
  paymentMethodsImage: text("payment_methods_image"),
  footerLeftImage: text("footer_left_image"),
  footerLeftImageWidth: integer("footer_left_image_width").default(200),
  paymentMethodsImageWidth: integer("payment_methods_image_width").default(250),
  loginPageLogoWidth: integer("login_page_logo_width").default(80),
  headerLogoHeight: integer("header_logo_height").default(64), // Height in pixels for header logo
  loginPageHeading1: text("login_page_heading_1").default("Welcome Back"),
  loginPageHeading2: text("login_page_heading_2").default("Sign in to your account"),
  loginPageHeading3: text("login_page_heading_3").default("Access your dashboard"),
  socialFacebook: text("social_facebook"),
  socialTwitter: text("social_twitter"),
  socialInstagram: text("social_instagram"),
  socialLinkedin: text("social_linkedin"),
  copyrightText: text("copyright_text"),
  additionalFooterText: text("additional_footer_text"),
  footerBackgroundUrl: text("footer_background_url").default("/uploads/footer-background.png"),
  quickLinksTitle: text("quick_links_title").default("Quick Links"),
  quickLinkHome: text("quick_link_home").default("Home"),
  quickLinkProducts: text("quick_link_products").default("Products"),
  quickLinkAbout: text("quick_link_about").default("About"),
  quickLinkContact: text("quick_link_contact").default("Contact"),
  servicesTitle: text("services_title").default("Services"),
  serviceLink1: text("service_link_1").default("Customer Support"),
  serviceLink2: text("service_link_2").default("Shipping Info"),
  serviceLink3: text("service_link_3").default("Returns"),
  serviceLink4: text("service_link_4").default("FAQ"),
  socialTitle: text("social_title").default("Follow Us"),
  // Email templates and SMTP Configuration
  orderConfirmationTemplate: text("order_confirmation_template").default(`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Order Confirmation - {{orderNumber}}</h2>
      <p>Dear {{customerName}},</p>
      <p>Thank you for your order! We've received your order and it's being processed.</p>
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Details:</h3>
        <p><strong>Order Number:</strong> {{orderNumber}}</p>
        <p><strong>Order Date:</strong> {{orderDate}}</p>
        <p><strong>Total Amount:</strong> {{totalAmount}}</p>
        <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
      </div>
      <h3>Items Ordered:</h3>
      {{orderItems}}
      <p>We'll send you another email when your order ships.</p>
      <p>Best regards,<br>{{siteName}} Team</p>
    </div>
  `),
  // SMTP Email Configuration
  smtpEnabled: boolean("smtp_enabled").default(false),
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port").default(587),
  smtpSecure: boolean("smtp_secure").default(false),
  smtpUser: text("smtp_user"),
  smtpPassword: text("smtp_password"),
  smtpFromName: text("smtp_from_name").default("BAYG - Bahrain Asian Youth Games 2025"),
  smtpFromEmail: text("smtp_from_email"),
  
  // Login Page Specific Settings
  loginPageLogo: text("login_page_logo"),
  loginPageTitle: text("login_page_title").default("InnovanceOrbit Store"),
  loginPageAccessMessage: text("login_page_access_message").default("Need an account? Contact your store administrator for access credentials."),
  
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const sliderImages = pgTable("slider_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").default(""),
  description: text("description").default(""),
  imageUrl: text("image_url").notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSliderImageSchema = createInsertSchema(sliderImages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type SliderImage = typeof sliderImages.$inferSelect;
export type InsertSliderImage = z.infer<typeof insertSliderImageSchema>;
