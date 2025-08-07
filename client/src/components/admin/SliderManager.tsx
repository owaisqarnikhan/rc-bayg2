import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSliderImageSchema } from "@shared/schema";
import { Plus, Upload, Edit, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";
import type { SliderImage, InsertSliderImage } from "@shared/schema";

export function SliderManager() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<SliderImage | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: sliderImages, isLoading } = useQuery({
    queryKey: ["/api/slider-images"],
  });

  const form = useForm<InsertSliderImage>({
    resolver: zodResolver(insertSliderImageSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  const createSliderMutation = useMutation({
    mutationFn: async (data: InsertSliderImage) => {
      const res = await apiRequest("/api/slider-images", "POST", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slider-images"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Slider image added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add slider image",
        variant: "destructive",
      });
    },
  });

  const updateSliderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SliderImage> }) => {
      const res = await apiRequest(`/api/slider-images/${id}`, "PATCH", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slider-images"] });
      setEditingSlider(null);
      toast({
        title: "Success",
        description: "Slider image updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update slider image",
        variant: "destructive",
      });
    },
  });

  const deleteSliderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(`/api/slider-images/${id}`, "DELETE");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slider-images"] });
      toast({
        title: "Success",
        description: "Slider image deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete slider image",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        form.setValue('imageUrl', data.imageUrl);
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = (data: InsertSliderImage) => {
    if (editingSlider) {
      updateSliderMutation.mutate({ id: editingSlider.id, data });
    } else {
      createSliderMutation.mutate(data);
    }
  };

  const toggleSliderStatus = (slider: SliderImage) => {
    updateSliderMutation.mutate({
      id: slider.id,
      data: { isActive: !slider.isActive }
    });
  };

  const handleEdit = (slider: SliderImage) => {
    setEditingSlider(slider);
    form.reset({
      title: slider.title || "",
      description: slider.description || "",
      imageUrl: slider.imageUrl,
      isActive: slider.isActive,
      sortOrder: slider.sortOrder,
    });
    setIsAddDialogOpen(true);
  };

  const handleClose = () => {
    setIsAddDialogOpen(false);
    setEditingSlider(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Slider Images</h2>
          <p className="text-gray-600">Manage homepage slider images</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSlider(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Slider Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSlider ? "Edit" : "Add"} Slider Image</DialogTitle>
              <DialogDescription>
                {editingSlider ? "Update" : "Create a new"} slider image for the homepage.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter slide title" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter slide description" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image *</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input placeholder="Image URL" {...field} />
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id="slider-image-upload"
                            />
                            <Label htmlFor="slider-image-upload" className="cursor-pointer">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploadingImage}
                                asChild
                              >
                                <span>
                                  <Upload className="h-4 w-4 mr-2" />
                                  {uploadingImage ? "Uploading..." : "Upload Image"}
                                </span>
                              </Button>
                            </Label>
                          </div>
                          {field.value && (
                            <img
                              src={field.value}
                              alt="Preview"
                              className="w-full h-32 object-cover rounded border"
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Active</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createSliderMutation.isPending || updateSliderMutation.isPending}
                    className="flex-1"
                  >
                    {createSliderMutation.isPending || updateSliderMutation.isPending
                      ? "Saving..."
                      : editingSlider
                      ? "Update"
                      : "Add"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Slider Images List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-20 w-32" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : Array.isArray(sliderImages) && sliderImages.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No slider images found. Add your first slider image to get started.</p>
            </CardContent>
          </Card>
        ) : (
          Array.isArray(sliderImages) ? sliderImages.map((slider: SliderImage) => (
            <Card key={slider.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="cursor-move">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                  </div>
                  <img
                    src={slider.imageUrl}
                    alt={slider.title || "Slider image"}
                    className="h-20 w-32 object-cover rounded border"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {slider.title || "Untitled"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {slider.description || "No description"}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">Order: {slider.sortOrder}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        slider.isActive 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {slider.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSliderStatus(slider)}
                      disabled={updateSliderMutation.isPending}
                    >
                      {slider.isActive ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(slider)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteSliderMutation.mutate(slider.id)}
                      disabled={deleteSliderMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : null
        )}
      </div>
    </div>
  );
}