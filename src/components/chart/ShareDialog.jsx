import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Share2, User, X } from "lucide-react";
import { toast } from "sonner";

export default function ShareDialog({ open, onOpenChange, currentSharedUsers = [], onShare, isLoading = false }) {
  const [email, setEmail] = useState("");
  const [sharedUsers, setSharedUsers] = useState(currentSharedUsers);

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
    
    if (sharedUsers.includes(trimmedEmail)) {
      toast.error("Already shared with this email");
      return;
    }
    
    setSharedUsers([...sharedUsers, trimmedEmail]);
    setEmail("");
  };

  const handleRemoveUser = (userEmail) => {
    setSharedUsers(sharedUsers.filter(u => u !== userEmail));
  };

  const handleShare = async () => {
    await onShare(sharedUsers);
    setSharedUsers([]);
    setEmail("");
  };

  const hasChanges = JSON.stringify(sharedUsers) !== JSON.stringify(currentSharedUsers);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Chart
          </DialogTitle>
          <DialogDescription className="text-[#a0a0a0]">
            Share this chart with other users by entering their email addresses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email Input */}
          <div className="flex gap-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddUser()}
              placeholder="Enter email address"
              className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
              disabled={isLoading}
            />
            <Button
              onClick={handleAddUser}
              variant="outline"
              disabled={isLoading || !email.trim()}
              className="whitespace-nowrap"
            >
              Add
            </Button>
          </div>

          {/* Shared Users List */}
          {sharedUsers.length > 0 && (
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide mb-3">
                Sharing with {sharedUsers.length} {sharedUsers.length === 1 ? "user" : "users"}
              </p>
              {sharedUsers.map((userEmail) => (
                <div
                  key={userEmail}
                  className="flex items-center justify-between bg-[#1a1a1a] rounded-lg px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="text-sm text-white font-medium">{userEmail}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveUser(userEmail)}
                    disabled={isLoading}
                    className="text-[#6b6b6b] hover:text-red-500 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
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
                {currentSharedUsers.map((userEmail) => (
                  <div key={userEmail} className="flex items-center gap-2 text-sm text-[#a0a0a0]">
                    <User className="w-3 h-3" />
                    {userEmail}
                  </div>
                ))}
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