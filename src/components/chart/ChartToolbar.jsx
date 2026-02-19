import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Plus, Trash2, ZoomIn, ZoomOut, ArrowLeft, BookOpen } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ChartToolbar({ 
  onUp,
  onDown,
  onAddMeasure,
  onDelete,
  hasSelection,
  zoomLevel = 100,
  onZoomIn,
  onZoomOut,
  editMode = true,
  onToggleEditMode,
  displayMode = 'chords',
  onToggleDisplayMode,
  onToggleMusicTheory
}) {
  return (
    <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between transition-all">
      <div className="flex items-center gap-1">
        <Link to={createPageUrl("Home")}>
          <Button variant="ghost" size="sm" className="h-9 px-3 gap-1.5 hover:bg-red-600/10 hover:text-red-500 transition-all text-[#a0a0a0]">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <div className="w-px h-6 bg-[#2a2a2a] mx-1" />
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
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
          <span className={`text-xs font-semibold transition-colors ${editMode ? 'text-red-500' : 'text-[#6b6b6b]'}`}>Edit</span>
          <Switch 
            checked={!editMode}
            onCheckedChange={() => onToggleEditMode?.()}
            className="h-5 w-9"
          />
          <span className={`text-xs font-semibold transition-colors ${!editMode ? 'text-blue-500' : 'text-[#6b6b6b]'}`}>Read</span>
        </div>
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

      <div className="flex items-center gap-3">
        {!editMode && (
          <>
            <div className="w-px h-6 bg-[#2a2a2a]" />
            <div className="flex items-center gap-1">
              <Button
                variant={displayMode === 'chords' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2.5 text-xs font-semibold"
                onClick={() => onToggleDisplayMode?.('chords')}
              >
                Chords
              </Button>
              <Button
                variant={displayMode === 'roman' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2.5 text-xs font-semibold"
                onClick={() => onToggleDisplayMode?.('roman')}
              >
                Roman
              </Button>
              <Button
                variant={displayMode === 'nns' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2.5 text-xs font-semibold"
                onClick={() => onToggleDisplayMode?.('nns')}
              >
                NNS
              </Button>
            </div>
          </>
        )}
        <div className="w-px h-6 bg-[#2a2a2a]" />
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