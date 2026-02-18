import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Share2, User, X } from "lucide-react";
import { toast } from "sonner";

export default function BulkShareDialog({ open, onOpenChange, charts = [], onShare, isLoading = false }) {
  const chartCount = charts.length;
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("view");
  const [sharedUsers, setSharedUsers] = useState([]);

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
      toast.error("Already added this email");
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
    if (sharedUsers.length === 0) {
      toast.error("Please add at least one user");
      return;
    }
    await onShare(sharedUsers);
    setSharedUsers([]);
    setEmail("");
  };

  const handleClose = () => {
    setSharedUsers([]);
    setEmail("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share {chartCount} Charts
          </DialogTitle>
          <DialogDescription className="text-[#a0a0a0]">
            Share these charts with multiple users at once.
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

          {/* Users List */}
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

          <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3 text-sm text-blue-300">
            These {chartCount} charts will be shared with all added users at once.
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isLoading || sharedUsers.length === 0}
            className="shadow-lg shadow-red-600/20"
          >
            {isLoading ? "Sharing..." : "Share Charts"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}