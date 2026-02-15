import React from "react";
import { Button } from "@/components/ui/button";
import { Bold, Square, ArrowUp, ArrowDown, Eye, Plus, Trash2, ZoomIn, ZoomOut } from "lucide-react";

export default function ChartToolbar({ 
  onBold,
  onBox,
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
    <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          disabled={!hasSelection}
          onClick={onBold}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          disabled={!hasSelection}
          onClick={onBox}
        >
          <Square className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-[#2a2a2a] mx-2" />
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          disabled={!hasSelection}
          onClick={onUp}
        >
          <ArrowUp className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          disabled={!hasSelection}
          onClick={onDown}
        >
          <ArrowDown className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-[#2a2a2a] mx-2" />
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={onToggleView}
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={onAddMeasure}
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
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
          className="h-8 w-8 p-0"
          onClick={onZoomOut}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs text-[#a0a0a0] min-w-[3rem] text-center">{zoomLevel}%</span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={onZoomIn}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}