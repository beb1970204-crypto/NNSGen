import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Eye, Plus, Trash2, ZoomIn, ZoomOut } from "lucide-react";

export default function ChartToolbar({ 
  onUp,
  onDown,
  onToggleView,
  onAddMeasure,
  onDelete,
  hasSelection,
  zoomLevel = 100,
  onZoomIn,
  onZoomOut
}) {
  return (
    <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between transition-all">
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0 hover:bg-red-600/10 hover:text-red-500 transition-all"
          disabled={!hasSelection}
          onClick={onUp}
        >
          <ArrowUp className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0 hover:bg-red-600/10 hover:text-red-500 transition-all"
          disabled={!hasSelection}
          onClick={onDown}
        >
          <ArrowDown className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-[#2a2a2a] mx-2" />
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0 hover:bg-red-600/10 hover:text-red-500 transition-all"
          onClick={onToggleView}
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0 hover:bg-green-600/10 hover:text-green-500 transition-all"
          onClick={onAddMeasure}
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0 text-red-500 hover:bg-red-600/20 hover:text-red-400 transition-all"
          disabled={!hasSelection}
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0 hover:bg-red-600/10 hover:text-red-500 transition-all"
          onClick={onZoomOut}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs text-[#a0a0a0] min-w-[3.5rem] text-center font-semibold">{zoomLevel}%</span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0 hover:bg-red-600/10 hover:text-red-500 transition-all"
          onClick={onZoomIn}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}