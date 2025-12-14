import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImageUpload } from '@/hooks/useImageUpload';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  assetId: string;
  onGenerateAI?: () => void;
  hideAIButton?: boolean;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
}

export function ImageUpload({ value, onChange, assetId, onGenerateAI, hideAIButton = false, className, disabled, compact = false }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, deleteImage, isUploading } = useImageUpload();
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (file: File) => {
    try {
      const url = await uploadImage(file, assetId);
      if (url) onChange(url);
    } catch (error: any) {
      console.error('Upload failed:', error.message);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleRemove = async () => {
    if (value) {
      try {
        await deleteImage(value);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
      onChange(null);
    }
  };

  if (value) {
    return (
      <div className={cn("relative group", className)}>
        <img
          src={value}
          alt="Asset"
          className={cn(
            "object-cover rounded-lg",
            compact ? "w-full h-16" : "w-full h-48"
          )}
        />
        {!disabled && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={16} className="text-foreground" />
          </button>
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={cn(
          "border border-dashed rounded-lg p-2 transition-colors flex items-center gap-2",
          isDragging ? "border-primary bg-primary/5" : "border-border",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={disabled ? undefined : handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled}
          className="text-xs"
        >
          <Upload size={12} className="mr-1" />
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
        <span className="text-xs text-muted-foreground">or drag & drop</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={disabled ? undefined : handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
      />
      
      <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
      
      <p className="text-sm text-muted-foreground mb-4">
        Drag and drop an image, or
      </p>
      
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled}
        >
          <Upload size={14} className="mr-2" />
          {isUploading ? 'Uploading...' : 'Upload Photo'}
        </Button>
        
        {onGenerateAI && !hideAIButton && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGenerateAI}
            disabled={isUploading || disabled}
          >
            <Sparkles size={14} className="mr-2" />
            Generate with AI
          </Button>
        )}
      </div>
    </div>
  );
}
