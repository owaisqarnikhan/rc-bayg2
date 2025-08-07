import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Database, AlertTriangle, FileDown, FileUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DatabaseManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importFile, setImportFile] = useState<File | null>(null);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/database/export", {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to export database");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.downloadUrl) {
        // Create a download link
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Export Successful",
          description: "Database has been exported and downloaded successfully.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export database",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('database', file);
      
      const response = await fetch("/api/admin/database/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to import database");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Import Successful",
        description: "Database has been imported successfully. The page will refresh to show updated data.",
      });
      
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import database",
        variant: "destructive",
      });
    },
  });

  const handleImport = () => {
    if (!importFile) {
      toast({
        title: "No File Selected",
        description: "Please select a database file to import.",
        variant: "destructive",
      });
      return;
    }

    if (!importFile.name.endsWith('.sql')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid SQL database export file.",
        variant: "destructive",
      });
      return;
    }

    importMutation.mutate(importFile);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Database className="h-5 w-5 text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-900">Database Management</h2>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Database operations affect your entire store data. 
          Always create a backup before importing data. Importing will replace existing products and categories.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Database */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileDown className="h-5 w-5 text-green-600" />
              <span>Export Database</span>
            </CardTitle>
            <CardDescription>
              Download a complete backup of your store data including products, categories, orders, and settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>The SQL export will include:</p>
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li>All products and categories with proper SQL INSERT statements</li>
                  <li>Site settings with UPDATE statements (passwords excluded)</li>
                  <li>Compatible with PostgreSQL database format</li>
                  <li>Timestamped backup with version information</li>
                </ul>
              </div>
              
              <Button 
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
                className="w-full flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>{exportMutation.isPending ? "Exporting..." : "Export Database"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Database */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileUp className="h-5 w-5 text-orange-600" />
              <span>Import Database</span>
            </CardTitle>
            <CardDescription>
              Restore your store data from a previous SQL export file. This will replace existing data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="database-file">Select Database File</Label>
                <Input
                  id="database-file"
                  type="file"
                  accept=".sql"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Only SQL export files are accepted
                </p>
              </div>

              <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p className="font-medium">⚠️ Warning:</p>
                <p>Importing will replace your current products and categories. User accounts and sensitive data are preserved for security.</p>
              </div>
              
              <Button 
                onClick={handleImport}
                disabled={importMutation.isPending || !importFile}
                className="w-full flex items-center space-x-2"
                variant={importFile ? "default" : "secondary"}
              >
                <Upload className="h-4 w-4" />
                <span>{importMutation.isPending ? "Importing..." : "Import Database"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2 text-green-700">✅ Do:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Export regularly for backups</li>
                <li>• Test imports on development first</li>
                <li>• Verify file integrity before importing</li>
                <li>• Keep multiple backup versions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-red-700">❌ Don't:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Import untrusted database files</li>
                <li>• Skip backups before major changes</li>
                <li>• Import during high traffic periods</li>
                <li>• Edit export files manually</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}