import * as XLSX from 'xlsx';
import { db } from './db';
import { products, categories, users, orders, orderItems, unitsOfMeasure, siteSettings, sliderImages } from '@shared/schema';
import type { Product, Category, User, Order, OrderItem, UnitOfMeasure, SiteSettings, SliderImage } from '@shared/schema';

export interface ExcelExportData {
  products: Product[];
  categories: Category[];
  users: User[];
  orders: Order[];
  orderItems: OrderItem[];
  unitsOfMeasure: UnitOfMeasure[];
  siteSettings: SiteSettings[];
  sliderImages: SliderImage[];
}

export function createExcelFile(data: ExcelExportData): Buffer {
  const workbook = XLSX.utils.book_new();

  // Create products worksheet
  const productsWS = XLSX.utils.json_to_sheet(data.products.map(product => ({
    ID: product.id,
    Name: product.name,
    Description: product.description,
    Price: product.price,
    SKU: product.sku,
    'Unit of Measure': product.unitOfMeasure,
    'Category ID': product.categoryId,
    'Image URL': product.imageUrl,
    'Is Active': product.isActive,
    'Is Featured': product.isFeatured,
    Rating: product.rating,
    'Review Count': product.reviewCount,
    'Product Type': product.productType,
    'Rental Period': product.rentalPeriod,
    'Rental Price': product.rentalPrice,
    'Created At': product.createdAt
  })));

  // Create categories worksheet
  const categoriesWS = XLSX.utils.json_to_sheet(data.categories.map(category => ({
    ID: category.id,
    Name: category.name,
    Description: category.description,
    'Image URL': category.imageUrl,
    'Created At': category.createdAt
  })));

  // Create users worksheet (excluding sensitive data)
  const usersWS = XLSX.utils.json_to_sheet(data.users.map(user => ({
    ID: user.id,
    Username: user.username,
    Email: user.email,
    'First Name': user.firstName,
    'Last Name': user.lastName,
    'Is Admin': user.isAdmin,
    'Created At': user.createdAt
  })));

  // Create orders worksheet
  const ordersWS = XLSX.utils.json_to_sheet(data.orders.map(order => ({
    ID: order.id,
    'User ID': order.userId,
    Status: order.status,
    'Total Amount': order.total,
    'Delivery Address': (order as any).deliveryAddress || '',
    'Payment Method': order.paymentMethod,
    'Payment Status': order.status,
    Notes: (order as any).notes || '',
    'Created At': order.createdAt,
    'Updated At': (order as any).updatedAt || order.createdAt
  })));

  // Create order items worksheet
  const orderItemsWS = XLSX.utils.json_to_sheet(data.orderItems.map(item => ({
    ID: item.id,
    'Order ID': item.orderId,
    'Product ID': item.productId,
    Quantity: item.quantity,
    Price: item.price,
    'Created At': item.createdAt
  })));

  // Create units of measure worksheet
  const unitsWS = XLSX.utils.json_to_sheet(data.unitsOfMeasure.map(unit => ({
    ID: unit.id,
    Name: unit.name,
    Abbreviation: unit.abbreviation,
    'Is Active': unit.isActive,
    'Created At': unit.createdAt
  })));

  // Create site settings worksheet
  const settingsWS = XLSX.utils.json_to_sheet(data.siteSettings.map(setting => ({
    ID: setting.id,
    'Site Name': setting.siteName,
    'Header Logo': setting.headerLogo,
    'Footer Logo': setting.footerLogo,
    'Footer Description': setting.footerDescription,
    'Footer Copyright': setting.footerDescription,
    'Footer Quick Links Title': setting.quickLinksTitle,
    'Footer Quick Links': setting.quickLinksTitle,
    'Footer Services Title': setting.servicesTitle,
    'Footer Services': setting.servicesTitle,
    'Footer Social Facebook': setting.socialFacebook,
    'Footer Social Twitter': setting.socialTwitter,
    'Footer Social Instagram': setting.socialInstagram,
    'Footer Social LinkedIn': setting.socialLinkedin,
    'Footer Background Image': setting.footerBackgroundUrl,
    'SMTP Host': setting.smtpHost,
    'SMTP Port': setting.smtpPort,
    'SMTP Username': setting.smtpUser,
    'SMTP From Email': setting.smtpFromEmail,
    'SMTP From Name': setting.smtpFromName,
    'Updated At': setting.updatedAt
  })));

  // Create slider images worksheet
  const sliderWS = XLSX.utils.json_to_sheet(data.sliderImages.map(slide => ({
    ID: slide.id,
    Title: slide.title,
    'Image URL': slide.imageUrl,
    'Link URL': slide.description || '',
    'Is Active': slide.isActive,
    'Display Order': slide.sortOrder,
    'Created At': slide.createdAt
  })));

  XLSX.utils.book_append_sheet(workbook, productsWS, 'Products');
  XLSX.utils.book_append_sheet(workbook, categoriesWS, 'Categories');
  XLSX.utils.book_append_sheet(workbook, usersWS, 'Users');
  XLSX.utils.book_append_sheet(workbook, ordersWS, 'Orders');
  XLSX.utils.book_append_sheet(workbook, orderItemsWS, 'Order Items');
  XLSX.utils.book_append_sheet(workbook, unitsWS, 'Units of Measure');
  XLSX.utils.book_append_sheet(workbook, settingsWS, 'Site Settings');
  XLSX.utils.book_append_sheet(workbook, sliderWS, 'Slider Images');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function parseExcelFile(buffer: Buffer): {
  products: any[];
  categories: any[];
  users: any[];
  orders: any[];
  orderItems: any[];
  unitsOfMeasure: any[];
  siteSettings: any[];
  sliderImages: any[];
} {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  const result = {
    products: [] as any[],
    categories: [] as any[],
    users: [] as any[],
    orders: [] as any[],
    orderItems: [] as any[],
    unitsOfMeasure: [] as any[],
    siteSettings: [] as any[],
    sliderImages: [] as any[]
  };

  // Parse products sheet
  if (workbook.SheetNames.includes('Products')) {
    const productsSheet = workbook.Sheets['Products'];
    const productsData = XLSX.utils.sheet_to_json(productsSheet);
    result.products = productsData.map((row: any) => ({
      id: row.ID || row.id || "",
      name: row.Name || row.name || "Unnamed Product",
      description: row.Description || row.description || "",
      price: parseFloat(row.Price || row.price || '0'),

      sku: row.SKU || row.sku || "",
      unitOfMeasure: row['Unit of Measure'] || row.unitOfMeasure || 'piece',
      categoryId: row['Category ID'] || row.categoryId || null,
      imageUrl: row['Image URL'] || row.imageUrl || "",
      isActive: Boolean(row['Is Active'] !== undefined ? row['Is Active'] : row.isActive !== undefined ? row.isActive : true),
      isFeatured: Boolean(row['Is Featured'] !== undefined ? row['Is Featured'] : row.isFeatured !== undefined ? row.isFeatured : false),
      rating: parseFloat(row.Rating || row.rating || '0'),
      reviewCount: parseInt(row['Review Count'] || row.reviewCount || '0'),
      productType: row['Product Type'] || row.productType || 'sale',
      rentalPeriod: row['Rental Period'] || row.rentalPeriod || null,
      rentalPrice: row['Rental Price'] ? parseFloat(row['Rental Price']) : row.rentalPrice ? parseFloat(row.rentalPrice) : null
    }));
  }

  // Parse categories sheet
  if (workbook.SheetNames.includes('Categories')) {
    const categoriesSheet = workbook.Sheets['Categories'];
    const categoriesData = XLSX.utils.sheet_to_json(categoriesSheet);
    result.categories = categoriesData.map((row: any) => ({
      id: row.ID || row.id || "",
      name: row.Name || row.name || "Unnamed Category",
      description: row.Description || row.description || "",
      imageUrl: row['Image URL'] || row.imageUrl || ""
    }));
  }

  // Parse users sheet
  if (workbook.SheetNames.includes('Users')) {
    const usersSheet = workbook.Sheets['Users'];
    const usersData = XLSX.utils.sheet_to_json(usersSheet);
    result.users = usersData.map((row: any) => ({
      id: row.ID || row.id || "",
      username: row.Username || row.username || row.Email || row.email || "user",
      email: row.Email || row.email || `user${Date.now()}@example.com`,
      firstName: row['First Name'] || row.firstName || "",
      lastName: row['Last Name'] || row.lastName || "",
      isAdmin: Boolean(row['Is Admin'] !== undefined ? row['Is Admin'] : row.isAdmin !== undefined ? row.isAdmin : false)
    }));
  }

  // Parse units of measure sheet
  if (workbook.SheetNames.includes('Units of Measure')) {
    const unitsSheet = workbook.Sheets['Units of Measure'];
    const unitsData = XLSX.utils.sheet_to_json(unitsSheet);
    result.unitsOfMeasure = unitsData.map((row: any) => ({
      id: row.ID || row.id || "",
      name: row.Name || row.name || "Unit",
      abbreviation: row.Abbreviation || row.abbreviation || "unit",
      isActive: Boolean(row['Is Active'] !== undefined ? row['Is Active'] : row.isActive !== undefined ? row.isActive : true)
    }));
  }

  // Parse orders sheet
  if (workbook.SheetNames.includes('Orders')) {
    const ordersSheet = workbook.Sheets['Orders'];
    const ordersData = XLSX.utils.sheet_to_json(ordersSheet);
    result.orders = ordersData.map((row: any) => ({
      id: row.ID || row.id || "",
      userId: row['User ID'] || row.userId || null,
      status: row.Status || row.status || 'pending',
      totalAmount: parseFloat(row['Total Amount'] || row.totalAmount || '0'),
      shippingAddress: row['Shipping Address'] || row.shippingAddress || "",
      paymentMethod: row['Payment Method'] || row.paymentMethod || 'cash_on_delivery',
      paymentStatus: row['Payment Status'] || row.paymentStatus || 'pending',
      notes: row.Notes || row.notes || ""
    }));
  }

  // Parse order items sheet
  if (workbook.SheetNames.includes('Order Items')) {
    const orderItemsSheet = workbook.Sheets['Order Items'];
    const orderItemsData = XLSX.utils.sheet_to_json(orderItemsSheet);
    result.orderItems = orderItemsData.map((row: any) => ({
      id: row.ID || row.id || "",
      orderId: row['Order ID'] || row.orderId || null,
      productId: row['Product ID'] || row.productId || null,
      quantity: parseInt(row.Quantity || row.quantity || '1'),
      price: parseFloat(row.Price || row.price || '0')
    }));
  }

  // Parse slider images sheet
  if (workbook.SheetNames.includes('Slider Images')) {
    const sliderSheet = workbook.Sheets['Slider Images'];
    const sliderData = XLSX.utils.sheet_to_json(sliderSheet);
    result.sliderImages = sliderData.map((row: any) => ({
      id: row.ID || row.id || "",
      title: row.Title || row.title || "Slide",
      imageUrl: row['Image URL'] || row.imageUrl || "",
      linkUrl: row['Link URL'] || row.linkUrl || "",
      isActive: Boolean(row['Is Active'] !== undefined ? row['Is Active'] : row.isActive !== undefined ? row.isActive : true),
      displayOrder: parseInt(row['Display Order'] || row.displayOrder || '0')
    }));
  }

  // Parse site settings sheet
  if (workbook.SheetNames.includes('Site Settings')) {
    const settingsSheet = workbook.Sheets['Site Settings'];
    const settingsData = XLSX.utils.sheet_to_json(settingsSheet);
    result.siteSettings = settingsData.map((row: any) => ({
      id: row.ID || row.id || "default",
      siteName: row['Site Name'] || row.siteName || "",
      headerLogo: row['Header Logo'] || row.headerLogo || null,
      footerLogo: row['Footer Logo'] || row.footerLogo || null,
      footerDescription: row['Footer Description'] || row.footerDescription || "",
      footerCopyright: row['Footer Copyright'] || row.footerCopyright || "",
      footerBackgroundImage: row['Footer Background Image'] || row.footerBackgroundImage || null,
      quickLinksTitle: row['Quick Links Title'] || row.quickLinksTitle || "Quick Links",
      quickLinks: row['Quick Links'] || row.quickLinks || null,
      servicesTitle: row['Services Title'] || row.servicesTitle || "Our Services",
      serviceLink1Text: row['Service Link 1 Text'] || row.serviceLink1Text || "",
      serviceLink1Url: row['Service Link 1 URL'] || row.serviceLink1Url || "",
      serviceLink2Text: row['Service Link 2 Text'] || row.serviceLink2Text || "",
      serviceLink2Url: row['Service Link 2 URL'] || row.serviceLink2Url || "",
      serviceLink3Text: row['Service Link 3 Text'] || row.serviceLink3Text || "",
      serviceLink3Url: row['Service Link 3 URL'] || row.serviceLink3Url || "",
      serviceLink4Text: row['Service Link 4 Text'] || row.serviceLink4Text || "",
      serviceLink4Url: row['Service Link 4 URL'] || row.serviceLink4Url || "",
      socialFacebook: row['Social Facebook'] || row.socialFacebook || "",
      socialTwitter: row['Social Twitter'] || row.socialTwitter || "",
      socialInstagram: row['Social Instagram'] || row.socialInstagram || "",
      socialLinkedin: row['Social LinkedIn'] || row.socialLinkedin || ""
    }));
  }

  return result;
}

// Individual sheet export functions
export async function exportProductsToExcel(): Promise<Buffer> {
  const { storage } = await import('./storage');
  const products = await storage.getProducts();
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(products.map((product: any) => ({
    ID: product.id,
    Name: product.name,
    Description: product.description,
    Price: product.price,
    SKU: product.sku,
    'Unit of Measure': product.unitOfMeasure,
    'Category ID': product.categoryId,
    'Image URL': product.imageUrl,
    'Is Active': product.isActive,
    'Is Featured': product.isFeatured,
    Rating: product.rating,
    'Review Count': product.reviewCount,
    'Product Type': product.productType,
    'Rental Period': product.rentalPeriod,
    'Rental Price': product.rentalPrice
  })));
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export async function exportCategoriesToExcel(): Promise<Buffer> {
  const { storage } = await import('./storage');
  const categories = await storage.getCategories();
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(categories.map((category: any) => ({
    ID: category.id,
    Name: category.name,
    Description: category.description,
    'Image URL': category.imageUrl
  })));
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export async function exportUsersToExcel(): Promise<Buffer> {
  const { storage } = await import('./storage');
  const users = await storage.getUsers();
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(users.map((user: any) => ({
    ID: user.id,
    Username: user.username,
    Email: user.email,
    'First Name': user.firstName,
    'Last Name': user.lastName,
    'Is Admin': user.isAdmin
  })));
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export async function exportOrdersToExcel(): Promise<Buffer> {
  const { storage } = await import('./storage');
  const orders = await storage.getOrders();
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(orders.map((order: any) => ({
    ID: order.id,
    'User ID': order.userId,
    Status: order.status,
    'Total Amount': order.total,
    'Delivery Address': order.deliveryAddress || '',
    'Payment Method': order.paymentMethod,
    'Created At': order.createdAt
  })));
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export async function exportOrderItemsToExcel(): Promise<Buffer> {
  const { storage } = await import('./storage');
  const orderItems = await storage.getOrderItems();
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(orderItems.map((item: any) => ({
    ID: item.id,
    'Order ID': item.orderId,
    'Product ID': item.productId,
    Quantity: item.quantity,
    Price: item.price
  })));
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Order Items');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export async function exportUnitsToExcel(): Promise<Buffer> {
  const { storage } = await import('./storage');
  const units = await storage.getUnitsOfMeasure();
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(units.map((unit: any) => ({
    ID: unit.id,
    Name: unit.name,
    Abbreviation: unit.abbreviation,
    'Is Active': unit.isActive
  })));
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Units of Measure');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export async function exportSiteSettingsToExcel(): Promise<Buffer> {
  const { storage } = await import('./storage');
  const settings = await storage.getSiteSettings();
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet([{
    ID: settings.id,
    'Site Name': settings.siteName,
    'Header Logo': settings.headerLogo,
    'Footer Logo': settings.footerLogo,
    'Footer Description': settings.footerDescription,
    'Footer Copyright': settings.footerDescription,
    'Footer Background Image': settings.footerBackgroundUrl,
    'Quick Links Title': settings.quickLinksTitle,
    'Quick Links': settings.quickLinksTitle,
    'Services Title': settings.servicesTitle,
    'Service Link 1 Text': settings.serviceLink1,
    'Service Link 1 URL': settings.serviceLink1,
    'Service Link 2 Text': settings.serviceLink2,
    'Service Link 2 URL': settings.serviceLink2,
    'Service Link 3 Text': settings.serviceLink3,
    'Service Link 3 URL': settings.serviceLink3,
    'Service Link 4 Text': settings.serviceLink4,
    'Service Link 4 URL': settings.serviceLink4,
    'Social Facebook': settings.socialFacebook,
    'Social Twitter': settings.socialTwitter,
    'Social Instagram': settings.socialInstagram,
    'Social LinkedIn': settings.socialLinkedin
  }]);
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Site Settings');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export async function exportSliderImagesToExcel(): Promise<Buffer> {
  const { storage } = await import('./storage');
  const sliderImages = await storage.getSliderImages();
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sliderImages.map((slide: any) => ({
    ID: slide.id,
    Title: slide.title,
    'Image URL': slide.imageUrl,
    'Link URL': slide.linkUrl || '',
    'Is Active': slide.isActive,
    'Display Order': slide.sortOrder
  })));
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Slider Images');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export async function exportDataToExcel(): Promise<Buffer> {
  const [
    productsData, 
    categoriesData, 
    usersData, 
    ordersData, 
    orderItemsData, 
    unitsData, 
    settingsData, 
    sliderData
  ] = await Promise.all([
    db.select().from(products),
    db.select().from(categories),
    db.select().from(users),
    db.select().from(orders),
    db.select().from(orderItems),
    db.select().from(unitsOfMeasure),
    db.select().from(siteSettings),
    db.select().from(sliderImages)
  ]);

  const exportData: ExcelExportData = {
    products: productsData,
    categories: categoriesData,
    users: usersData,
    orders: ordersData,
    orderItems: orderItemsData,
    unitsOfMeasure: unitsData,
    siteSettings: settingsData,
    sliderImages: sliderData
  };

  return createExcelFile(exportData);
}