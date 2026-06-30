"use client";

import React, { useState } from "react";
import { Plus, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";

interface ImageUploadProps {
  value: { url: string; publicId: string; order: number; alt?: string }[];
  onChange: (value: { url: string; publicId: string; order: number; alt?: string }[]) => void;
  folder?: string;
  maxFiles?: number;
  label?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  folder = "products",
  maxFiles,
  label = "Product Images",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const isFull = maxFiles !== undefined && value.length >= maxFiles;

  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const file = files[0];

      // 1. Get signed upload signature from our API
      const sigResponse = await apiClient.get(`/admin/upload?folder=${folder}`);
      if (!sigResponse.data?.success) {
        throw new Error("Failed to get upload signature");
      }

      const { signature, timestamp, apiKey, cloudName, folder: targetFolder } = sigResponse.data.data;

      // 2. Upload directly to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature", signature);
      formData.append("timestamp", timestamp.toString());
      formData.append("api_key", apiKey);
      formData.append("folder", targetFolder);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      
      // Use raw fetch for direct Cloudinary upload to avoid interceptors issues if any
      const uploadResponse = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.error) {
        throw new Error(uploadData.error.message);
      }

      const newImage = {
        url: uploadData.secure_url,
        publicId: uploadData.public_id,
        order: value.length,
        alt: "",
      };
      
      onChange([...value, newImage]);
      toast.success("Image uploaded");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const onDelete = async (publicId: string) => {
    try {
      await apiClient.delete(`/admin/upload?publicId=${publicId}`);
      onChange(value.filter((img) => img.publicId !== publicId));
      toast.success("Image removed");
    } catch (error: any) {
      toast.error("Failed to delete image from server");
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {value.map((image) => (
          <div key={image.publicId} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-surface-secondary group">
            <img src={image.url} alt={image.alt || "Category image"} className="object-cover w-full h-full" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => onDelete(image.publicId)}
                className="p-2 bg-error-500 text-white rounded-full hover:bg-error-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        
        {isFull ? (
          <div className="relative aspect-square rounded-xl border border-border bg-surface p-4 flex flex-col items-center justify-center text-center text-xs text-muted-foreground">
            <span className="font-semibold">Upload limit reached</span>
            <span className="mt-2">Remove an image to upload another.</span>
          </div>
        ) : (
          <label className="relative aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary-500 hover:bg-primary-500/5 transition-all flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:text-primary-500">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <Plus className="h-8 w-8 mb-1" />
                <span className="text-[10px] font-bold uppercase">Upload</span>
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={onUpload}
              disabled={isUploading}
            />
          </label>
        )}
      </div>

      {value.length === 0 && !isUploading && (
        <div className="flex items-center gap-2 p-4 rounded-xl border border-warning-200 bg-warning-50 text-warning-700 text-xs italic">
          <ImageIcon className="h-4 w-4" />
          No images uploaded yet.
        </div>
      )}
    </div>
  );
};
