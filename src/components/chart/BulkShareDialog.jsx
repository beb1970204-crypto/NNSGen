import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Share2, User, X, Search } from "lucide-react";
import { toast } from "sonner";

export default function BulkShareDialog({ open, onOpenChange, charts = [], onShare, isLoading = false }) {
  const [selectedCharts, setSelectedCharts] = useState([]);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("view");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCharts = charts.filter(chart =>
    chart.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chart.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectChart = (chartId) => {
    setSelectedCharts(prev =>
      prev.includes(chartId)
        ? prev.filter(id => id !== chartId)
        : [...prev, chartId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCharts.length === filteredCharts.length) {
      setSelectedCharts([]);
    } else {
      setSelectedCharts(filteredCharts.map(c => c.id));
    }
  };

  const handleShare = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error("Please enter an email");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    if (selectedCharts.length === 0) {
      toast.error("Please select at least one chart");
      return;
    }

    await onShare({
      chartIds: selectedCharts,
      email: trimmedEmail,
      permission
    });

    setSelectedCharts([]);
    setEmail("");
    setPermission("view");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Multiple Charts
          </DialogTitle>
          <DialogDescription className="text-[#a0a0a0]">
            Select charts and share them with a user at once.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* User Input Section */}
          <div className="space-y-2 bg-[#0a0a0a] rounded-lg p-4 border border-[#2a2a2a]">
            <label className="text-sm font-medium text-[#a0a0a0]">Share With</label>
            <div className="flex gap-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                disabled={isLoading}
              />
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-600"
                disabled={isLoading}
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
              </select>
            </div>
          </div>

          {/* Charts Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#a0a0a0]">Select Charts</label>
              <button
                onClick={handleSelectAll}
                className="text-xs text-red-500 hover:text-red-400 transition-colors"
                disabled={isLoading}
              >
                {selectedCharts.length === filteredCharts.length && filteredCharts.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search charts..."
                className="pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-white"
              />
            </div>

            {/* Charts List */}
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg divide-y divide-[#2a2a2a] max-h-64 overflow-y-auto">
              {filteredCharts.length === 0 ? (
                <div className="p-4 text-center text-[#6b6b6b] text-sm">
                  No charts found
                </div>
              ) : (
                filteredCharts.map((chart) => (
                  <label
                    key={chart.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedCharts.includes(chart.id)}
                      onChange={() => handleSelectChart(chart.id)}
                      disabled={isLoading}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{chart.title}</p>
                      <p className="text-xs text-[#6b6b6b]">
                        {chart.artist} • {chart.key} • {chart.time_signature}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>

            {/* Selection Counter */}
            <p className="text-xs text-[#6b6b6b]">
              {selectedCharts.length} chart{selectedCharts.length !== 1 ? "s" : ""} selected
            </p>
          </div>
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
            disabled={isLoading || selectedCharts.length === 0 || !email.trim()}
            className="shadow-lg shadow-red-600/20"
          >
            {isLoading ? "Sharing..." : `Share ${selectedCharts.length} Chart${selectedCharts.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}