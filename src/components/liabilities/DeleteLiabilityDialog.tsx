import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useDeleteLiability } from '@/hooks/useLiabilities';

interface DeleteLiabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liabilityId: string;
  liabilityName: string;
}

export function DeleteLiabilityDialog({
  open,
  onOpenChange,
  liabilityId,
  liabilityName,
}: DeleteLiabilityDialogProps) {
  const { toast } = useToast();
  const deleteLiability = useDeleteLiability();

  const handleDelete = async () => {
    try {
      await deleteLiability.mutateAsync({ id: liabilityId, name: liabilityName });
      toast({
        title: 'Liability deleted',
        description: `${liabilityName} has been removed`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete liability',
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Liability?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{' '}
            <span className="font-medium text-foreground">{liabilityName}</span>.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteLiability.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
