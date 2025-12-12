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
import { useDeleteReceivable, Receivable } from '@/hooks/useReceivables';
import { useToast } from '@/hooks/use-toast';

interface DeleteReceivableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivable: Receivable | null;
}

export function DeleteReceivableDialog({ open, onOpenChange, receivable }: DeleteReceivableDialogProps) {
  const { toast } = useToast();
  const deleteReceivable = useDeleteReceivable();

  const handleDelete = async () => {
    if (!receivable) return;
    
    try {
      await deleteReceivable.mutateAsync(receivable.id);
      toast({ title: 'Receivable deleted' });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete receivable' });
    }
  };

  if (!receivable) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Receivable</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{receivable.name}"? This action cannot be undone.
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
