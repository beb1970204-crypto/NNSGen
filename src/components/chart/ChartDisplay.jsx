import React from "react";
import { chordToNNS } from "@/components/chordConversion";
import EditableMeasure from "./EditableMeasure";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ChartDisplay({ 
  sections, 
  chartKey, 
  displayMode, 
  editMode = false,
  onUpdateSection,
  onAddMeasure 
}) {
  const renderChord = (chord) => {
    if (displayMode === 'nashville') {
      return chordToNNS(chord, chartKey);
    }
    return chord;
  };

  // Dynamic font sizing based on total measures
  const totalMeasures = sections.reduce((sum, section) => sum + (section.measures?.length || 0), 0);
  const baseFontSize = totalMeasures > 32 ? 'text-base' : totalMeasures > 24 ? 'text-lg' : 'text-xl';
  const measurePadding = totalMeasures > 32 ? 'p-2' : 'p-3';
  const measureHeight = totalMeasures > 32 ? 'min-h-[70px]' : 'min-h-[80px]';

  const handleUpdateMeasure = (section, measureIdx, updatedMeasure) => {
    const updatedMeasures = [...section.measures];
    updatedMeasures[measureIdx] = updatedMeasure;
    onUpdateSection(section.id, { measures: updatedMeasures });
  };

  const handleDeleteMeasure = (section, measureIdx) => {
    const updatedMeasures = section.measures.filter((_, idx) => idx !== measureIdx);
    onUpdateSection(section.id, { measures: updatedMeasures });
  };

  const renderSymbols = (symbols) => {
    if (!symbols || symbols.length === 0) return null;
    const symbolMap = {
      diamond: "◆", marcato: "^", push: ">", pull: "<", 
      fermata: "𝄐", bass_up: "↑", bass_down: "↓"
    };
    return symbols.map(s => symbolMap[s] || s).join(' ');
  };

  return (
    <div className="space-y-6 font-mono" style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}>
      {sections.map((section, sectionIdx) => (
        <div key={section.id || sectionIdx} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          {/* Section Header */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-indigo-400 inline-block">
              [{section.label}]
              {section.repeat_count > 1 && (
                <span className="ml-2 text-sm text-slate-400">x{section.repeat_count}</span>
              )}
            </h3>
            {section.arrangement_cue && (
              <div className="text-sm text-yellow-400 mt-1 italic">
                {section.arrangement_cue}
              </div>
            )}
          </div>

          {/* Measures Grid */}
          <div className="grid grid-cols-4 gap-3 md:gap-4">
            {section.measures?.map((measure, measureIdx) => (
              editMode ? (
                <EditableMeasure
                  key={measureIdx}
                  measure={measure}
                  measureIdx={measureIdx}
                  onUpdateMeasure={(updated) => handleUpdateMeasure(section, measureIdx, updated)}
                  onDeleteMeasure={() => handleDeleteMeasure(section, measureIdx)}
                  baseFontSize={baseFontSize}
                  measurePadding={measurePadding}
                  measureHeight={measureHeight}
                />
              ) : (
                <div
                  key={measureIdx}
                  className={`bg-slate-900 border border-slate-600 rounded ${measurePadding} ${measureHeight} flex flex-col justify-center`}
                >
                  <div className={`text-white space-y-1 ${baseFontSize}`}>
                    {measure.chords?.map((chordObj, chordIdx) => (
                      <div key={chordIdx} className="flex items-center gap-2">
                        <span className={chordObj.chord === '-' ? 'text-slate-500' : ''}>
                          {renderChord(chordObj.chord)}
                        </span>
                        {chordObj.symbols?.length > 0 && (
                          <span className="text-xs text-indigo-300">
                            {renderSymbols(chordObj.symbols)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {measure.cue && (
                    <div className="text-xs text-orange-400 mt-1 italic">
                      {measure.cue}
                    </div>
                  )}
                </div>
              )
            ))}

            {editMode && (
              <button
                onClick={() => onAddMeasure(section.id)}
                className="bg-slate-900 border-2 border-dashed border-slate-600 rounded p-3 min-h-[80px] flex items-center justify-center hover:border-indigo-500 hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-6 h-6 text-slate-500" />
              </button>
            )}
          </div>

          {(!section.measures || section.measures.length === 0) && (
            <div className="text-slate-500 text-center py-8 italic">
              No measures in this section
            </div>
          )}
        </div>
      ))}
    </div>
  );
}