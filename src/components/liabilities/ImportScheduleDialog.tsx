import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCreateLoanSchedule, useCreateLoanPayments } from '@/hooks/useLoanSchedules';
import { format } from 'date-fns';

interface ImportScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liabilityId: string;
  liabilityName: string;
  currency: string;
}

interface ParsedPayment {
  payment_number: number;
  payment_date: string;
  total_amount: number;
  principal_amount: number;
  interest_amount: number;
  remaining_principal: number;
}

export function ImportScheduleDialog({
  open,
  onOpenChange,
  liabilityId,
  liabilityName,
  currency,
}: ImportScheduleDialogProps) {
  const { toast } = useToast();
  const createSchedule = useCreateLoanSchedule();
  const createPayments = useCreateLoanPayments();
  
  const [parsedData, setParsedData] = useState<ParsedPayment[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const parseCSV = (text: string): ParsedPayment[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('File must have at least a header row and one data row');
    
    const headers = lines[0].toLowerCase().split(/[,;\t]/).map(h => h.trim().replace(/['"]/g, ''));
    
    // Find column indices
    const dateIdx = headers.findIndex(h => h.includes('date'));
    const paymentIdx = headers.findIndex(h => h.includes('payment') && !h.includes('principal') && !h.includes('interest'));
    const principalIdx = headers.findIndex(h => h.includes('principal'));
    const interestIdx = headers.findIndex(h => h.includes('interest'));
    const balanceIdx = headers.findIndex(h => h.includes('balance') || h.includes('remaining'));
    
    if (dateIdx === -1) throw new Error('Could not find date column. Please include a column with "date" in the header.');
    
    const payments: ParsedPayment[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,;\t]/).map(v => v.trim().replace(/['"]/g, ''));
      if (values.length < 2) continue;
      
      const dateValue = values[dateIdx];
      // Parse various date formats
      let paymentDate: Date;
      try {
        if (dateValue.includes('/')) {
          const parts = dateValue.split('/');
          if (parts[0].length === 4) {
            paymentDate = new Date(dateValue);
          } else if (parts[2]?.length === 4) {
            paymentDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else {
            paymentDate = new Date(dateValue);
          }
        } else {
          paymentDate = new Date(dateValue);
        }
        
        if (isNaN(paymentDate.getTime())) throw new Error('Invalid date');
      } catch {
        continue; // Skip rows with invalid dates
      }
      
      const parseNum = (idx: number) => {
        if (idx === -1) return 0;
        const val = values[idx]?.replace(/[^0-9.-]/g, '');
        return parseFloat(val) || 0;
      };
      
      const totalAmount = paymentIdx !== -1 ? parseNum(paymentIdx) : 0;
      const principalAmount = parseNum(principalIdx);
      const interestAmount = parseNum(interestIdx);
      const remainingPrincipal = parseNum(balanceIdx);
      
      payments.push({
        payment_number: i,
        payment_date: format(paymentDate, 'yyyy-MM-dd'),
        total_amount: totalAmount || (principalAmount + interestAmount),
        principal_amount: principalAmount,
        interest_amount: interestAmount,
        remaining_principal: remainingPrincipal,
      });
    }
    
    // Re-number payments
    payments.forEach((p, idx) => p.payment_number = idx + 1);
    
    return payments;
  };
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setFileName(file.name);
    setError(null);
    setParsedData([]);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        
        if (parsed.length === 0) {
          setError('No valid payment rows found in the file');
          return;
        }
        
        setParsedData(parsed);
      } catch (err: any) {
        setError(err.message || 'Failed to parse file');
      }
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });
  
  const handleImport = async () => {
    if (parsedData.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      const firstPayment = parsedData[0];
      const lastPayment = parsedData[parsedData.length - 1];
      const totalPrincipal = parsedData.reduce((sum, p) => sum + p.principal_amount, 0);
      const totalInterest = parsedData.reduce((sum, p) => sum + p.interest_amount, 0);
      
      // Determine how many payments are already past (marked as paid)
      const today = new Date();
      const paidCount = parsedData.filter(p => new Date(p.payment_date) < today).length;
      
      const nextPayment = parsedData.find(p => new Date(p.payment_date) >= today);
      
      // Create the loan schedule
      const createdSchedule = await createSchedule.mutateAsync({
        liability_id: liabilityId,
        loan_type: 'amortizing',
        principal_amount: totalPrincipal + (lastPayment.remaining_principal || 0),
        interest_rate: null,
        rate_type: 'fixed',
        start_date: firstPayment.payment_date,
        end_date: lastPayment.payment_date,
        term_months: parsedData.length,
        payment_frequency: 'monthly',
        monthly_payment: parsedData[0].total_amount,
        total_interest: totalInterest,
        total_cost: totalPrincipal + totalInterest,
        payments_made: paidCount,
        next_payment_date: nextPayment?.payment_date || null,
        remaining_principal: nextPayment ? (parsedData[parsedData.indexOf(nextPayment) - 1]?.remaining_principal || totalPrincipal) : 0,
        imported_schedule: parsedData,
        is_imported: true,
        notes: `Imported from ${fileName}`,
      });
      
      // Create payment entries
      const payments = parsedData.map(entry => ({
        loan_schedule_id: createdSchedule.id,
        payment_number: entry.payment_number,
        payment_date: entry.payment_date,
        principal_amount: entry.principal_amount,
        interest_amount: entry.interest_amount,
        total_amount: entry.total_amount,
        remaining_principal: entry.remaining_principal,
        status: new Date(entry.payment_date) < today ? 'paid' as const : 'scheduled' as const,
        actual_payment_date: new Date(entry.payment_date) < today ? entry.payment_date : null,
        actual_amount: new Date(entry.payment_date) < today ? entry.total_amount : null,
        notes: null,
      }));
      
      await createPayments.mutateAsync(payments);
      
      toast({
        title: 'Schedule imported',
        description: `Imported ${parsedData.length} payments for ${liabilityName}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: 'Failed to import payment schedule',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Import Payment Schedule</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with your amortization schedule from your bank.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              ${error ? 'border-destructive' : ''}
            `}
          >
            <input {...getInputProps()} />
            {parsedData.length > 0 ? (
              <div className="space-y-2">
                <FileSpreadsheet className="h-10 w-10 mx-auto text-sage" />
                <p className="font-medium">{fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {parsedData.length} payments found
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="font-medium">Drop your file here</p>
                <p className="text-sm text-muted-foreground">
                  or click to browse (CSV, Excel)
                </p>
              </div>
            )}
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          
          {/* Expected format */}
          <div className="p-3 bg-secondary rounded-lg text-sm">
            <p className="font-medium mb-2">Expected columns:</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• <code className="text-xs bg-background px-1 rounded">Date</code> - Payment date</li>
              <li>• <code className="text-xs bg-background px-1 rounded">Payment</code> - Total payment amount</li>
              <li>• <code className="text-xs bg-background px-1 rounded">Principal</code> - Principal portion</li>
              <li>• <code className="text-xs bg-background px-1 rounded">Interest</code> - Interest portion</li>
              <li>• <code className="text-xs bg-background px-1 rounded">Balance</code> - Remaining balance</li>
            </ul>
          </div>
          
          {/* Preview */}
          {parsedData.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="max-h-[200px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-secondary sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left">#</th>
                      <th className="px-2 py-1 text-left">Date</th>
                      <th className="px-2 py-1 text-right">Payment</th>
                      <th className="px-2 py-1 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((p) => (
                      <tr key={p.payment_number} className="border-t border-border">
                        <td className="px-2 py-1">{p.payment_number}</td>
                        <td className="px-2 py-1">{p.payment_date}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{p.total_amount.toFixed(2)}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{p.remaining_principal.toFixed(2)}</td>
                      </tr>
                    ))}
                    {parsedData.length > 10 && (
                      <tr className="border-t border-border">
                        <td colSpan={4} className="px-2 py-1 text-center text-muted-foreground">
                          ... and {parsedData.length - 10} more payments
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleImport}
              disabled={parsedData.length === 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Importing...' : `Import ${parsedData.length} Payments`}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
