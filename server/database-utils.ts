import { storage } from './storage';
import { products, categories, users, orders, orderItems, cartItems, siteSettings } from '@shared/schema';
import fs from 'fs/promises';
import path from 'path';

export interface DatabaseExport {
  timestamp: string;
  version: string;
  data: {
    products: any[];
    categories: any[];
    users: any[];
    orders: any[];
    orderItems: any[];
    cartItems: any[];
    siteSettings: any[];
  };
}

export async function exportDatabase(): Promise<DatabaseExport> {
  try {
    const [
      productsData,
      categoriesData,
      usersData,
      ordersData,
      orderItemsData,
      cartItemsData,
      siteSettingsData
    ] = await Promise.all([
      storage.getProducts(),
      storage.getCategories(),
      storage.getUsers(),
      storage.getOrders(),
      storage.getOrderItems(),
      storage.getCartItems("system"),
      storage.getSiteSettings().then(settings => [settings])
    ]);

    const exportData: DatabaseExport = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {
        products: productsData,
        categories: categoriesData,
        users: usersData.map(user => ({ ...user, password: '[REDACTED]' })), // Remove sensitive data
        orders: ordersData,
        orderItems: orderItemsData,
        cartItems: cartItemsData,
        siteSettings: siteSettingsData.map(setting => ({ 
          ...setting, 
          smtpPassword: setting.smtpPassword ? '[REDACTED]' : null 
        }))
      }
    };

    return exportData;
  } catch (error) {
    console.error('Database export error:', error);
    throw new Error('Failed to export database');
  }
}

export async function saveExportToFile(exportData: DatabaseExport): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database-export-${timestamp}.sql`;
    const filepath = path.join(process.cwd(), 'uploads', filename);
    
    // Convert JSON data to SQL format
    const sqlContent = generateSQLExport(exportData);
    await fs.writeFile(filepath, sqlContent);
    return filename;
  } catch (error) {
    console.error('Export file save error:', error);
    throw new Error('Failed to save export file');
  }
}

function generateSQLExport(exportData: DatabaseExport): string {
  let sqlContent = `-- Database Export Generated on ${exportData.timestamp}\n`;
  sqlContent += `-- InnovanceOrbit E-commerce Platform Database Backup\n`;
  sqlContent += `-- Version: ${exportData.version}\n\n`;
  
  // Add categories
  if (exportData.data.categories.length > 0) {
    sqlContent += `-- Categories\n`;
    sqlContent += `DELETE FROM categories;\n`;
    for (const category of exportData.data.categories) {
      sqlContent += `INSERT INTO categories (id, name, description, image_url, created_at) VALUES ('${category.id}', '${escapeSQL(category.name)}', '${escapeSQL(category.description || '')}', '${escapeSQL(category.imageUrl || '')}', '${category.createdAt}');\n`;
    }
    sqlContent += `\n`;
  }
  
  // Add products
  if (exportData.data.products.length > 0) {
    sqlContent += `-- Products\n`;
    sqlContent += `DELETE FROM products;\n`;
    for (const product of exportData.data.products) {
      sqlContent += `INSERT INTO products (id, name, description, price, category_id, image_url, is_featured, stock_quantity, created_at) VALUES ('${product.id}', '${escapeSQL(product.name)}', '${escapeSQL(product.description || '')}', '${product.price}', '${product.categoryId}', '${escapeSQL(product.imageUrl || '')}', ${product.isFeatured}, ${product.stockQuantity || 0}, '${product.createdAt}');\n`;
    }
    sqlContent += `\n`;
  }
  
  // Add site settings
  if (exportData.data.siteSettings.length > 0) {
    sqlContent += `-- Site Settings\n`;
    const settings = exportData.data.siteSettings[0];
    sqlContent += `UPDATE site_settings SET `;
    sqlContent += `site_name = '${escapeSQL(settings.siteName || '')}', `;
    sqlContent += `header_text = '${escapeSQL(settings.headerText || '')}', `;
    sqlContent += `footer_description = '${escapeSQL(settings.footerDescription || '')}', `;
    sqlContent += `contact_email = '${escapeSQL(settings.contactEmail || '')}', `;
    sqlContent += `contact_phone = '${escapeSQL(settings.contactPhone || '')}', `;
    sqlContent += `contact_address = '${escapeSQL(settings.contactAddress || '')}', `;
    sqlContent += `logo_url = '${escapeSQL(settings.logoUrl || '')}' `;
    sqlContent += `WHERE id = 'default';\n\n`;
  }
  
  sqlContent += `-- Export completed successfully\n`;
  return sqlContent;
}

function escapeSQL(str: string): string {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

export async function importDatabase(sqlContent: string): Promise<void> {
  try {
    // Import via direct SQL execution
    await storage.executeSQLImport(sqlContent);
    console.log('Database import completed successfully');
  } catch (error) {
    console.error('Database import error:', error);
    throw new Error('Failed to import database: ' + (error as Error).message);
  }
}

export async function validateImportFile(filePath: string): Promise<string> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Basic validation for SQL content
    if (!fileContent.includes('-- InnovanceOrbit E-commerce Platform Database Backup')) {
      throw new Error('Invalid SQL export file format');
    }

    return fileContent;
  } catch (error) {
    console.error('Import file validation error:', error);
    throw new Error('Invalid import file: ' + (error as Error).message);
  }
}