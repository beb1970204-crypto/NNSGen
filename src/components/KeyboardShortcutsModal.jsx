import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command } from "lucide-react";

export default function KeyboardShortcutsModal({ open, onOpenChange }) {
  const shortcuts = [
    { keys: ["⌘", "K"], action: "Focus search" },
    { keys: ["⌘", "N"], action: "New chart" },
    { keys: ["⌘", "S"], action: "Save chart" },
    { keys: ["⌘", "Z"], action: "Undo" },
    { keys: ["Delete"], action: "Delete selected measure" },
    { keys: ["←", "→"], action: "Navigate measures" },
    { keys: ["?"], action: "Show shortcuts" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {shortcuts.map((shortcut, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-[#a0a0a0]">{shortcut.action}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIdx) => (
                  <React.Fragment key={keyIdx}>
                    <kbd className="px-2 py-1 text-xs font-semibold bg-[#2a2a2a] border border-[#3a3a3a] rounded">
                      {key}
                    </kbd>
                    {keyIdx < shortcut.keys.length - 1 && (
                      <span className="text-[#6b6b6b]">+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-[#6b6b6b] text-center pt-2 border-t border-[#2a2a2a]">
          Press <kbd className="px-1 py-0.5 bg-[#2a2a2a] rounded">?</kbd> anytime to see shortcuts
        </div>
      </DialogContent>
    </Dialog>
  );
}