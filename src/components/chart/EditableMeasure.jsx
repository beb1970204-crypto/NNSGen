import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import ChordEditor from "./ChordEditor";

export default function EditableMeasure({ 
  measure, 
  measureIdx, 
  onUpdateMeasure, 
  onDeleteMeasure,
  baseFontSize,
  measurePadding,
  measureHeight 
}) {
  const [editingChordIdx, setEditingChordIdx] = useState(null);
  const [isAddingChord, setIsAddingChord] = useState(false);

  const handleSaveChord = (chordIdx, updatedChord) => {
    const updatedChords = [...measure.chords];
    updatedChords[chordIdx] = updatedChord;
    onUpdateMeasure({ ...measure, chords: updatedChords });
    setEditingChordIdx(null);
  };

  const handleDeleteChord = (chordIdx) => {
    if (measure.chords.length === 1) return; // Keep at least one chord
    const updatedChords = measure.chords.filter((_, idx) => idx !== chordIdx);
    onUpdateMeasure({ ...measure, chords: updatedChords });
  };

  const handleAddChord = (newChord) => {
    const updatedChords = [...measure.chords, newChord];
    onUpdateMeasure({ ...measure, chords: updatedChords });
    setIsAddingChord(false);
  };

  const renderSymbols = (symbols) => {
    if (!symbols || symbols.length === 0) return null;
    const symbolMap = {
      diamond: "◆", marcato: "^", push: ">", pull: "<", 
      fermata: "𝄐", bass_up: "↑", bass_down: "↓"
    };
    return (
      <span className="text-xs text-indigo-300 ml-1">
        {symbols.map(s => symbolMap[s]).join(' ')}
      </span>
    );
  };

  return (
    <div className={`bg-slate-900 border border-slate-600 rounded ${measurePadding} ${measureHeight} flex flex-col justify-between relative group`}>
      <div className={`text-white space-y-1 ${baseFontSize}`}>
        {measure.chords?.map((chordObj, chordIdx) => (
          <div key={chordIdx}>
            {editingChordIdx === chordIdx ? (
              <ChordEditor
                chord={chordObj}
                onSave={(updated) => handleSaveChord(chordIdx, updated)}
                onCancel={() => setEditingChordIdx(null)}
              />
            ) : (
              <div className="flex items-center justify-between group/chord">
                <button
                  onClick={() => setEditingChordIdx(chordIdx)}
                  className="flex-1 text-left hover:bg-slate-800 rounded px-1 py-0.5 transition-colors"
                >
                  {chordObj.chord}
                  {renderSymbols(chordObj.symbols)}
                </button>
                {measure.chords.length > 1 && (
                  <button
                    onClick={() => handleDeleteChord(chordIdx)}
                    className="opacity-0 group-hover/chord:opacity-100 p-1 hover:bg-red-900 rounded transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-red-300" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {isAddingChord && (
          <ChordEditor
            chord={{ chord: '', symbols: [] }}
            onSave={handleAddChord}
            onCancel={() => setIsAddingChord(false)}
          />
        )}
      </div>

      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          onClick={() => setIsAddingChord(true)}
          size="sm"
          variant="ghost"
          className="h-6 text-xs flex-1 text-slate-400 hover:text-white"
        >
          <Plus className="w-3 h-3 mr-1" />
          Chord
        </Button>
        <Button
          onClick={onDeleteMeasure}
          size="sm"
          variant="ghost"
          className="h-6 text-xs text-red-400 hover:text-red-300 hover:bg-red-900"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {measure.cue && (
        <div className="text-xs text-slate-400 italic mt-2 border-t border-slate-700 pt-1">
          {measure.cue}
        </div>
      )}
    </div>
  );
}