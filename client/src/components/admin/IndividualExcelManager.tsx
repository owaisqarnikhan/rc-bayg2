import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Download, Upload, FileSpreadsheet, Database, Users, Package, ShoppingCart, Settings, Image, Ruler } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function IndividualExcelManager() {
  const [importFiles, setImportFiles] = useState<{ [key: string]: File | null }>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const { toast } = useToast();

  const sheetTypes = [
    { 
      id: 'products', 
      name: 'Products', 
      icon: Package,
      description: 'Product catalog with prices and details',
      fields: 'Name, Description, Price, SKU, Unit of Measure, Category ID, Image URL, etc.'
    },
    { 
      id: 'categories', 
      name: 'Categories', 
      icon: Database,
      description: 'Product categories and organizational structure',
      fields: 'Name, Description, Image URL'
    },
    { 
      id: 'users', 
      name: 'Users', 
      icon: Users,
      description: 'User accounts and customer information',
      fields: 'Username, Email, First Name, Last Name, Is Admin'
    },
    { 
      id: 'orders', 
      name: 'Orders', 
      icon: ShoppingCart,
      description: 'Customer orders and transaction history',
      fields: 'User ID, Status, Total Amount, Shipping Address, Payment Method'
    },
    { 
      id: 'order-items', 
      name: 'Order Items', 
      icon: FileSpreadsheet,
      description: 'Individual items within each order',
      fields: 'Order ID, Product ID, Quantity, Price'
    },
    { 
      id: 'units', 
      name: 'Units of Measure', 
      icon: Ruler,
      description: 'Measurement units for products',
      fields: 'Name, Abbreviation, Is Active'
    },
    { 
      id: 'site-settings', 
      name: 'Site Settings', 
      icon: Settings,
      description: 'Website configuration and preferences',
      fields: 'Site Name, Logos, Footer Content, Social Links'
    },
    { 
      id: 'slider-images', 
      name: 'Slider Images', 
      icon: Image,
      description: 'Homepage slider and promotional images',
      fields: 'Title, Image URL, Link URL, Is Active, Display Order'
    }
  ];

  const exportMutation = useMutation({
    mutationFn: async (sheetType: string) => {
      const response = await fetch(`/api/admin/export/excel/${sheetType}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to export ${sheetType}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${sheetType}-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: (_, sheetType) => {
      toast({
        title: "Export Successful",
        description: `${sheetType} data exported successfully`,
      });
    },
    onError: (error: any, sheetType) => {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: `Failed to export ${sheetType}: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async ({ sheetType, file }: { sheetType: string; file: File }) => {
      const formData = new FormData();
      formData.append('excel', file);
      
      const response = await fetch(`/api/admin/import/excel/${sheetType}`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Import failed');
      }
      
      return response.json();
    },
    onSuccess: (data, { sheetType }) => {
      toast({
        title: "Import Successful",
        description: data.message || `${sheetType} data imported successfully`,
      });
      
      // Clear the file input
      setImportFiles(prev => ({ ...prev, [sheetType]: null }));
      if (fileInputRefs.current[sheetType]) {
        fileInputRefs.current[sheetType]!.value = '';
      }
      
      // Invalidate relevant caches to refresh data in admin sections
      if (sheetType === 'categories') {
        queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      } else if (sheetType === 'products') {
        queryClient.invalidateQueries({ queryKey: ['/api/products'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
        queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      } else if (sheetType === 'users') {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      } else if (sheetType === 'orders') {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      } else if (sheetType === 'order-items') {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      } else if (sheetType === 'units') {
        queryClient.invalidateQueries({ queryKey: ['/api/units-of-measure'] });
      } else if (sheetType === 'site-settings') {
        queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      } else if (sheetType === 'slider-images') {
        queryClient.invalidateQueries({ queryKey: ['/api/slider-images'] });
        queryClient.invalidateQueries({ queryKey: ['/api/slider-images/active'] });
      }
    },
    onError: (error: any, { sheetType }) => {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: `Failed to import ${sheetType}: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (sheetType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImportFiles(prev => ({ ...prev, [sheetType]: file || null }));
  };

  const handleExport = (sheetType: string) => {
    exportMutation.mutate(sheetType);
  };

  const handleImport = (sheetType: string) => {
    const file = importFiles[sheetType];
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select an Excel file to import",
        variant: "destructive",
      });
      return;
    }
    importMutation.mutate({ sheetType, file });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <FileSpreadsheet className="h-6 w-6 text-green-600" />
        <h2 className="text-2xl font-bold">Individual Excel Management</h2>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">✓ Individual Sheet Control</h3>
        <p className="text-sm text-blue-700">Export and import each data type independently to avoid foreign key conflicts and gain precise control over your data management.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sheetTypes.map((sheet) => {
          const Icon = sheet.icon;
          const isExporting = exportMutation.isPending;
          const isImporting = importMutation.isPending;
          const selectedFile = importFiles[sheet.id];

          return (
            <Card key={sheet.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Icon className="h-5 w-5 text-blue-600" />
                  <span>{sheet.name}</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  {sheet.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                <div className="text-xs text-muted-foreground">
                  <strong>Fields:</strong> {sheet.fields}
                </div>

                {/* Export Section */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Export</Label>
                  <Button
                    onClick={() => handleExport(sheet.id)}
                    disabled={isExporting}
                    size="sm"
                    className="w-full flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>{isExporting ? "Exporting..." : "Export to Excel"}</span>
                  </Button>
                </div>

                {/* Import Section */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Import</Label>
                  <Input
                    ref={(el) => fileInputRefs.current[sheet.id] = el}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => handleFileChange(sheet.id, e)}
                    className="text-xs"
                  />
                  {selectedFile && (
                    <div className="p-2 bg-green-50 rounded text-xs">
                      <span className="font-medium text-green-900">Selected:</span>
                      <span className="text-green-700 ml-1">{selectedFile.name}</span>
                    </div>
                  )}
                  <Button
                    onClick={() => handleImport(sheet.id)}
                    disabled={!selectedFile || isImporting}
                    size="sm"
                    variant="outline"
                    className="w-full flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{isImporting ? "Importing..." : "Import from Excel"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <h3 className="font-medium text-amber-900 mb-2">💡 Tips for Individual Management</h3>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Export individual sheets to get exact field structures</li>
          <li>• Import categories and units first, then products that reference them</li>
          <li>• Import users before orders, and orders before order items</li>
          <li>• Missing columns will use default values automatically</li>
          <li>• Empty or missing IDs will be auto-generated by the database</li>
        </ul>
      </div>
    </div>
  );
}