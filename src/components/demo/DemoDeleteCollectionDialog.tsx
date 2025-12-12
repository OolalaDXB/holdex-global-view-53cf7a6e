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
import { Collection } from '@/hooks/useCollections';
import { useDemo } from '@/contexts/DemoContext';
import { useToast } from '@/hooks/use-toast';

interface DemoDeleteCollectionDialogProps {
  collection: Collection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoDeleteCollectionDialog({ collection, open, onOpenChange }: DemoDeleteCollectionDialogProps) {
  const { toast } = useToast();
  const { deleteCollection } = useDemo();

  const handleDelete = () => {
    if (!collection) return;

    deleteCollection(collection.id);
    toast({
      title: "Collection item deleted",
      description: `${collection.name} has been removed from your demo portfolio.`,
    });
    onOpenChange(false);
  };

  if (!collection) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {collection.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove this item from your demo collection. (Demo changes are temporary)
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
