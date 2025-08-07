import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Download, Upload, FileSpreadsheet, Package, Users, ShoppingCart } from "lucide-react";
import * as XLSX from "xlsx";

type DataType = "products" | "categories" | "users" | "orders";

export function DataImportExport() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDataType, setSelectedDataType] = useState<DataType>("products");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: string[];
  } | null>(null);

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
  });

  const exportData = async (dataType: DataType) => {
    try {
      let data: any[] = [];
      let filename = "";

      switch (dataType) {
        case "products":
          data = Array.isArray(products) ? products : [];
          filename = "products_export.xlsx";
          break;
        case "categories":
          data = Array.isArray(categories) ? categories : [];
          filename = "categories_export.xlsx";
          break;
        case "users":
          data = Array.isArray(users) ? users : [];
          filename = "users_export.xlsx";
          break;
        case "orders":
          data = Array.isArray(orders) ? orders : [];
          filename = "orders_export.xlsx";
          break;
      }

      if (data.length === 0) {
        toast({
          title: "No Data",
          description: `No ${dataType} found to export`,
          variant: "destructive",
        });
        return;
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, dataType);

      // Generate Excel file and download
      XLSX.writeFile(wb, filename);

      toast({
        title: "Export Successful",
        description: `${data.length} ${dataType} exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResults(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        try {
          const row = jsonData[i] as any;
          
          switch (selectedDataType) {
            case "products":
              await apiRequest("/api/products", "POST", {
                name: row.name || "",
                description: row.description || "",
                price: row.price || "0",
                imageUrl: row.imageUrl || "",
                categoryId: row.categoryId || "",

                sku: row.sku || "",
                isActive: row.isActive !== false,
                isFeatured: row.isFeatured === true,
                productType: row.productType || "sale",
                rentalPeriod: row.rentalPeriod || "",
                rentalPrice: row.rentalPrice || "",
              });
              break;
            case "categories":
              await apiRequest("/api/categories", "POST", {
                name: row.name || "",
                description: row.description || "",
                imageUrl: row.imageUrl || "",
              });
              break;
            case "users":
              await apiRequest("/api/admin/users", "POST", {
                username: row.username || "",
                email: row.email || "",
                password: row.password || "defaultPassword123",
                firstName: row.firstName || "",
                lastName: row.lastName || "",
                isAdmin: row.isAdmin === true,
              });
              break;
          }
          successCount++;
        } catch (error: any) {
          errors.push(`Row ${i + 2}: ${error.message || "Import failed"}`);
        }

        setImportProgress(((i + 1) / jsonData.length) * 100);
      }

      setImportResults({ success: successCount, errors });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/${selectedDataType}`] });
      if (selectedDataType === "users") {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      }

      toast({
        title: "Import Completed",
        description: `Successfully imported ${successCount} ${selectedDataType}`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to process the Excel file",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const downloadTemplate = (dataType: DataType) => {
    let templateData: any[] = [];
    let filename = "";

    switch (dataType) {
      case "products":
        templateData = [
          {
            name: "Sample Product",
            description: "Sample product description",
            price: "29.99",
            imageUrl: "https://example.com/image.jpg",
            categoryId: "category-id-here",

            sku: "SAMPLE-001",
            isActive: true,
            isFeatured: false,
            productType: "sale",
            rentalPeriod: "",
            rentalPrice: "",
          },
        ];
        filename = "products_template.xlsx";
        break;
      case "categories":
        templateData = [
          {
            name: "Sample Category",
            description: "Sample category description",
            imageUrl: "https://example.com/image.jpg",
          },
        ];
        filename = "categories_template.xlsx";
        break;
      case "users":
        templateData = [
          {
            username: "sampleuser",
            email: "user@example.com",
            password: "defaultPassword123",
            firstName: "John",
            lastName: "Doe",
            isAdmin: false,
          },
        ];
        filename = "users_template.xlsx";
        break;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, filename);

    toast({
      title: "Template Downloaded",
      description: `${dataType} template downloaded successfully`,
    });
  };

  const getDataTypeIcon = (type: DataType) => {
    switch (type) {
      case "products":
        return <Package className="h-4 w-4" />;
      case "categories":
        return <ShoppingCart className="h-4 w-4" />;
      case "users":
        return <Users className="h-4 w-4" />;
      case "orders":
        return <FileSpreadsheet className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Data Import & Export
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export Data</TabsTrigger>
            <TabsTrigger value="import">Import Data</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="export-type">Select Data Type to Export</Label>
                <Select value={selectedDataType} onValueChange={(value: DataType) => setSelectedDataType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="products">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Products
                      </div>
                    </SelectItem>
                    <SelectItem value="categories">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Categories
                      </div>
                    </SelectItem>
                    <SelectItem value="users">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Users
                      </div>
                    </SelectItem>
                    <SelectItem value="orders">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Orders
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => exportData(selectedDataType)}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export {selectedDataType}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="import-type">Select Data Type to Import</Label>
                <Select value={selectedDataType} onValueChange={(value: DataType) => setSelectedDataType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="products">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Products
                      </div>
                    </SelectItem>
                    <SelectItem value="categories">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Categories
                      </div>
                    </SelectItem>
                    <SelectItem value="users">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Users
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => downloadTemplate(selectedDataType)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Excel File
                </Button>
              </div>

              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Importing {selectedDataType}...</span>
                  </div>
                  <Progress value={importProgress} className="w-full" />
                </div>
              )}

              {importResults && (
                <Alert>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>Import completed: {importResults.success} items imported successfully</p>
                      {importResults.errors.length > 0 && (
                        <div>
                          <p className="font-semibold text-red-600">Errors:</p>
                          <ul className="text-sm text-red-600 list-disc list-inside">
                            {importResults.errors.slice(0, 5).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {importResults.errors.length > 5 && (
                              <li>... and {importResults.errors.length - 5} more errors</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}