import React, { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Upload, X, ZoomIn, AlertCircle } from "lucide-react";
import { ImageLightboxModal } from "./ImageLightboxModal";

interface PhotoUploaderProps {
  photos: File[];
  onPhotosChange: (files: File[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  disabled = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewModalTitle, setPreviewModalTitle] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = (newFiles: FileList | File[]) => {
    setError(null);
    const validFiles: File[] = [];
    const maxSizeBytes = 25 * 1024 * 1024; // 25 MB

    const totalAllowed = maxPhotos - photos.length;
    if (totalAllowed <= 0) {
      setError(`Maximum of ${maxPhotos} photos reached.`);
      return;
    }

    const filesArray = Array.from(newFiles).slice(0, totalAllowed);

    for (const file of filesArray) {
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" is not a valid image format.`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        setError(`"${file.name}" exceeds 25 MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onPhotosChange([...photos, ...validFiles]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      e.target.value = ""; // Reset input
    }
  };

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);
  };

  const openPreview = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewModalUrl(url);
    setPreviewModalTitle(file.name);
  };

  return (
    <div className="space-y-3">
      {/* Upload Action Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-4 transition-all text-center ${
          dragActive
            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
            : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-primary flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </div>

          <div>
            <p className="text-xs font-bold text-slate-800">
              Attach Photo Evidence ({photos.length}/{maxPhotos})
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Drag & drop images, capture via camera, or browse files (PNG, JPG, WEBP up to 25MB)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
            {/* Standard File Picker */}
            <button
              type="button"
              disabled={disabled || photos.length >= maxPhotos}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-3.5 h-3.5 text-primary" />
              <span>Browse Photos</span>
            </button>

            {/* Direct Camera Capture */}
            <button
              type="button"
              disabled={disabled || photos.length >= maxPhotos}
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Take Photo</span>
            </button>
          </div>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/jpg"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={disabled}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={disabled}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Photos Thumbnail Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
          {photos.map((file, idx) => {
            const previewUrl = URL.createObjectURL(file);
            return (
              <div
                key={`${file.name}-${idx}`}
                className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video sm:aspect-square flex items-center justify-center shadow-sm"
              >
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                />

                {/* Overlay with Actions */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/90 truncate max-w-[80px] font-mono">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors shadow-sm"
                      title="Remove photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => openPreview(file)}
                      className="inline-flex items-center gap-1 text-[11px] text-white bg-slate-800/80 hover:bg-slate-800 px-2 py-1 rounded-md transition-colors"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                  </div>

                  <div className="text-[10px] text-white/90 truncate font-semibold">
                    {file.name}
                  </div>
                </div>

                {/* Counter Badge */}
                <div className="absolute top-1 left-1 bg-slate-900/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded group-hover:hidden">
                  #{idx + 1}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {previewModalUrl && (
        <ImageLightboxModal
          isOpen={true}
          onClose={() => {
            if (previewModalUrl) URL.revokeObjectURL(previewModalUrl);
            setPreviewModalUrl(null);
          }}
          imageUrl={previewModalUrl}
          title={previewModalTitle}
        />
      )}
    </div>
  );
};
