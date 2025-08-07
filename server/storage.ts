import { 
  users, 
  categories, 
  products, 
  cartItems, 
  orders, 
  orderItems,
  siteSettings,
  sliderImages,
  unitsOfMeasure,
  roles,
  permissionModules,
  permissions,
  rolePermissions,
  type User, 
  type InsertUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type SiteSettings,
  type InsertSiteSettings,
  type SliderImage,
  type InsertSliderImage,
  type UnitOfMeasure,
  type InsertUnitOfMeasure,
  type Role,
  type PermissionModule,
  type Permission,
  type RolePermission
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import * as crypto from "crypto";

const PostgresSessionStore = connectPg(session);

// Use PostgreSQL session store for production deployment
import MemoryStore from 'memorystore';
const MemStore = MemoryStore(session);

const sessionStore = process.env.NODE_ENV === 'production' 
  ? new PostgresSessionStore({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true,
    })
  : new MemStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  updateUserProfile(id: string, profile: { firstName?: string; lastName?: string; email?: string }): Promise<User>;
  deleteUser(id: string): Promise<void>;
  // Stripe functions removed - using only Credimax and Cash on Delivery

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Units of measure methods
  getUnitsOfMeasure(): Promise<UnitOfMeasure[]>;
  getActiveUnitsOfMeasure(): Promise<UnitOfMeasure[]>;
  getUnitOfMeasureById(id: string): Promise<UnitOfMeasure | undefined>;
  createUnitOfMeasure(unit: InsertUnitOfMeasure): Promise<UnitOfMeasure>;
  updateUnitOfMeasure(id: string, unit: Partial<InsertUnitOfMeasure>): Promise<UnitOfMeasure>;
  deleteUnitOfMeasure(id: string): Promise<void>;

  // Product methods
  getProducts(): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Cart methods
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(userId: string, productId: string, quantity: number): Promise<CartItem>;
  removeFromCart(userId: string, productId: string): Promise<void>;
  clearCart(userId: string): Promise<void>;



  // Order methods
  getOrders(): Promise<Order[]>;
  getUserOrders(userId: string): Promise<(Order & { items: (OrderItem & { product: Product })[] })[]>;
  getOrderById(id: string): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined>;
  getOrderWithItems(id: string): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined>;
  getOrdersWithDetails(): Promise<any[]>;
  getOrderWithDetails(id: string): Promise<any>;
  getUserById(id: string): Promise<User | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order>;

  // Site settings methods
  getSiteSettings(): Promise<SiteSettings>;
  updateSiteSettings(settingsData: Partial<InsertSiteSettings>): Promise<SiteSettings>;

  // Slider images methods
  getSliderImages(): Promise<SliderImage[]>;
  getActiveSliderImages(): Promise<SliderImage[]>;
  getSliderImageById(id: string): Promise<SliderImage | undefined>;
  createSliderImage(image: InsertSliderImage): Promise<SliderImage>;
  updateSliderImage(id: string, image: Partial<InsertSliderImage>): Promise<SliderImage>;
  deleteSliderImage(id: string): Promise<void>;

  // Database export/import methods
  getUsers(): Promise<User[]>;
  getOrders(): Promise<Order[]>;
  getOrderItems(): Promise<OrderItem[]>;
  getOrderItemsByOrderId(orderId: string): Promise<(OrderItem & { product: Product })[]>;
  getAllCartItems(): Promise<CartItem[]>;
  clearProductsAndCategories(): Promise<void>;
  executeSQLImport(sqlContent: string): Promise<void>;
  
  // Excel import methods
  importCategories(categoriesData: any[]): Promise<void>;
  importProducts(productsData: any[]): Promise<void>;
  importUsers(usersData: any[]): Promise<void>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: any;

  constructor() {
    this.sessionStore = sessionStore;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserProfile(id: string, profile: { firstName?: string; lastName?: string; email?: string }): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(profile)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Stripe functions removed - using only Credimax and Cash on Delivery

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    const [updated] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    // First, check if any products are using this category
    const productsInCategory = await db.select().from(products).where(eq(products.categoryId, id));
    
    if (productsInCategory.length > 0) {
      throw new Error(`Cannot delete category. ${productsInCategory.length} products are assigned to this category. Please reassign or delete those products first.`);
    }
    
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Units of measure methods
  async getUnitsOfMeasure(): Promise<UnitOfMeasure[]> {
    return await db.select().from(unitsOfMeasure).orderBy(unitsOfMeasure.name);
  }

  async getActiveUnitsOfMeasure(): Promise<UnitOfMeasure[]> {
    return await db.select().from(unitsOfMeasure).where(eq(unitsOfMeasure.isActive, true)).orderBy(unitsOfMeasure.name);
  }

  async getUnitOfMeasureById(id: string): Promise<UnitOfMeasure | undefined> {
    const [unit] = await db.select().from(unitsOfMeasure).where(eq(unitsOfMeasure.id, id));
    return unit || undefined;
  }

  async createUnitOfMeasure(unit: InsertUnitOfMeasure): Promise<UnitOfMeasure> {
    const [newUnit] = await db
      .insert(unitsOfMeasure)
      .values(unit)
      .returning();
    return newUnit;
  }

  async updateUnitOfMeasure(id: string, unit: Partial<InsertUnitOfMeasure>): Promise<UnitOfMeasure> {
    const [updated] = await db
      .update(unitsOfMeasure)
      .set(unit)
      .where(eq(unitsOfMeasure.id, id))
      .returning();
    return updated;
  }

  async deleteUnitOfMeasure(id: string): Promise<void> {
    await db.delete(unitsOfMeasure).where(eq(unitsOfMeasure.id, id));
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
      .limit(8);
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.categoryId, categoryId), eq(products.isActive, true)));
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    // First, delete any order items that reference this product
    await db.delete(orderItems).where(eq(orderItems.productId, id));
    
    // Then delete the product
    await db.delete(products).where(eq(products.id, id));
  }



  // Additional methods for database export/import
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrderItems(): Promise<OrderItem[]> {
    return await db.select().from(orderItems);
  }

  async getOrderItemsByOrderId(orderId: string): Promise<(OrderItem & { product: Product })[]> {
    return await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        totalPrice: orderItems.totalPrice,
        rentalStartDate: orderItems.rentalStartDate,
        rentalEndDate: orderItems.rentalEndDate,
        rentalDays: orderItems.rentalDays,
        createdAt: orderItems.createdAt,
        product: products,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));
  }

  async getAllCartItems(): Promise<CartItem[]> {
    return await db.select().from(cartItems);
  }

  // Excel import methods
  async importCategories(categoriesData: any[]): Promise<void> {
    if (categoriesData.length === 0) return;
    
    // Clear existing categories
    await db.delete(categories);
    
    // Insert new categories
    for (const category of categoriesData) {
      const insertData: any = {
        name: category.name,
        description: category.description || "",
        imageUrl: category.imageUrl || ""
      };
      
      // Only include ID if it exists and is not empty
      if (category.id && category.id.trim() !== "") {
        insertData.id = category.id;
      }
      
      await db.insert(categories).values(insertData);
    }
  }

  async importProducts(productsData: any[]): Promise<void> {
    if (productsData.length === 0) return;
    
    // Clear existing products
    await db.delete(products);
    
    // Insert new products
    for (const product of productsData) {
      const insertData: any = {
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        stock: product.stock || 0,
        sku: product.sku || "",
        unitOfMeasure: product.unitOfMeasure || 'piece',
        categoryId: product.categoryId,
        imageUrl: product.imageUrl || "",
        isActive: product.isActive !== undefined ? product.isActive : true,
        isFeatured: product.isFeatured !== undefined ? product.isFeatured : false,
        rating: (product.rating || 0).toString(),
        reviewCount: product.reviewCount || 0,
        productType: product.productType || 'sale',
        rentalPeriod: product.rentalPeriod,
        rentalPrice: product.rentalPrice?.toString()
      };
      
      // Only include ID if it exists and is not empty
      if (product.id && product.id.trim() !== "") {
        insertData.id = product.id;
      }
      
      await db.insert(products).values(insertData);
    }
  }

  async importUsers(usersData: any[]): Promise<void> {
    if (usersData.length === 0) return;
    
    // Note: We don't clear existing users for security reasons
    // Instead, we only update existing users or create new ones
    
    for (const user of usersData) {
      const existingUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      
      if (existingUser.length > 0) {
        // Update existing user (excluding password for security)
        await db.update(users).set({
          username: user.username || user.email,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin
        }).where(eq(users.id, user.id));
      } else {
        // Create new user with default password (they'll need to reset)
        const defaultPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = crypto.scryptSync(defaultPassword, defaultPassword, 64).toString('hex');
        
        const insertData: any = {
          username: user.username || user.email || `user${Date.now()}`,
          email: user.email || `user${Date.now()}@example.com`,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          isAdmin: user.isAdmin || false,
          password: hashedPassword
        };
        
        // Only include ID if it exists and is not empty
        if (user.id && user.id.trim() !== "") {
          insertData.id = user.id;
        }
        
        await db.insert(users).values(insertData);
      }
    }
  }

  async importUnitsOfMeasure(unitsData: any[]): Promise<void> {
    if (unitsData.length === 0) return;
    
    // Clear existing units and insert new ones
    await db.delete(unitsOfMeasure);
    
    for (const unit of unitsData) {
      const insertData: any = {
        name: unit.name,
        abbreviation: unit.abbreviation,
        isActive: unit.isActive !== undefined ? unit.isActive : true
      };
      
      // Only include ID if it exists and is not empty
      if (unit.id && unit.id.trim() !== "") {
        insertData.id = unit.id;
      }
      
      await db.insert(unitsOfMeasure).values(insertData);
    }
  }

  async importOrders(ordersData: any[]): Promise<void> {
    if (ordersData.length === 0) return;
    
    // Clear existing orders and order items
    await db.delete(orderItems);
    await db.delete(orders);
    
    for (const order of ordersData) {
      const insertData: any = {
        userId: order.userId,
        status: order.status || 'pending',
        total: (order.totalAmount || 0).toString(),
        subtotal: (order.totalAmount || 0).toString(),
        shippingAddress: order.shippingAddress || null,
        paymentMethod: order.paymentMethod || 'cash_on_delivery'
      };
      
      // Only include ID if it exists and is not empty
      if (order.id && order.id.trim() !== "") {
        insertData.id = order.id;
      }
      
      await db.insert(orders).values(insertData);
    }
  }

  async importOrderItems(orderItemsData: any[]): Promise<void> {
    if (orderItemsData.length === 0) return;
    
    for (const item of orderItemsData) {
      const insertData: any = {
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity || 1,
        price: (item.price || 0).toString()
      };
      
      // Only include ID if it exists and is not empty
      if (item.id && item.id.trim() !== "") {
        insertData.id = item.id;
      }
      
      await db.insert(orderItems).values(insertData);
    }
  }

  async importSliderImages(sliderData: any[]): Promise<void> {
    if (sliderData.length === 0) return;
    
    // Clear existing slider images
    await db.delete(sliderImages);
    
    for (const slide of sliderData) {
      const insertData: any = {
        title: slide.title || "Slide",
        imageUrl: slide.imageUrl || "",
        isActive: slide.isActive !== undefined ? slide.isActive : true,
        sortOrder: slide.displayOrder || 0
      };
      
      // Only include ID if it exists and is not empty
      if (slide.id && slide.id.trim() !== "") {
        insertData.id = slide.id;
      }
      
      await db.insert(sliderImages).values(insertData);
    }
  }

  async importSiteSettings(settingsData: any[]): Promise<void> {
    if (settingsData.length === 0) return;
    
    for (const setting of settingsData) {
      const insertData: any = {
        siteName: setting.siteName || "",
        headerLogo: setting.headerLogo || null,
        footerLogo: setting.footerLogo || null,
        footerDescription: setting.footerDescription || "",
        footerCopyright: setting.footerCopyright || "",
        footerBackgroundImage: setting.footerBackgroundImage || null,
        quickLinksTitle: setting.quickLinksTitle || "Quick Links",
        quickLinks: setting.quickLinks || null,
        servicesTitle: setting.servicesTitle || "Our Services",
        serviceLink1Text: setting.serviceLink1Text || "",
        serviceLink1Url: setting.serviceLink1Url || "",
        serviceLink2Text: setting.serviceLink2Text || "",
        serviceLink2Url: setting.serviceLink2Url || "",
        serviceLink3Text: setting.serviceLink3Text || "",
        serviceLink3Url: setting.serviceLink3Url || "",
        serviceLink4Text: setting.serviceLink4Text || "",
        serviceLink4Url: setting.serviceLink4Url || "",
        socialFacebook: setting.socialFacebook || "",
        socialTwitter: setting.socialTwitter || "",
        socialInstagram: setting.socialInstagram || "",
        socialLinkedin: setting.socialLinkedin || ""
      };
      
      // Use default ID or provided ID
      const settingId = (setting.id && setting.id.trim() !== "") ? setting.id : "default";
      
      // Update existing or insert new
      const existingSetting = await db.select().from(siteSettings).where(eq(siteSettings.id, settingId)).limit(1);
      
      if (existingSetting.length > 0) {
        await db.update(siteSettings).set(insertData).where(eq(siteSettings.id, settingId));
      } else {
        insertData.id = settingId;
        await db.insert(siteSettings).values(insertData);
      }
    }
  }

  async clearProductsAndCategories(): Promise<void> {
    await db.delete(cartItems);
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(products);
    await db.delete(categories);
  }

  async executeSQLImport(sqlContent: string): Promise<void> {
    try {
      // Split SQL content into individual statements
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          await db.execute(statement);
        }
      }
    } catch (error) {
      console.error('SQL import execution error:', error);
      throw new Error('Failed to execute SQL import');
    }
  }

  // Cart methods
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    return await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        rentalStartDate: cartItems.rentalStartDate,
        rentalEndDate: cartItems.rentalEndDate,
        unitPrice: cartItems.unitPrice,
        totalPrice: cartItems.totalPrice,
        createdAt: cartItems.createdAt,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // For rental products, don't combine items - each rental period should be separate
    if (item.rentalStartDate && item.rentalEndDate) {
      // Create new cart item for rentals (each rental period is unique)
      const [newItem] = await db
        .insert(cartItems)
        .values(item)
        .returning();
      return newItem;
    } else {
      // For sale products, check if item already exists and combine quantities
      const [existing] = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.userId, item.userId), eq(cartItems.productId, item.productId)));

      if (existing) {
        // Update quantity and recalculate total price
        const newQuantity = existing.quantity + (item.quantity || 1);
        const newTotalPrice = item.unitPrice ? (parseFloat(item.unitPrice) * newQuantity).toFixed(2) : item.totalPrice;
        
        const [updated] = await db
          .update(cartItems)
          .set({ 
            quantity: newQuantity,
            totalPrice: newTotalPrice
          })
          .where(eq(cartItems.id, existing.id))
          .returning();
        return updated;
      } else {
        // Create new cart item
        const [newItem] = await db
          .insert(cartItems)
          .values(item)
          .returning();
        return newItem;
      }
    }
  }

  async updateCartItem(userId: string, productId: string, quantity: number): Promise<CartItem> {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
      .returning();
    return updated;
  }

  async removeFromCart(userId: string, productId: string): Promise<void> {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }



  // Order methods  
  async getOrdersWithDetails(): Promise<any[]> {
    const ordersData = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
    
    return Promise.all(ordersData.map(async (order) => {
      // Get user data separately
      const [userData] = await db
        .select()
        .from(users)
        .where(eq(users.id, order.userId));
        
      // Get order items
      const items = await db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          createdAt: orderItems.createdAt,
          product: products,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));

      return {
        ...order,
        user: userData || null,
        items
      };
    }));
  }

  async getUserOrders(userId: string): Promise<any[]> {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            price: orderItems.price,
            createdAt: orderItems.createdAt,
            product: products,
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return { ...order, items };
      })
    );

    return ordersWithItems;
  }

  async getOrderWithDetails(orderId: string): Promise<any> {
    // Get order data
    const [orderData] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));
    
    if (!orderData) {
      throw new Error('Order not found');
    }
    
    // Get user data
    const [userData] = await db
      .select()
      .from(users)
      .where(eq(users.id, orderData.userId));
      
    // Get order items
    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        createdAt: orderItems.createdAt,
        product: products,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderData.id));

    return {
      ...orderData,
      user: userData || null,
      items
    };
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const [updated] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async getOrderById(id: string): Promise<any> {
    try {
      // Get the basic order first
      const [orderData] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, id));
        
      if (!orderData) {
        return null;
      }

      // Get the user separately
      const [userData] = await db
        .select()
        .from(users)
        .where(eq(users.id, orderData.userId));

      // Get order items
      const items = await db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          createdAt: orderItems.createdAt,
          product: products,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, orderData.id));

      return {
        ...orderData,
        user: userData || null,
        items
      };
    } catch (error) {
      console.error('Error in getOrderById:', error);
      throw error;
    }
  }

  async getOrderWithItems(id: string): Promise<any> {
    return this.getOrderById(id);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db
      .insert(orderItems)
      .values(item)
      .returning();
    return newItem;
  }



  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  // Site Settings methods
  async getSiteSettings(): Promise<SiteSettings> {
    const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, "default"));
    if (!settings) {
      // Create default settings if none exist
      const [newSettings] = await db.insert(siteSettings).values({ id: "default" }).returning();
      return newSettings;
    }
    return settings;
  }

  async updateSiteSettings(settingsData: Partial<InsertSiteSettings>): Promise<SiteSettings> {
    const [updated] = await db
      .update(siteSettings)
      .set({ ...settingsData, updatedAt: new Date() })
      .where(eq(siteSettings.id, "default"))
      .returning();
    return updated;
  }

  // Slider images methods
  async getSliderImages(): Promise<SliderImage[]> {
    return await db.select().from(sliderImages).orderBy(sliderImages.sortOrder, sliderImages.createdAt);
  }

  async getActiveSliderImages(): Promise<SliderImage[]> {
    return await db
      .select()
      .from(sliderImages)
      .where(eq(sliderImages.isActive, true))
      .orderBy(sliderImages.sortOrder, sliderImages.createdAt);
  }

  async getSliderImageById(id: string): Promise<SliderImage | undefined> {
    const [image] = await db.select().from(sliderImages).where(eq(sliderImages.id, id));
    return image || undefined;
  }

  async createSliderImage(image: InsertSliderImage): Promise<SliderImage> {
    const [newImage] = await db
      .insert(sliderImages)
      .values(image)
      .returning();
    return newImage;
  }

  async updateSliderImage(id: string, imageData: Partial<InsertSliderImage>): Promise<SliderImage> {
    const [updatedImage] = await db
      .update(sliderImages)
      .set({ ...imageData, updatedAt: new Date() })
      .where(eq(sliderImages.id, id))
      .returning();
    return updatedImage;
  }

  async deleteSliderImage(id: string): Promise<void> {
    await db.delete(sliderImages).where(eq(sliderImages.id, id));
  }
  // Permission system methods
  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.name);
  }

  async getRoleById(id: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async getAllPermissionModules(): Promise<PermissionModule[]> {
    return await db.select().from(permissionModules).orderBy(permissionModules.sortOrder);
  }

  async getPermissionsByModule(moduleId: string): Promise<Permission[]> {
    return await db.select().from(permissions).where(eq(permissions.moduleId, moduleId));
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const result = await db
      .select({
        id: permissions.id,
        moduleId: permissions.moduleId,
        name: permissions.name,
        displayName: permissions.displayName,
        description: permissions.description,
        action: permissions.action,
        createdAt: permissions.createdAt,
      })
      .from(permissions)
      .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(rolePermissions.roleId, roleId));
    
    return result;
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
    // First, remove all existing permissions for this role
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    
    // Then, add the new permissions
    if (permissionIds.length > 0) {
      const insertData = permissionIds.map(permissionId => ({
        roleId,
        permissionId
      }));
      await db.insert(rolePermissions).values(insertData);
    }
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await db.update(users).set({ roleId }).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
