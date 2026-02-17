import React from "react";
import { Edit, Plus, Trash2, Copy, MoreHorizontal } from "lucide-react";

export default function MeasureContextMenu({ 
  trigger, 
  onEditChord, 
  onAddChord, 
  onDeleteMeasure,
  onDuplicateMeasure,
  onInsertAfter,
  chordCount 
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleAction = (e, action) => {
    e.stopPropagation();
    action();
    setOpen(false);
  };

  // Render as a single grid-cell div so it doesn't break CSS grid layout
  return (
    <div ref={ref} className="relative group">
      {trigger}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-all z-10"
        style={{ opacity: open ? 1 : undefined }}
      >
        <MoreHorizontal className="w-3 h-3 text-[#a0a0a0]" />
      </button>
      {open && (
        <div className="absolute top-8 right-1 z-50 w-48 bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg shadow-xl p-1 space-y-0.5">
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-[#2a2a2a] rounded-md transition-colors text-left"
            onClick={(e) => handleAction(e, onEditChord)}
          >
            <Edit className="w-3.5 h-3.5" />
            Edit Chord{chordCount > 1 ? 's' : ''}
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-[#2a2a2a] rounded-md transition-colors text-left"
            onClick={(e) => handleAction(e, onAddChord)}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Chord
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-[#2a2a2a] rounded-md transition-colors text-left"
            onClick={(e) => handleAction(e, onDuplicateMeasure)}
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicate
          </button>
          {onInsertAfter && (
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-[#2a2a2a] rounded-md transition-colors text-left"
              onClick={(e) => handleAction(e, onInsertAfter)}
            >
              <Plus className="w-3.5 h-3.5" />
              Insert After
            </button>
          )}
          <div className="h-px bg-[#3a3a3a] my-1" />
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[#2a2a2a] rounded-md transition-colors text-left"
            onClick={(e) => handleAction(e, onDeleteMeasure)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}