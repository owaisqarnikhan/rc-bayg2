import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, type InsertProduct, type Product, type Category, type UnitOfMeasure } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash2, ShoppingCart, Package, Upload } from "lucide-react";
import { z } from "zod";
import { createImageUploadHandler } from "@/lib/imageUpload";

// Enhanced product schema with product type and proper number validation
const enhancedProductSchema = insertProductSchema.extend({
  productType: z.enum(["sale", "rental"]).default("sale"),
}).transform((data) => ({
  ...data,
  // Convert string prices to numbers, handling empty strings
  price: data.price === "" ? "0" : data.price,
}));

type EnhancedInsertProduct = z.infer<typeof enhancedProductSchema>;

export function ProductManager() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: unitsOfMeasure } = useQuery<UnitOfMeasure[]>({
    queryKey: ["/api/units-of-measure"],
  });

  const form = useForm<EnhancedInsertProduct>({
    resolver: zodResolver(enhancedProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "0",
      imageUrl: "",
      categoryId: "",
      sku: "",
      unitOfMeasure: "piece",
      isActive: true,
      isFeatured: false,
      productType: "sale",
    },
  });

  const productType = form.watch("productType");

  const handleImageUpload = createImageUploadHandler(
    (url) => form.setValue("imageUrl", url),
    setIsUploading
  );

  const createMutation = useMutation({
    mutationFn: async (data: EnhancedInsertProduct) => {
      // Clean the data before sending to server
      const cleanData = {
        ...data,
        price: data.price || "0",
      };
      const response = await apiRequest("/api/products", "POST", cleanData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsAddOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Product created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EnhancedInsertProduct }) => {
      // Clean the data before sending to server
      const cleanData = {
        ...data,
        price: data.price || "0",
      };
      const response = await apiRequest(`/api/products/${id}`, "PUT", cleanData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingProduct(null);
      form.reset();
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest(`/api/products/${productId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EnhancedInsertProduct) => {
    console.log("Product form submitted with data:", data);
    console.log("Product form errors:", form.formState.errors);
    
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      imageUrl: product.imageUrl || "",
      categoryId: product.categoryId || "",
      sku: product.sku || "",
      unitOfMeasure: product.unitOfMeasure || "piece",
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      productType: (product as any).productType || "sale",
    });
  };

  const handleCloseDialog = () => {
    setIsAddOpen(false);
    setEditingProduct(null);
    form.reset();
  };

  if (productsLoading) {
    return <div>Loading products...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Product Management
          </CardTitle>
          <Button onClick={() => {
            console.log("Add Product button clicked");
            setIsAddOpen(true);
          }} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Product Dialog */}
        <Dialog open={isAddOpen || !!editingProduct} onOpenChange={handleCloseDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct ? "Update the product information below." : "Fill in the details to create a new product."}
                </DialogDescription>  
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Product name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input placeholder="Product SKU" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Product description" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="productType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select product type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sale">Sale</SelectItem>
                              <SelectItem value="rental">Rental</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {productType === "rental" ? "Rental Price" : "Sale Price"}
                          </FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unitOfMeasure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit of Measure</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "piece"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {unitsOfMeasure?.map((unit) => (
                                <SelectItem key={unit.id} value={unit.name}>
                                  {unit.name} ({unit.abbreviation})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>



                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Image</FormLabel>
                        <div className="space-y-2">
                          <FormControl>
                            <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ""} />
                          </FormControl>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('product-image-upload')?.click()}
                              disabled={isUploading}
                              className="flex items-center gap-2"
                            >
                              <Upload className="h-4 w-4" />
                              {isUploading ? "Uploading..." : "Upload Image"}
                            </Button>
                            <input
                              id="product-image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                            />
                          </div>
                          {field.value && (
                            <img
                              src={field.value}
                              alt="Product preview"
                              className="w-24 h-24 object-cover rounded border"
                            />
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Active</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isFeatured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Featured</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingProduct ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
        </Dialog>
        <div className="grid gap-4">
          {products?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No products found. Create your first product to get started.
            </p>
          ) : (
            products?.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{product.name}</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {(product as any).productType || "sale"}
                    </span>
                    {product.isFeatured && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                    {!product.isActive && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(product as any).productType === "rental" ? (
                      <>
                        Active Price: ${(product as any).rentalPrice || product.price} / {(product as any).rentalPeriod || "period"} | Sale Price: ${product.price}
                      </>
                    ) : (
                      <>
                        Price: ${product.price}
                      </>
                    )} | SKU: {product.sku}
                  </p>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(product.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}