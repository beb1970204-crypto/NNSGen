import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2 } from "lucide-react";

export default function RefineFeedbackModal({ onSubmit, onCancel, isLoading }) {
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    if (!feedback.trim()) return;
    onSubmit(feedback.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-bold text-white">Refine Chart</h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-[#6b6b6b] hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-[#1a1a1a]/80 backdrop-blur-xs rounded-lg flex flex-col items-center justify-center z-10">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-3" />
              <p className="text-sm text-[#a0a0a0] font-medium">Refining your chart...</p>
            </div>
          )}

          <p className="text-sm text-[#a0a0a0]">
            Describe how you'd like to refine the chart. For example: "Add more measures to the Verse", "Change the Bridge chord progression", "Shorten the Intro"
          </p>

          <Textarea
            placeholder="e.g., Add an Instrumental Solo section after the Bridge..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={isLoading}
            className="h-24 resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2a2a2a]">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !feedback.trim()}
            size="sm"
            className="shadow-lg shadow-red-600/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Refining...
              </>
            ) : (
              "Refine Chart"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}