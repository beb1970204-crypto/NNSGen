import React, { useState } from "react";
import { Copy, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export default function SectionContextMenu({ 
  trigger, 
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) {
  const [open, setOpen] = useState(false);

  const handleAction = (action) => {
    action();
    setOpen(false);
  };

  return (
    <div className="relative">
      <div onContextMenu={(e) => {
        e.preventDefault();
        setOpen(!open);
      }}>
        {trigger}
      </div>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 z-50 w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl p-2">
            {canMoveUp && (
              <button 
                onClick={() => handleAction(onMoveUp)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#252525] rounded text-sm transition-colors text-white"
              >
                <ArrowUp className="w-4 h-4" />
                Move Up
              </button>
            )}

            {canMoveDown && (
              <button 
                onClick={() => handleAction(onMoveDown)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#252525] rounded text-sm transition-colors text-white"
              >
                <ArrowDown className="w-4 h-4" />
                Move Down
              </button>
            )}

            <button 
              onClick={() => handleAction(onDuplicate)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#252525] rounded text-sm transition-colors text-white"
            >
              <Copy className="w-4 h-4" />
              Duplicate Section
            </button>

            <div className="h-px bg-[#2a2a2a] my-1" />

            <button 
              onClick={() => handleAction(onDelete)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-600/20 rounded text-sm transition-colors text-red-500"
            >
              <Trash2 className="w-4 h-4" />
              Delete Section
            </button>
          </div>
        </>
      )}
    </div>
  );
}