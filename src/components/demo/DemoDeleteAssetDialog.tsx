import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Asset } from '@/hooks/useAssets';
import { useDemo } from '@/contexts/DemoContext';
import { useToast } from '@/hooks/use-toast';

interface DemoDeleteAssetDialogProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoDeleteAssetDialog({ asset, open, onOpenChange }: DemoDeleteAssetDialogProps) {
  const { toast } = useToast();
  const { deleteAsset } = useDemo();

  const handleDelete = () => {
    if (!asset) return;

    deleteAsset(asset.id);
    toast({
      title: "Asset deleted",
      description: `${asset.name} has been removed from your demo portfolio.`,
    });
    onOpenChange(false);
  };

  if (!asset) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {asset.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove this asset from your demo portfolio. (Demo changes are temporary)
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
