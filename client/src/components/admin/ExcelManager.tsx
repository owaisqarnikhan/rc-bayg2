import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  AlertTriangle, 
  Package, 
  Users, 
  FolderOpen,
  Database
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IndividualExcelManager } from "./IndividualExcelManager";

export default function ExcelManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/export/excel/bulk", {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to export Excel file");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const filename = `data-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Export Successful",
        description: "Excel file has been exported and downloaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export Excel file",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('excel', file);
      
      const response = await fetch("/api/admin/import/excel", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to import Excel file");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Import Successful",
        description: data.message || "Excel file has been imported successfully.",
      });
      setImportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import Excel file",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImportFile(file || null);
  };

  const handleImport = () => {
    if (!importFile) {
      toast({
        title: "No File Selected",
        description: "Please select an Excel file to import.",
        variant: "destructive",
      });
      return;
    }

    if (!importFile.name.toLowerCase().endsWith('.xlsx') && !importFile.name.toLowerCase().endsWith('.xls')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid Excel file (.xlsx or .xls).",
        variant: "destructive",
      });
      return;
    }

    importMutation.mutate(importFile);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <FileSpreadsheet className="h-5 w-5 text-green-600" />
        <h2 className="text-2xl font-bold text-slate-900">Excel Data Management</h2>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Comprehensive Excel Data Management:</strong> Export all your e-commerce data to Excel for analysis or import bulk data from Excel files. 
          The Excel workbook contains 8 separate sheets covering all data types: Products (with units of measure), Categories, Users, Orders, Order Items, Units of Measure, Site Settings, and Slider Images. Perfect for data backups, analysis, and bulk operations.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual" className="flex items-center space-x-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Individual Sheets</span>
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Bulk Operations</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="individual" className="space-y-6">
          <IndividualExcelManager />
        </TabsContent>
        
        <TabsContent value="bulk" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Excel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-green-600" />
              <span>Export to Excel</span>
            </CardTitle>
            <CardDescription>
              Download all your store data in a comprehensive Excel workbook format.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>The Excel export includes 8 comprehensive data sheets:</p>
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <Package className="h-3 w-3" />
                    <strong>Products:</strong> All product data including prices, units of measure, categories
                  </li>
                  <li className="flex items-center gap-2">
                    <FolderOpen className="h-3 w-3" />
                    <strong>Categories:</strong> All category information and descriptions
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    <strong>Users:</strong> User accounts (passwords excluded for security)
                  </li>
                  <li className="flex items-center gap-2">
                    <Package className="h-3 w-3" />
                    <strong>Units of Measure:</strong> All measurement units (kg, liter, piece, etc.)
                  </li>
                  <li className="flex items-center gap-2">
                    <Package className="h-3 w-3" />
                    <strong>Orders:</strong> Complete order history and status information
                  </li>
                  <li className="flex items-center gap-2">
                    <Package className="h-3 w-3" />
                    <strong>Order Items:</strong> Individual items within each order
                  </li>
                  <li className="flex items-center gap-2">
                    <Package className="h-3 w-3" />
                    <strong>Site Settings:</strong> All website configuration and customization settings
                  </li>
                  <li className="flex items-center gap-2">
                    <Package className="h-3 w-3" />
                    <strong>Slider Images:</strong> Homepage slider configuration and image data
                  </li>
                </ul>
              </div>
              
              <Button 
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
                className="w-full flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>{exportMutation.isPending ? "Exporting..." : "Export to Excel"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Excel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-blue-600" />
              <span>Import from Excel</span>
            </CardTitle>
            <CardDescription>
              Bulk import products, categories, and users from an Excel file. This will replace existing data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="excel-file">Select Excel File</Label>
                <Input
                  id="excel-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Only Excel files (.xlsx, .xls) are accepted
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                <p><strong>Excel file structure expected (8 sheets):</strong></p>
                <ul className="list-disc ml-4 mt-1 space-y-1 text-xs">
                  <li>Sheet 1: "Products" - Name, Description, Price, Stock, SKU, Unit of Measure, Category ID, etc.</li>
                  <li>Sheet 2: "Categories" - Name, Description, Image URL</li>
                  <li>Sheet 3: "Users" - Username, Email, First Name, Last Name, Is Admin</li>
                  <li>Sheet 4: "Units of Measure" - Name, Abbreviation, Is Active</li>
                  <li>Sheet 5: "Orders" - User ID, Status, Total Amount, Shipping Address, Payment Method</li>
                  <li>Sheet 6: "Order Items" - Order ID, Product ID, Quantity, Price</li>
                  <li>Sheet 7: "Site Settings" - All website configuration settings</li>
                  <li>Sheet 8: "Slider Images" - Title, Image URL, Link URL, Is Active, Display Order</li>
                </ul>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-900">✓ Flexible Import:</p>
                <p className="text-xs text-green-700">Excel sheets can have any combination of fields. Missing columns will use default values, and missing IDs will be auto-generated by the database.</p>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm font-medium text-amber-900">⚠️ Important Notes:</p>
                <ul className="text-xs text-amber-700 mt-1 space-y-1">
                  <li>• Import will replace existing data in each sheet</li>
                  <li>• User passwords will not be imported for security</li>
                  <li>• New users get random passwords that need reset</li>
                </ul>
              </div>

              {importFile && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">Selected File:</p>
                  <p className="text-sm text-blue-700">{importFile.name}</p>
                  <p className="text-xs text-blue-600">Size: {(importFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}

              <Button 
                onClick={handleImport}
                disabled={!importFile || importMutation.isPending}
                className="w-full flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>{importMutation.isPending ? "Importing..." : "Import Excel Data"}</span>
              </Button>

              {importMutation.isPending && (
                <div className="text-sm text-muted-foreground">
                  <p>Processing Excel file and importing data...</p>
                  <p className="text-xs">This may take a few moments for large files.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}