import nodemailer from "nodemailer";
import { storage } from "./storage";
import type { SiteSettings } from "@shared/schema";

// Email service with dynamic SMTP configuration
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  async initialize() {
    try {
      const settings = await storage.getSiteSettings();
      
      if (!settings?.smtpEnabled || !settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPassword) {
        console.log("SMTP not configured - email functionality disabled");
        this.isConfigured = false;
        return false;
      }

      // Configure SMTP based on user settings and best practices
      const port = settings.smtpPort || 587;
      
      const config: any = {
        host: settings.smtpHost,
        port: port,
        secure: settings.smtpSecure === true && port === 465, // Only use secure=true for port 465
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPassword,
        },
      };

      // For port 587 or when secure is disabled, use STARTTLS
      if (port === 587 || !settings.smtpSecure) {
        config.secure = false;
        config.requireTLS = true;
        config.tls = {
          rejectUnauthorized: false
        };
      }

      // Provider-specific optimizations
      if (settings.smtpHost?.includes('gmail.com')) {
        config.service = 'gmail';
        config.secure = false;
        config.requireTLS = true;
      }

      if (settings.smtpHost?.includes('outlook.com') || settings.smtpHost?.includes('hotmail.com')) {
        config.secure = false;
        config.requireTLS = true;
      }

      console.log("Creating SMTP transport with config:", {
        host: config.host,
        port: config.port,
        secure: config.secure,
        service: config.service || 'custom'
      });

      this.transporter = nodemailer.createTransport(config);
      
      // Verify connection
      await this.transporter.verify();
      this.isConfigured = true;
      console.log("Email service initialized successfully");
      return true;
    } catch (error: any) {
      console.error("Email service initialization failed:", error.message);
      this.isConfigured = false;
      return false;
    }
  }

  async sendEmail(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
  }) {
    if (!this.isConfigured || !this.transporter) {
      // Try to reinitialize
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error("Email service not configured");
      }
    }

    const settings = await storage.getSiteSettings();
    const fromName = settings?.smtpFromName || settings?.siteName || "BAYG System";
    const fromEmail = settings?.smtpFromEmail || settings?.smtpUser;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    return await this.transporter!.sendMail(mailOptions);
  }

  async sendTestEmail(testEmail: string) {
    const settings = await storage.getSiteSettings();
    
    return await this.sendEmail({
      to: testEmail,
      subject: `Test Email from ${settings.siteName || "BAYG System"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; text-align: center;">📧 Email System Test</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Test Results:</h3>
            <ul style="color: #374151;">
              <li>✅ SMTP Connection: Successful</li>
              <li>✅ Authentication: Verified</li>
              <li>✅ Email Delivery: Completed</li>
            </ul>
          </div>

          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
            <p style="color: #065f46; margin: 0;">
              <strong>Success!</strong> Your email system is working correctly.
            </p>
          </div>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 14px;">
              Test sent at: ${new Date().toISOString()}<br>
              From: ${settings.siteName || "BAYG System"}
            </p>
          </div>
        </div>
      `,
      text: `Email System Test - Success! Your email system is working correctly. Test sent at: ${new Date().toISOString()}`,
    });
  }

  isReady() {
    return this.isConfigured;
  }
}

// Global email service instance
export const emailService = new EmailService();