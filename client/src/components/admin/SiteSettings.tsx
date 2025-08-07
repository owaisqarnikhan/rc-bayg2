import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSiteSettingsSchema, type InsertSiteSettings, type SiteSettings } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Palette, Mail, Upload, Save, Monitor, Loader2, CheckCircle, ShoppingCart, Bell } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { themes, applyTheme, type ThemeName } from "@/lib/themes";

export function SiteSettings() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [smtpStatus, setSmtpStatus] = useState<any>(null);
  


  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });

  const form = useForm<InsertSiteSettings>({
    resolver: zodResolver(insertSiteSettingsSchema),
    defaultValues: {
      siteName: settings?.siteName || "BAYG",
      browserTabTitle: settings?.browserTabTitle || "BAYG",
      logoUrl: settings?.logoUrl || "",
      faviconUrl: settings?.faviconUrl || "",
      contactEmail: settings?.contactEmail || "",
      supportEmail: settings?.supportEmail || "",
      adminEmail: settings?.adminEmail || "",
      contactPhone: settings?.contactPhone || "",
      contactAddress: settings?.contactAddress || "",
      businessHours: settings?.businessHours || "",
      officeHoursTitle: settings?.officeHoursTitle || "Office Hours",
      paymentMethodsImage: settings?.paymentMethodsImage || "",
      footerLeftImage: settings?.footerLeftImage || "",
      footerLeftImageWidth: settings?.footerLeftImageWidth || 200,
      paymentMethodsImageWidth: settings?.paymentMethodsImageWidth || 250,
      loginPageLogoWidth: settings?.loginPageLogoWidth || 80,
      headerLogoHeight: settings?.headerLogoHeight || 64,
      theme: settings?.theme || "default",
      textColor: settings?.textColor || "#1e293b",
      headerTextColor: settings?.headerTextColor || "#64748b",
      tabTextColor: settings?.tabTextColor || "#2563eb", 
      tabActiveTextColor: settings?.tabActiveTextColor || "#2563eb",

      orderConfirmationTemplate: settings?.orderConfirmationTemplate || "",
      footerDescription: settings?.footerDescription || "",
      footerBackgroundUrl: settings?.footerBackgroundUrl || "/uploads/footer-background.png",
      quickLinksTitle: settings?.quickLinksTitle || "Quick Links",
      quickLinkHome: settings?.quickLinkHome || "Home",
      quickLinkProducts: settings?.quickLinkProducts || "Products",
      quickLinkAbout: settings?.quickLinkAbout || "About",
      quickLinkContact: settings?.quickLinkContact || "Contact",
      socialTitle: settings?.socialTitle || "Follow Us",
      socialFacebook: settings?.socialFacebook || "",
      socialTwitter: settings?.socialTwitter || "",
      socialInstagram: settings?.socialInstagram || "",
      socialLinkedin: settings?.socialLinkedin || "",
      copyrightText: settings?.copyrightText || "",
      additionalFooterText: settings?.additionalFooterText || "",
      // SMTP Email Configuration
      smtpEnabled: settings?.smtpEnabled || false,
      smtpHost: settings?.smtpHost || "",
      smtpPort: settings?.smtpPort || 587,
      smtpSecure: settings?.smtpSecure || false,
      smtpUser: settings?.smtpUser || "",
      smtpPassword: settings?.smtpPassword || "",
      smtpFromName: settings?.smtpFromName || "BAYG - Bahrain Asian Youth Games 2025",
      smtpFromEmail: settings?.smtpFromEmail || "",
      // Login Page Settings
      loginPageLogo: settings?.loginPageLogo || "",
      loginPageTitle: settings?.loginPageTitle || "BAYG Store",
      loginPageAccessMessage: settings?.loginPageAccessMessage || "Need an account? Contact your store administrator for access credentials.",
      loginPageHeading1: settings?.loginPageHeading1 || "Welcome Back",
      loginPageHeading2: settings?.loginPageHeading2 || "Sign in to your account",
      loginPageHeading3: settings?.loginPageHeading3 || "Access your dashboard",
    },
  });

  // Update form when settings load - use useEffect to avoid infinite renders
  React.useEffect(() => {
    if (settings) {
      form.reset({
        siteName: settings.siteName,
        logoUrl: settings.logoUrl || "",
        faviconUrl: settings.faviconUrl || "",
        contactEmail: settings.contactEmail || "",
        supportEmail: settings.supportEmail || "",
        adminEmail: settings.adminEmail || "",
        contactPhone: settings.contactPhone || "",
        contactAddress: settings.contactAddress || "",
        businessHours: settings.businessHours || "",
        officeHoursTitle: settings.officeHoursTitle || "Office Hours",
        paymentMethodsImage: settings.paymentMethodsImage || "",
        footerLeftImage: settings.footerLeftImage || "",
        footerLeftImageWidth: settings.footerLeftImageWidth || 200,
        paymentMethodsImageWidth: settings.paymentMethodsImageWidth || 250,
        theme: settings.theme || "default",
        textColor: settings.textColor || "#1e293b",
        headerTextColor: settings.headerTextColor || "#64748b",
        tabTextColor: settings.tabTextColor || "#2563eb",
        tabActiveTextColor: settings.tabActiveTextColor || "#2563eb",

        orderConfirmationTemplate: settings.orderConfirmationTemplate || "",
        footerDescription: settings.footerDescription || "",
        footerBackgroundUrl: settings.footerBackgroundUrl || "/uploads/footer-background.png",
        quickLinksTitle: settings.quickLinksTitle || "Quick Links",
        quickLinkHome: settings.quickLinkHome || "Home",
        quickLinkProducts: settings.quickLinkProducts || "Products",
        quickLinkAbout: settings.quickLinkAbout || "About",
        quickLinkContact: settings.quickLinkContact || "Contact",
        socialTitle: settings.socialTitle || "Follow Us",
        socialFacebook: settings.socialFacebook || "",
        socialTwitter: settings.socialTwitter || "",
        socialInstagram: settings.socialInstagram || "",
        socialLinkedin: settings.socialLinkedin || "",
        copyrightText: settings.copyrightText || "",
        additionalFooterText: settings.additionalFooterText || "",
        // SMTP Email Configuration
        smtpEnabled: settings.smtpEnabled || false,
        smtpHost: settings.smtpHost || "",
        smtpPort: settings.smtpPort || 587,
        smtpSecure: settings.smtpSecure || false,
        smtpUser: settings.smtpUser || "",
        smtpPassword: settings.smtpPassword || "",
        smtpFromName: settings.smtpFromName || "BAYG - Bahrain Asian Youth Games 2025",
        smtpFromEmail: settings.smtpFromEmail || "",
        // Login Page Settings
        loginPageLogo: settings.loginPageLogo || "",
        loginPageTitle: settings.loginPageTitle || "InnovanceOrbit Store",
        loginPageAccessMessage: settings.loginPageAccessMessage || "Need an account? Contact your store administrator for access credentials.",
        loginPageHeading1: settings.loginPageHeading1 || "Welcome Back",
        loginPageHeading2: settings.loginPageHeading2 || "Sign in to your account",
        loginPageHeading3: settings.loginPageHeading3 || "Access your dashboard",
        loginPageLogoWidth: settings.loginPageLogoWidth || 80,
        headerLogoHeight: settings.headerLogoHeight || 64,
      });
      
      // Apply the current theme on load
      if (settings.theme) {
        applyTheme(settings.theme as ThemeName, {
          headerTextColor: settings.headerTextColor || undefined,
          tabTextColor: settings.tabTextColor || undefined,
          tabActiveTextColor: settings.tabActiveTextColor || undefined,

        });
      }
    }
  }, [settings, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: InsertSiteSettings) => {
      const response = await apiRequest("/api/settings", "PUT", data);
      return response.json();
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      
      // Apply the theme immediately after successful save
      if (variables.theme) {
        applyTheme(variables.theme as ThemeName, {
          headerTextColor: variables.headerTextColor || undefined,
          tabTextColor: variables.tabTextColor || undefined,
          tabActiveTextColor: variables.tabActiveTextColor || undefined,

        });
      }
      
      toast({
        title: "Success",
        description: "Site settings and theme updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      form.setValue("logoUrl", data.imageUrl);
      
      toast({
        title: "Logo Uploaded",
        description: "Logo uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaymentMethodsUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      form.setValue("paymentMethodsImage", data.imageUrl);
      
      toast({
        title: "Payment Methods Image Uploaded",
        description: "Payment methods image uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload payment methods image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFooterLeftImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      form.setValue("footerLeftImage", data.imageUrl);
      
      toast({
        title: "Footer Image Uploaded",
        description: "Footer left image uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload footer image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type for favicon
    const validTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/gif', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload a valid favicon file (.ico, .png, .gif, or .jpg)",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      form.setValue("faviconUrl", data.imageUrl);

      // Update favicon immediately in the browser
      updateFavicon(data.imageUrl);
      
      toast({
        title: "Favicon Uploaded",
        description: "Favicon uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload favicon",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Function to update favicon in the browser
  const updateFavicon = (faviconUrl: string) => {
    const link = document.getElementById('favicon') as HTMLLinkElement;
    if (link) {
      link.href = faviconUrl;
    } else {
      // Create favicon link if it doesn't exist
      const newLink = document.createElement('link');
      newLink.id = 'favicon';
      newLink.rel = 'icon';
      newLink.type = 'image/x-icon';
      newLink.href = faviconUrl;
      document.head.appendChild(newLink);
    }
  };

  // Login Page Logo Upload Handler
  const handleLoginPageLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      form.setValue("loginPageLogo", data.imageUrl);
      
      toast({
        title: "Login Page Logo Uploaded",
        description: "Login page logo uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload login page logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Email functionality
  const handleTestEmail = async () => {
    if (!testEmailAddress) {
      toast({
        title: "Email Required",
        description: "Please enter an email address for testing.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingEmail(true);
    try {
      const response = await apiRequest("/api/admin/test-smtp", "POST", {
        testEmail: testEmailAddress,
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Test Email Sent!",
          description: result.message,
        });
      } else {
        toast({
          title: "Test Email Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Test Email Failed",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const checkSmtpStatus = async () => {
    try {
      const response = await apiRequest("/api/admin/smtp-status", "POST");
      const status = await response.json();
      setSmtpStatus(status);
    } catch (error) {
      console.error("Failed to check SMTP status:", error);
    }
  };

  // Check SMTP status on component mount
  React.useEffect(() => {
    checkSmtpStatus();
  }, []);

  // Update favicon when settings load or change
  React.useEffect(() => {
    if (settings?.faviconUrl) {
      updateFavicon(settings.faviconUrl);
    }
  }, [settings?.faviconUrl]);

  const onSubmit = (data: InsertSiteSettings) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Site Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="branding">
                  <Palette className="h-4 w-4 mr-2" />
                  Branding
                </TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="footer">Footer</TabsTrigger>
                <TabsTrigger value="login">
                  <Monitor className="h-4 w-4 mr-2" />
                  Login Page
                </TabsTrigger>
                <TabsTrigger value="email">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <FormField
                  control={form.control}
                  name="siteName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Name</FormLabel>
                      <FormControl>
                        <Input placeholder="BAYG" {...field} />
                      </FormControl>
                      <div className="text-sm text-muted-foreground">
                        This appears as the site name throughout the application
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="browserTabTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Browser Tab Title
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="BAYG" {...field} />
                      </FormControl>
                      <div className="text-sm text-muted-foreground">
                        This appears as the browser tab title
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label htmlFor="logo-upload">Site Logo</Label>
                  <div className="flex items-center gap-4">
                    {form.watch("logoUrl") && (
                      <img
                        src={form.watch("logoUrl") || ""}
                        alt="Site Logo"
                        className="h-12 w-auto border rounded"
                      />
                    )}
                    <div className="flex-1">
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("logo-upload")?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {isUploading ? "Uploading..." : "Upload Logo"}
                      </Button>
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL (Alternative)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/logo.png" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="headerLogoHeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Header Logo Height (px)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="64" 
                            {...field} 
                            value={field.value || 64}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 64)}
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Control the height of your logo in the navigation header
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favicon-upload">Site Favicon</Label>
                  <div className="flex items-center gap-4">
                    {form.watch("faviconUrl") && (
                      <img
                        src={form.watch("faviconUrl") || ""}
                        alt="Site Favicon"
                        className="h-8 w-8 border rounded"
                      />
                    )}
                    <div className="flex-1">
                      <input
                        id="favicon-upload"
                        type="file"
                        accept=".ico,.png,.gif,.jpg,.jpeg,image/*"
                        onChange={handleFaviconUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("favicon-upload")?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {isUploading ? "Uploading..." : "Upload Favicon"}
                      </Button>
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="faviconUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Favicon URL (Alternative)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/favicon.ico" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload a favicon (.ico, .png, .gif, or .jpg) for your site. Recommended size: 16x16 or 32x32 pixels.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="branding" className="space-y-4">
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme Preset</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          const selectedTheme = themes[value as ThemeName];
                          if (selectedTheme) {
                            // Update form colors when theme changes
                            form.setValue("textColor", selectedTheme.text);
                            
                            // Apply theme preview with current text colors
                            applyTheme(value as ThemeName, {
                              headerTextColor: form.getValues("headerTextColor") || "#ffffff",
                              tabTextColor: form.getValues("tabTextColor") || "#64748b", 
                              tabActiveTextColor: form.getValues("tabActiveTextColor") || "#2563eb",

                            });
                          }
                        }} 
                        value={field.value || "default"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a theme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(themes).map(([key, theme]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-4 h-4 rounded-full border-2 border-gray-300"
                                  style={{ backgroundColor: theme.primary }}
                                />
                                <div>
                                  <div className="font-medium">{theme.name}</div>
                                  <div className="text-xs text-muted-foreground">{theme.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Choose a predefined theme for your site's visual appearance
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-4">Text Colors</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="textColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Main Text Color</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "#1e293b"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select text color" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="#ffffff">White</SelectItem>
                              <SelectItem value="#f8fafc">Off White</SelectItem>
                              <SelectItem value="#e2e8f0">Light Gray</SelectItem>
                              <SelectItem value="#94a3b8">Medium Gray</SelectItem>
                              <SelectItem value="#64748b">Dark Gray</SelectItem>
                              <SelectItem value="#475569">Darker Gray</SelectItem>
                              <SelectItem value="#334155">Very Dark Gray</SelectItem>
                              <SelectItem value="#1e293b">Almost Black</SelectItem>
                              <SelectItem value="#000000">Black</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="headerTextColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Navigation Text Color</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "#64748b"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select header text color" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="#ffffff">White</SelectItem>
                              <SelectItem value="#f8fafc">Off White</SelectItem>
                              <SelectItem value="#e2e8f0">Light Gray</SelectItem>
                              <SelectItem value="#94a3b8">Medium Gray</SelectItem>
                              <SelectItem value="#64748b">Dark Gray</SelectItem>
                              <SelectItem value="#475569">Darker Gray</SelectItem>
                              <SelectItem value="#334155">Very Dark Gray</SelectItem>
                              <SelectItem value="#1e293b">Almost Black</SelectItem>
                              <SelectItem value="#000000">Black</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tabTextColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tab Text Color</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "#2563eb"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select tab text color" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="#ffffff">White</SelectItem>
                              <SelectItem value="#f8fafc">Off White</SelectItem>
                              <SelectItem value="#e2e8f0">Light Gray</SelectItem>
                              <SelectItem value="#94a3b8">Medium Gray</SelectItem>
                              <SelectItem value="#64748b">Dark Gray</SelectItem>
                              <SelectItem value="#475569">Darker Gray</SelectItem>
                              <SelectItem value="#334155">Very Dark Gray</SelectItem>
                              <SelectItem value="#1e293b">Almost Black</SelectItem>
                              <SelectItem value="#000000">Black</SelectItem>
                              <SelectItem value="#2563eb">Blue</SelectItem>
                              <SelectItem value="#1e40af">Dark Blue</SelectItem>
                              <SelectItem value="#3b82f6">Light Blue</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tabActiveTextColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Active Tab Text Color</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "#2563eb"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select active tab text color" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="#ffffff">White</SelectItem>
                              <SelectItem value="#f8fafc">Off White</SelectItem>
                              <SelectItem value="#e2e8f0">Light Gray</SelectItem>
                              <SelectItem value="#94a3b8">Medium Gray</SelectItem>
                              <SelectItem value="#64748b">Dark Gray</SelectItem>
                              <SelectItem value="#475569">Darker Gray</SelectItem>
                              <SelectItem value="#334155">Very Dark Gray</SelectItem>
                              <SelectItem value="#1e293b">Almost Black</SelectItem>
                              <SelectItem value="#000000">Black</SelectItem>
                              <SelectItem value="#2563eb">Blue</SelectItem>
                              <SelectItem value="#1e40af">Dark Blue</SelectItem>
                              <SelectItem value="#3b82f6">Light Blue</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>


              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input placeholder="contact@bayg.com" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supportEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support Email</FormLabel>
                      <FormControl>
                        <Input placeholder="support@bayg.com" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Email (for notifications)</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@bayg.com" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+973 1234 5678" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="123 Main Street, Manama, Bahrain" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Hours</FormLabel>
                      <FormControl>
                        <Input placeholder="Mon-Fri: 9:00 AM - 6:00 PM" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="officeHoursTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office Hours Section Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Office Hours" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="footer" className="space-y-4">
                <FormField
                  control={form.control}
                  name="footerDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Footer Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Your company description for the footer" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="copyrightText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Copyright Text</FormLabel>
                      <FormControl>
                        <Input placeholder="© 2025 InnovanceOrbit. All rights reserved." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalFooterText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Footer Text</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional text to display in footer" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Quick Links Section</h3>
                  <FormField
                    control={form.control}
                    name="quickLinksTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quick Links Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Quick Links" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quickLinkHome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Home Link Text</FormLabel>
                          <FormControl>
                            <Input placeholder="Home" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quickLinkProducts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Products Link Text</FormLabel>
                          <FormControl>
                            <Input placeholder="Products" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quickLinkAbout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>About Link Text</FormLabel>
                          <FormControl>
                            <Input placeholder="About" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quickLinkContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Link Text</FormLabel>
                          <FormControl>
                            <Input placeholder="Contact" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Social Media</h3>
                  <FormField
                    control={form.control}
                    name="socialTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Media Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Follow Us" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="socialFacebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://facebook.com/yourpage" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="socialTwitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://twitter.com/yourhandle" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="socialInstagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://instagram.com/yourhandle" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="socialLinkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://linkedin.com/company/yourcompany" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Footer Images</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="footer-left-upload">Footer Left Image</Label>
                    <div className="flex items-center gap-4">
                      {form.watch("footerLeftImage") && (
                        <img
                          src={form.watch("footerLeftImage") || ""}
                          alt="Footer Left"
                          className="h-12 w-auto border rounded"
                        />
                      )}
                      <div className="flex-1">
                        <input
                          id="footer-left-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFooterLeftImageUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("footer-left-upload")?.click()}
                          disabled={isUploading}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {isUploading ? "Uploading..." : "Upload Footer Image"}
                        </Button>
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="footerLeftImageWidth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Footer Left Image Width (px)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="200" 
                              {...field} 
                              value={field.value || 200}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 200)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment-methods-upload">Payment Methods Image</Label>
                    <div className="flex items-center gap-4">
                      {form.watch("paymentMethodsImage") && (
                        <img
                          src={form.watch("paymentMethodsImage") || ""}
                          alt="Payment Methods"
                          className="h-12 w-auto border rounded"
                        />
                      )}
                      <div className="flex-1">
                        <input
                          id="payment-methods-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePaymentMethodsUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("payment-methods-upload")?.click()}
                          disabled={isUploading}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {isUploading ? "Uploading..." : "Upload Payment Methods"}
                        </Button>
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="paymentMethodsImageWidth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Methods Image Width (px)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="250" 
                              {...field} 
                              value={field.value || 250}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 250)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="login" className="space-y-4">
                <FormField
                  control={form.control}
                  name="loginPageHeading1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login Page Heading 1</FormLabel>
                      <FormControl>
                        <Input placeholder="Welcome Back" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="loginPageHeading2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login Page Heading 2</FormLabel>
                      <FormControl>
                        <Input placeholder="Sign in to your account" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="loginPageHeading3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login Page Heading 3</FormLabel>
                      <FormControl>
                        <Input placeholder="Access your dashboard" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="loginPageTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login Page Title</FormLabel>
                      <FormControl>
                        <Input placeholder="InnovanceOrbit Store" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="loginPageAccessMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login Page Access Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Need an account? Contact your store administrator for access credentials." 
                          {...field} 
                          value={field.value || ""} 
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="loginPageLogo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login Page Logo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/login-logo.png" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Upload Login Page Logo</h3>
                    <div className="flex items-center space-x-2">
                      <input
                        id="login-page-logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLoginPageLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("login-page-logo-upload")?.click()}
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? "Uploading..." : "Upload Logo"}
                      </Button>
                    </div>
                  </div>
                  {form.watch("loginPageLogo") && (
                    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                      <div className="flex items-center space-x-4">
                        <img 
                          src={form.watch("loginPageLogo") || ""} 
                          alt="Login page logo preview" 
                          className="w-16 h-16 object-contain border rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Current Login Page Logo</p>
                          <p className="text-xs text-gray-500 break-all">{form.watch("loginPageLogo")}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="loginPageLogoWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login Page Logo Width (px)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="80" 
                          {...field} 
                          value={field.value || 80}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 80)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


              </TabsContent>

              <TabsContent value="email" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">SMTP Configuration</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure email settings for order notifications and confirmations
                      </p>
                    </div>
                    {smtpStatus && (
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        smtpStatus.configured && smtpStatus.enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {smtpStatus.configured && smtpStatus.enabled ? 'Configured' : 'Not Configured'}
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="smtpEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Email Notifications</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Send automated emails for order confirmations and updates
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="smtpHost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Host</FormLabel>
                          <FormControl>
                            <Input placeholder="smtp.gmail.com" {...field} value={field.value || ""} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Your email provider's SMTP server
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="smtpPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Port</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="587" 
                              {...field}
                              value={field.value || 587}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 587)}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Usually 587 for TLS or 465 for SSL
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="smtpSecure"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Use SSL/TLS</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Turn OFF for port 587 (most providers). Turn ON only for port 465.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="smtpUser"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Username</FormLabel>
                          <FormControl>
                            <Input placeholder="your-email@gmail.com" {...field} value={field.value || ""} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Your email address or username
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="smtpPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="App password or email password" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Use app password for Gmail/Outlook
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="smtpFromName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Name</FormLabel>
                          <FormControl>
                            <Input placeholder="BAYG - Bahrain Asian Youth Games 2025" {...field} value={field.value || ""} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Display name for outgoing emails
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="smtpFromEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Email</FormLabel>
                          <FormControl>
                            <Input placeholder="noreply@yourdomain.com" {...field} value={field.value || ""} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Email address for outgoing emails
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium mb-4">Email Testing</h4>
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <Label htmlFor="test-email">Test Email Address</Label>
                        <Input
                          id="test-email"
                          type="email"
                          placeholder="Enter email to test"
                          value={testEmailAddress}
                          onChange={(e) => setTestEmailAddress(e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTestEmail}
                        disabled={isTestingEmail || !testEmailAddress}
                        className="flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        {isTestingEmail ? "Sending..." : "Send Test Email"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Save your SMTP settings first, then test with a real email address
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-medium text-blue-900 mb-2">Email Setup Instructions</h4>
                    <div className="text-sm text-blue-800 space-y-2">
                      <div>
                        <p><strong>Gmail:</strong> smtp.gmail.com, port 587, SSL/TLS off</p>
                        <p className="text-xs">Use an App Password (not your regular password)</p>
                      </div>
                      <div>
                        <p><strong>Outlook/Hotmail:</strong> smtp-mail.outlook.com, port 587, SSL/TLS off</p>
                        <p className="text-xs">Regular password or App Password if 2FA is enabled</p>
                      </div>
                      <div>
                        <p><strong>Yahoo:</strong> smtp.mail.yahoo.com, port 587, SSL/TLS off</p>
                        <p className="text-xs">Must use an App Password (Yahoo requires it)</p>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <p className="font-medium">Common Issues:</p>
                        <ul className="text-xs list-disc list-inside space-y-1">
                          <li>Use port 587 with SSL/TLS disabled for most providers</li>
                          <li>Enable "Less secure app access" or use App Passwords</li>
                          <li>For Gmail: Generate App Password in Google Account settings</li>
                          <li>For Outlook: Use your Microsoft account password or App Password</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <div className="flex justify-end pt-6 border-t">
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </Tabs>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}