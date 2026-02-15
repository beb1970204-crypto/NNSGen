import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import ChordEditor from "./ChordEditor";
import MeasureContextMenu from "./MeasureContextMenu";

export default function EditableMeasure({ 
  measure, 
  measureIdx, 
  onUpdateMeasure, 
  onDeleteMeasure,
  onDuplicateMeasure,
  baseFontSize,
  measurePadding,
  measureHeight 
}) {
  const [editingChordIdx, setEditingChordIdx] = useState(null);
  const [isAddingChord, setIsAddingChord] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

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
      <span className="text-xs ml-1" style={{ color: '#FFD700' }}>
        {symbols.map(s => symbolMap[s]).join(' ')}
      </span>
    );
  };

  const chordCount = measure.chords?.length || 0;
  const hasSplit = chordCount === 2;
  const hasDotNotation = measure.chords?.some(c => c.beats && c.beats !== 4 && c.beats !== 2);

  const handleDuplicateMeasure = () => {
    onDuplicateMeasure?.(measure);
  };

  const measureContent = (
    <div className={`text-[#F5F5F5] ${baseFontSize} chart-chord`}>
      {/* Single Chord - Centered */}
      {chordCount === 1 && !showEditor && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="relative">
            {hasDotNotation && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs" style={{ color: '#FFD700' }}>●</span>
            )}
            <span className="chart-chord">{measure.chords[0].chord}</span>
            {renderSymbols(measure.chords[0].symbols)}
          </div>
        </div>
      )}

      {/* Split Chords - Two Chords with Underline */}
      {hasSplit && !showEditor && (
        <div className="flex flex-col items-center gap-1 justify-center h-full">
          <div className="flex items-center justify-around w-full">
            {measure.chords.map((chordObj, chordIdx) => (
              <div key={chordIdx} className="relative flex-1 text-center">
                {hasDotNotation && chordObj.beats && chordObj.beats !== 2 && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs" style={{ color: '#FFD700' }}>●</span>
                )}
                <span className="chart-chord">{chordObj.chord}</span>
                {renderSymbols(chordObj.symbols)}
              </div>
            ))}
          </div>
          <div className="w-full h-px bg-[#555555] mx-2" />
        </div>
      )}

      {/* Editor or Multi-chord view */}
      {(showEditor || editingChordIdx !== null || isAddingChord || chordCount > 2) && (
          <div className="space-y-1">
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
                      className="flex-1 text-left hover:bg-[#121212] rounded px-1 py-0.5 transition-colors"
                    >
                      <span className="chart-chord">{chordObj.chord}</span>
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
        )}
      </div>
    </div>
  );

  return (
    <MeasureContextMenu
      trigger={
        <div className={`bg-[#1a1a1a] border border-[#333333] rounded ${measurePadding} ${measureHeight} flex flex-col justify-between relative group cursor-pointer hover:border-[#FFD700] transition-colors`} style={{ minWidth: '140px' }}>
          {measureContent}
          {measure.cue && (
            <div className="arrangement-cue text-xs mt-2 border-t border-[#333333] pt-1">
              {measure.cue}
            </div>
          )}
        </div>
      }
      onEditChord={() => {
        setShowEditor(true);
        setEditingChordIdx(0);
      }}
      onAddChord={() => setIsAddingChord(true)}
      onDeleteMeasure={onDeleteMeasure}
      onDuplicateMeasure={handleDuplicateMeasure}
      chordCount={chordCount}
    />
  );
}