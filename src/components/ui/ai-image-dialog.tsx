import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { useAIImageGeneration } from '@/hooks/useAIImageGeneration';

interface AIImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetType: string;
  name: string;
  brand?: string;
  model?: string;
  description?: string;
  country?: string;
  onImageGenerated: (url: string) => void;
}

export function AIImageDialog({
  open,
  onOpenChange,
  assetType,
  name,
  brand,
  model,
  description,
  country,
  onImageGenerated,
}: AIImageDialogProps) {
  const { generateImage, isGenerating, error } = useAIImageGeneration();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    const mappedType = mapAssetType(assetType);
    const url = await generateImage({
      assetType: mappedType,
      name,
      brand,
      model,
      description,
      country,
    });
    
    if (url) {
      setPreviewUrl(url);
    }
  };

  const handleConfirm = () => {
    if (previewUrl) {
      onImageGenerated(previewUrl);
      onOpenChange(false);
      setPreviewUrl(null);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setPreviewUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={20} />
            Generate Image with AI
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="AI Generated"
              className="w-full rounded-lg"
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Generate a professional image for:
              </p>
              <p className="font-medium">
                {brand ? `${brand} ${model || name}` : name}
              </p>
              {error && (
                <p className="text-destructive text-sm mt-4">{error}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {previewUrl ? (
            <>
              <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                <RefreshCw size={14} className="mr-2" />
                Regenerate
              </Button>
              <Button onClick={handleConfirm}>
                Use This Image
              </Button>
            </>
          ) : (
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Generate Image (~$0.04)
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function mapAssetType(type: string): 'watch' | 'vehicle' | 'art' | 'wine' | 'jewelry' | 'real-estate' | 'other' {
  const typeMap: Record<string, 'watch' | 'vehicle' | 'art' | 'wine' | 'jewelry' | 'real-estate' | 'other'> = {
    'Watch': 'watch',
    'Watches': 'watch',
    'Vehicle': 'vehicle',
    'Vehicles': 'vehicle',
    'Art': 'art',
    'Wine': 'wine',
    'Jewelry': 'jewelry',
    'Real Estate': 'real-estate',
    'Property': 'real-estate',
  };
  return typeMap[type] || 'other';
}
