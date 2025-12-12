import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useDeleteLoanSchedule } from '@/hooks/useLoanSchedules';

interface DeleteScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: string;
  liabilityName: string;
}

export function DeleteScheduleDialog({
  open,
  onOpenChange,
  scheduleId,
  liabilityName,
}: DeleteScheduleDialogProps) {
  const { toast } = useToast();
  const deleteSchedule = useDeleteLoanSchedule();

  const handleDelete = async () => {
    try {
      await deleteSchedule.mutateAsync(scheduleId);
      toast({
        title: 'Schedule deleted',
        description: `Payment schedule for ${liabilityName} has been removed`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete payment schedule',
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Payment Schedule?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the payment schedule and all payment records for{' '}
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
            {deleteSchedule.isPending ? 'Deleting...' : 'Delete Schedule'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
