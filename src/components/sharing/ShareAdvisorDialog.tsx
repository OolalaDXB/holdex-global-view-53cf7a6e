import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, X } from 'lucide-react';
import { useInvitePartner, useSharedAccess, useRevokeAccess } from '@/hooks/useSharedAccess';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ShareAdvisorDialogProps {
  trigger?: React.ReactNode;
  className?: string;
  showBadge?: boolean;
  isMobileDrawer?: boolean;
}

export function ShareAdvisorDialog({ trigger, className, showBadge = true, isMobileDrawer = false }: ShareAdvisorDialogProps) {
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const { data: sharedAccess = [] } = useSharedAccess();
  const invitePartner = useInvitePartner();
  const revokeAccess = useRevokeAccess();
  const { toast } = useToast();

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    try {
      await invitePartner.mutateAsync(inviteEmail);
      toast({
        title: 'Invitation sent',
        description: `An invite has been sent to ${inviteEmail}`,
      });
      setInviteEmail('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send invitation',
      });
    }
  };

  const handleRevoke = async (id: string, email: string) => {
    try {
      await revokeAccess.mutateAsync(id);
      toast({
        title: 'Access revoked',
        description: `${email} no longer has access to your portfolio`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to revoke access',
      });
    }
  };

  const pendingCount = sharedAccess.filter(s => s.status === 'pending').length;

  // For mobile drawer, render inline content
  if (isMobileDrawer) {
    return (
      <div className="space-y-4">
        {sharedAccess.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Current access</p>
            {sharedAccess.map((share) => (
              <div 
                key={share.id} 
                className="flex items-center justify-between py-2 px-3 bg-secondary rounded-md"
              >
                <div>
                  <span className="text-sm text-foreground">{share.shared_with_email}</span>
                  <span className="text-xs text-muted-foreground ml-2 capitalize">
                    ({share.status})
                  </span>
                </div>
                <button
                  onClick={() => handleRevoke(share.id, share.shared_with_email)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="advisor@example.com"
            className="flex-1"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            type="email"
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
          />
          <Button
            onClick={handleInvite}
            disabled={!inviteEmail.trim() || invitePartner.isPending}
          >
            {invitePartner.isPending ? 'Inviting...' : 'Invite'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className={cn("relative", className)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Share with Advisor
            {showBadge && pendingCount > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
              >
                {pendingCount}
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share with Advisor</DialogTitle>
          <DialogDescription>
            Invite an advisor or partner to view your portfolio. They will have read-only access.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {sharedAccess.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current access</p>
              {sharedAccess.map((share) => (
                <div 
                  key={share.id} 
                  className="flex items-center justify-between py-2 px-3 bg-secondary rounded-md"
                >
                  <div>
                    <span className="text-sm text-foreground">{share.shared_with_email}</span>
                    <span className="text-xs text-muted-foreground ml-2 capitalize">
                      ({share.status})
                    </span>
                  </div>
                  <button
                    onClick={() => handleRevoke(share.id, share.shared_with_email)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="advisor@example.com"
              className="flex-1"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              type="email"
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || invitePartner.isPending}
            >
              {invitePartner.isPending ? 'Inviting...' : 'Invite'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
