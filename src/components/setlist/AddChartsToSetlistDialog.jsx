import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, List } from "lucide-react";
import SetlistDialog from "./SetlistDialog";

export default function AddChartsToSetlistDialog({
  open,
  onOpenChange,
  setlists = [],
  isLoading = false,
  onAddToSetlist,
  onCreateSetlist
}) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleCreateAndAdd = (data) => {
    onCreateSetlist(data, (newSetlistId) => {
      onAddToSetlist(newSetlistId);
      setShowCreateDialog(false);
      onOpenChange(false);
    });
  };

  return (
    <>
      <Dialog open={open && !showCreateDialog} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add Charts to Setlist</DialogTitle>
            <DialogDescription className="text-[#6b6b6b]">
              Select a setlist or create a new one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {setlists && setlists.length > 0 ? (
              setlists.map((setlist) => (
                <button
                  key={setlist.id}
                  onClick={() => onAddToSetlist(setlist.id)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#2a2a2a] hover:bg-[#252525] hover:border-red-600 transition-all text-left disabled:opacity-50"
                >
                  <List className="w-4 h-4 text-[#6b6b6b] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{setlist.name}</p>
                    <p className="text-xs text-[#6b6b6b]">
                      {setlist.chart_ids?.length || 0} chart{setlist.chart_ids?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-[#6b6b6b] text-center py-4">No setlists yet</p>
            )}
          </div>

          <div className="border-t border-[#2a2a2a] pt-4 mt-4">
            <Button
              onClick={() => setShowCreateDialog(true)}
              variant="outline"
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Setlist
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Setlist Dialog */}
      <SetlistDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSave={handleCreateAndAdd}
      />
    </>
  );
}