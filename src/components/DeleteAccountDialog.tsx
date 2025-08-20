import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAccountDialog = ({ open, onOpenChange }: DeleteAccountDialogProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter your password to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }

    if (!confirmationChecked) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm that you understand this action cannot be undone.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      // Get the current session to include authorization header
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { password },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      // Clear local storage and sign out
      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Account Deleted Successfully",
        description: "Your account and all associated data have been permanently deleted. You can create a new account with the same email if desired.",
      });

      // Close dialog and navigate to home
      onOpenChange(false);
      await signOut();
      navigate('/');

    } catch (error: any) {
      console.error('Account deletion error:', error);
      
      let errorMessage = 'An unexpected error occurred while deleting your account.';
      
      if (error.message?.includes('Invalid password')) {
        errorMessage = 'The password you entered is incorrect.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      toast({
        title: "Deletion Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setPassword('');
      setConfirmationChecked(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <DialogTitle className="text-destructive">Delete Account</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-2">
            <p>
              <strong>This action cannot be undone.</strong> Deleting your account will permanently remove:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Your profile and account information</li>
              <li>All search history and saved results</li>
              <li>Any preferences or settings</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              After deletion, you can create a new account using the same email address if desired.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Confirm your password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isDeleting}
              className="border-destructive/50 focus:border-destructive"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm-deletion"
              checked={confirmationChecked}
              onCheckedChange={(checked) => setConfirmationChecked(checked === true)}
              disabled={isDeleting}
            />
            <Label 
              htmlFor="confirm-deletion" 
              className="text-sm leading-5"
            >
              I understand that this action is permanent and cannot be undone
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isDeleting || !password.trim() || !confirmationChecked}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};