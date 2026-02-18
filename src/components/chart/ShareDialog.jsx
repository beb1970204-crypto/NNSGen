import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Share2, User, X, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function ShareDialog({ open, onOpenChange, currentSharedUsers = [], onShare, isLoading = false, chartId = null }) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("view");
  const [sharedUsers, setSharedUsers] = useState([]);
  const [shareToken, setShareToken] = useState(null);
  const [copied, setCopied] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);

  // Generate share token when dialog opens
  useEffect(() => {
    if (open && chartId && !shareToken) {
      generateShareToken();
    }
  }, [open, chartId]);

  const generateShareToken = async () => {
    try {
      setGeneratingToken(true);
      const response = await base44.functions.invoke('generateShareToken', { chartId });
      setShareToken(response.token);
    } catch (error) {
      console.error('Failed to generate token:', error);
    } finally {
      setGeneratingToken(false);
    }
  };

  // Convert old format to new format on mount
  useEffect(() => {
    if (Array.isArray(currentSharedUsers)) {
      if (currentSharedUsers.length > 0 && typeof currentSharedUsers[0] === 'string') {
        // Old format: array of emails
        setSharedUsers(currentSharedUsers.map(e => ({ email: e, permission: 'view' })));
      } else {
        // New format: array of objects
        setSharedUsers(currentSharedUsers);
      }
    }
  }, [currentSharedUsers, open]);

  const handleAddUser = () => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      toast.error("Please enter an email");
      return;
    }
    
    if (!trimmedEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    
    if (sharedUsers.some(u => u.email === trimmedEmail)) {
      toast.error("Already shared with this email");
      return;
    }
    
    setSharedUsers([...sharedUsers, { email: trimmedEmail, permission }]);
    setEmail("");
    setPermission("view");
  };

  const handleRemoveUser = (userEmail) => {
    setSharedUsers(sharedUsers.filter(u => u.email !== userEmail));
  };

  const handleUpdatePermission = (userEmail, newPermission) => {
    setSharedUsers(sharedUsers.map(u => 
      u.email === userEmail ? { ...u, permission: newPermission } : u
    ));
  };

  const handleShare = async () => {
    await onShare(sharedUsers);
    setSharedUsers([]);
    setEmail("");
  };

  const handleCopyLink = () => {
    if (shareToken) {
      const link = `${window.location.origin}${createPageUrl("ChartViewer")}?id=${chartId}&token=${shareToken}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard');
    }
  };

  const hasChanges = JSON.stringify(sharedUsers) !== JSON.stringify(
    Array.isArray(currentSharedUsers) && currentSharedUsers.length > 0 && typeof currentSharedUsers[0] === 'string'
      ? currentSharedUsers.map(e => ({ email: e, permission: 'view' }))
      : currentSharedUsers
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Chart
          </DialogTitle>
          <DialogDescription className="text-[#a0a0a0]">
            Share this chart with other users and control their access level.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#a0a0a0]">Add User</label>
            <div className="flex gap-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddUser()}
                placeholder="Enter email address"
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                disabled={isLoading}
              />
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-600"
                disabled={isLoading}
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
              </select>
              <Button
                onClick={handleAddUser}
                variant="outline"
                disabled={isLoading || !email.trim()}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Shareable Link Section */}
          {chartId && (
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
              <p className="text-sm font-semibold text-[#a0a0a0] mb-2">Shareable Link</p>
              <div className="flex gap-2">
                <Input
                  value={shareToken ? `${window.location.origin}${createPageUrl("ChartViewer")}?id=${chartId}&token=${shareToken}` : 'Generating link...'}
                  disabled
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-[#6b6b6b] text-xs"
                />
                <Button
                  size="icon"
                  onClick={handleCopyLink}
                  disabled={!shareToken || isLoading || generatingToken}
                  variant="outline"
                >
                  {generatingToken ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#6b6b6b] mt-2">Share this link with logged-in users to grant access</p>
            </div>
          )}

          {/* Shared Users List */}
          {sharedUsers.length > 0 && (
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide mb-3">
                Sharing with {sharedUsers.length} {sharedUsers.length === 1 ? "user" : "users"}
              </p>
              {sharedUsers.map((user) => (
                <div
                  key={user.email}
                  className="flex items-center justify-between bg-[#1a1a1a] rounded-lg px-3 py-2.5"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="text-sm text-white font-medium truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={user.permission}
                      onChange={(e) => handleUpdatePermission(user.email, e.target.value)}
                      className="bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-md px-2 py-1 text-xs focus:outline-none focus:border-red-600"
                      disabled={isLoading}
                    >
                      <option value="view">View</option>
                      <option value="edit">Edit</option>
                    </select>
                    <button
                      onClick={() => handleRemoveUser(user.email)}
                      disabled={isLoading}
                      className="text-[#6b6b6b] hover:text-red-500 transition-colors p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentSharedUsers.length > 0 && sharedUsers.length === 0 && (
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
              <p className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide mb-3">
                Currently shared with {currentSharedUsers.length} {currentSharedUsers.length === 1 ? "user" : "users"}
              </p>
              <div className="space-y-2">
                {currentSharedUsers.map((user) => {
                  const userObj = typeof user === 'string' ? { email: user, permission: 'view' } : user;
                  return (
                    <div key={userObj.email} className="flex items-center justify-between text-sm text-[#a0a0a0]">
                      <span>{userObj.email}</span>
                      <span className="text-xs text-[#6b6b6b]">{userObj.permission}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isLoading || !hasChanges}
            className="shadow-lg shadow-red-600/20"
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}