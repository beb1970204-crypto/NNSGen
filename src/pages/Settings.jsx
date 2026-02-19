import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Trash2, Lock, SlidersHorizontal, AlertTriangle, User } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const [defaultKey, setDefaultKey] = useState(user?.defaultKey || "C");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const updateSettings = useMutation({
    mutationFn: async (settings) => {
      await base44.auth.updateMe(settings);
    },
    onSuccess: () => {
      toast.success('Settings saved');
    },
    onError: () => {
      toast.error('Failed to save settings');
    }
  });

  const handleSaveSettings = () => {
    updateSettings.mutate({ defaultKey });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // Note: In a real app, you'd have a backend function to handle account deletion
      // This would delete the user and all associated data
      toast.error('Account deletion requires admin support. Contact support@nnsgen.com');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (!user) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-[#a0a0a0]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to={createPageUrl("Home")}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-white font-sans">Settings</h1>
      </div>

      <div className="max-w-2xl">
        {/* Profile Section */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2a2a2a]">
            <div className="w-9 h-9 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
              <User className="w-4 h-4 text-[#a0a0a0]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">Profile</h2>
              <p className="text-xs text-[#6b6b6b] font-sans">Your account information</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2 font-sans">
                Full Name
              </label>
              <Input
                value={user.full_name || ''}
                disabled
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
              />
              <p className="text-xs text-[#6b6b6b] mt-1 font-sans">Managed by Base44 account</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2 font-sans">
                Email
              </label>
              <Input
                value={user.email || ''}
                disabled
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
              />
              <p className="text-xs text-[#6b6b6b] mt-1 font-sans">Verified email address</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2 font-sans">
                Account Role
              </label>
              <Input
                value={user.role || 'user'}
                disabled
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
              />
              <p className="text-xs text-[#6b6b6b] mt-1 font-sans">Your permission level in NNSGen</p>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2a2a2a]">
            <div className="w-9 h-9 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 text-[#a0a0a0]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">Preferences</h2>
              <p className="text-xs text-[#6b6b6b] font-sans">Default chart settings</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2 font-sans">
                Default Key for New Charts
              </label>
              <select
                value={defaultKey}
                onChange={(e) => setDefaultKey(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-md px-4 py-2.5 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/20"
              >
                {['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
                  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bbm', 'Bm'].map(key => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
              <p className="text-xs text-[#6b6b6b] mt-1 font-sans">Suggested key when creating new charts</p>
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={updateSettings.isPending}
              className="gap-2 shadow-lg shadow-red-600/20 w-full"
            >
              <Save className="w-4 h-4" />
              {updateSettings.isPending ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-[#1a1a1a] border border-red-600/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-red-600/20">
            <div className="w-9 h-9 rounded-lg bg-red-600/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">Danger Zone</h2>
              <p className="text-xs text-[#6b6b6b] font-sans">Irreversible account actions</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#a0a0a0] mb-4 font-sans">
                Delete your account and all associated charts. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Account?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#a0a0a0]">
              This will permanently delete your account and all your charts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2a2a2a] text-white border-[#3a3a3a] hover:bg-[#3a3a3a]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}