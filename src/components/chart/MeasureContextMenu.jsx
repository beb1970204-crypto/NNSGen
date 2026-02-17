import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Trash2, Copy } from "lucide-react";

export default function MeasureContextMenu({ 
  trigger, 
  onEditChord, 
  onAddChord, 
  onDeleteMeasure,
  onDuplicateMeasure,
  chordCount 
}) {
  const [open, setOpen] = React.useState(false);

  const handleAction = (action) => {
    action();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="block">
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => handleAction(onEditChord)}
          >
            <Edit className="w-4 h-4" />
            Edit Chord{chordCount > 1 ? 's' : ''}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => handleAction(onAddChord)}
          >
            <Plus className="w-4 h-4" />
            Add Chord
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => handleAction(onDuplicateMeasure)}
          >
            <Copy className="w-4 h-4" />
            Duplicate Measure
          </Button>
          <div className="h-px bg-slate-200 my-1" />
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleAction(onDeleteMeasure)}
          >
            <Trash2 className="w-4 h-4" />
            Delete Measure
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}