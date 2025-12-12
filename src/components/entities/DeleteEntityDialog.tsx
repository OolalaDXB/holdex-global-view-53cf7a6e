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
import { Entity } from '@/hooks/useEntities';
import { Loader2 } from 'lucide-react';

interface DeleteEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: Entity | null;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
  hasLinkedAssets?: boolean;
}

export const DeleteEntityDialog = ({
  open,
  onOpenChange,
  entity,
  onConfirm,
  isLoading,
  hasLinkedAssets,
}: DeleteEntityDialogProps) => {
  if (!entity) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Entity</AlertDialogTitle>
          <AlertDialogDescription>
            {hasLinkedAssets ? (
              <>
                Cannot delete "{entity.name}" because it has linked assets.
                Please reassign or delete the linked assets first.
              </>
            ) : (
              <>
                Are you sure you want to delete "{entity.name}"?
                This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {!hasLinkedAssets && (
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
