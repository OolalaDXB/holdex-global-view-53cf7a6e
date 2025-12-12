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
import { useToast } from '@/hooks/use-toast';
import { useDeleteDocument, useDocumentUpload, Document } from '@/hooks/useDocuments';

interface DeleteDocumentDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteDocumentDialog = ({
  document,
  open,
  onOpenChange,
}: DeleteDocumentDialogProps) => {
  const { toast } = useToast();
  const deleteDocument = useDeleteDocument();
  const { deleteDocument: deleteFile } = useDocumentUpload();

  const handleDelete = async () => {
    if (!document) return;

    try {
      // Delete file from storage
      await deleteFile(document.file_url);
      
      // Delete document record
      await deleteDocument.mutateAsync(document.id);
      
      toast({ title: 'Document deleted' });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Document</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{document?.name}"? This action cannot be undone.
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
};
