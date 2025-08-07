import { toast } from "@/hooks/use-toast";

export interface ImageUploadOptions {
  onUploadStart?: () => void;
  onUploadComplete?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
}

export async function uploadImage(
  file: File,
  options: ImageUploadOptions = {}
): Promise<string | null> {
  const { onUploadStart, onUploadComplete, onUploadError } = options;

  if (!file) {
    const error = "No file selected";
    onUploadError?.(error);
    toast({
      title: "Error",
      description: error,
      variant: "destructive",
    });
    return null;
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    const error = "Please select an image file";
    onUploadError?.(error);
    toast({
      title: "Error", 
      description: error,
      variant: "destructive",
    });
    return null;
  }

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    const error = "Image size must be less than 5MB";
    onUploadError?.(error);
    toast({
      title: "Error",
      description: error,
      variant: "destructive",
    });
    return null;
  }

  try {
    onUploadStart?.();

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Upload failed");
    }

    const data = await response.json();
    const imageUrl = data.imageUrl;

    onUploadComplete?.(imageUrl);
    toast({
      title: "Success",
      description: "Image uploaded successfully",
    });

    return imageUrl;
  } catch (error: any) {
    const errorMessage = error.message || "Failed to upload image";
    onUploadError?.(errorMessage);
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    return null;
  }
}

export function createImageUploadHandler(
  onImageUrlChange: (url: string) => void,
  setIsUploading?: (uploading: boolean) => void
) {
  return async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const imageUrl = await uploadImage(file, {
      onUploadStart: () => setIsUploading?.(true),
      onUploadComplete: (url) => {
        onImageUrlChange(url);
        setIsUploading?.(false);
      },
      onUploadError: () => setIsUploading?.(false),
    });
  };
}