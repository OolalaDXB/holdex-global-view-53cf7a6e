import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, RefreshCw, Pencil, RotateCcw } from 'lucide-react';
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
  notes?: string;
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
  notes,
  onImageGenerated,
}: AIImageDialogProps) {
  const { generateImage, isGenerating, error } = useAIImageGeneration();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  
  // Generate the auto prompt based on asset details
  const autoPrompt = getAutoPrompt(assetType, name, brand, model, country, notes);
  
  // Reset custom prompt when dialog opens
  useEffect(() => {
    if (open) {
      setCustomPrompt(autoPrompt);
      setIsEditingPrompt(false);
      setPreviewUrl(null);
    }
  }, [open, autoPrompt]);

  const handleGenerate = async () => {
    const mappedType = mapAssetType(assetType);
    const url = await generateImage({
      assetType: mappedType,
      name,
      brand,
      model,
      description: isEditingPrompt ? customPrompt : description,
      country,
      notes: isEditingPrompt ? undefined : notes,
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
    setIsEditingPrompt(false);
  };

  const handleResetPrompt = () => {
    setCustomPrompt(autoPrompt);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={20} />
            Generate Image with AI
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="AI Generated"
              className="w-full rounded-lg"
            />
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">
                    {isEditingPrompt ? 'Custom Prompt' : 'Auto-generated Prompt'}
                  </Label>
                  <div className="flex gap-1">
                    {isEditingPrompt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetPrompt}
                        className="h-7 px-2 text-xs"
                      >
                        <RotateCcw size={12} className="mr-1" />
                        Reset
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                      className="h-7 px-2 text-xs"
                    >
                      <Pencil size={12} className="mr-1" />
                      {isEditingPrompt ? 'Preview' : 'Edit'}
                    </Button>
                  </div>
                </div>
                
                {isEditingPrompt ? (
                  <Textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Describe the image you want to generate..."
                    className="min-h-[100px] text-sm resize-none"
                  />
                ) : (
                  <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                    <p className="text-sm text-foreground leading-relaxed">
                      {customPrompt || autoPrompt}
                    </p>
                  </div>
                )}
              </div>

              {notes && !isEditingPrompt && (
                <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">Notes included in prompt:</p>
                  <p className="text-xs text-foreground/80 italic line-clamp-2">{notes}</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                {isEditingPrompt 
                  ? "Customize the prompt to get the exact image you want."
                  : "Click Edit to customize the prompt before generating."}
              </p>
              
              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}
            </>
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
            <Button onClick={handleGenerate} disabled={isGenerating || !customPrompt.trim()} className="w-full">
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

function mapAssetType(type: string): 'watch' | 'vehicle' | 'art' | 'wine' | 'jewelry' | 'real-estate' | 'business' | 'crypto' | 'other' {
  const typeMap: Record<string, 'watch' | 'vehicle' | 'art' | 'wine' | 'jewelry' | 'real-estate' | 'business' | 'crypto' | 'other'> = {
    'watch': 'watch',
    'Watch': 'watch',
    'Watches': 'watch',
    'vehicle': 'vehicle',
    'Vehicle': 'vehicle',
    'Vehicles': 'vehicle',
    'art': 'art',
    'Art': 'art',
    'wine': 'wine',
    'Wine': 'wine',
    'jewelry': 'jewelry',
    'Jewelry': 'jewelry',
    'real-estate': 'real-estate',
    'Real Estate': 'real-estate',
    'Property': 'real-estate',
    'business': 'business',
    'Business': 'business',
    'Business Equity': 'business',
    'crypto': 'crypto',
    'Crypto': 'crypto',
  };
  return typeMap[type] || 'other';
}

function getAutoPrompt(type: string, name: string, brand?: string, model?: string, country?: string, notes?: string): string {
  const mappedType = mapAssetType(type);
  const location = country ? `in ${country}` : '';
  const notesContext = notes ? `. Additional details: ${notes}` : '';
  
  let basePrompt: string;
  
  switch (mappedType) {
    case 'watch':
      basePrompt = `${brand || 'Luxury'} ${model || name} watch, professional studio photography`;
      break;
    case 'vehicle':
      basePrompt = `${brand || ''} ${model || name}, professional automotive photography`;
      break;
    case 'art':
      basePrompt = `${name}, fine art piece, gallery presentation`;
      break;
    case 'wine':
      basePrompt = `${name} wine bottle, premium photography`;
      break;
    case 'jewelry':
      basePrompt = `${brand || 'Fine'} ${name} jewelry, professional product photography`;
      break;
    case 'real-estate':
      basePrompt = `${name} ${location}, luxury property exterior, architectural photography`;
      break;
    case 'business':
      basePrompt = `${name} corporate headquarters, professional business imagery`;
      break;
    case 'crypto':
      basePrompt = `${name} digital asset concept, modern blockchain visualization`;
      break;
    default:
      basePrompt = `${name}, premium professional photography`;
  }
  
  return basePrompt + notesContext;
}
