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

  const getSectionColor = (label) => {
    const colors = {
      'Verse': 'border-l-[#4A90E2]',
      'Chorus': 'border-l-[#D0021B]',
      'Bridge': 'border-l-[#F5A623]',
    };
    return colors[label] || 'border-l-slate-600';
  };

  return (
    <div className="space-y-6 chart-grid">
      {sections.map((section, sectionIdx) => (
        <div key={section.id || sectionIdx} className={`bg-[#121212] rounded-lg p-6 border border-[#333333] border-l-4 ${getSectionColor(section.label)}`}>
          {/* Section Header */}
          <div className="mb-4">
            <div className="inline-block bg-[#F5F5F5] text-[#121212] px-3 py-1 rounded chart-section-header text-sm">
              {section.label.toUpperCase()}
              {section.repeat_count > 1 && (
                <span className="ml-2 font-normal">x{section.repeat_count}</span>
              )}
            </div>
            {section.arrangement_cue && (
              <div className="arrangement-cue text-sm mt-2">
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
                  className={`bg-[#1a1a1a] border-r border-[#333333] ${measurePadding} ${measureHeight} flex flex-col justify-center relative`}
                  style={{ minWidth: '140px' }}
                >
                  <div className={`text-[#F5F5F5] space-y-1 ${baseFontSize} chart-chord`}>
                    {measure.chords?.map((chordObj, chordIdx) => (
                      <div key={chordIdx} className="flex items-center gap-2">
                        <span className={chordObj.chord === '-' ? 'text-[#333333]' : ''}>
                          {renderChord(chordObj.chord)}
                          {chordObj.beats && chordObj.beats < 4 && measure.chords.length > 1 && (
                            <span className="text-sm ml-1">({chordObj.beats})</span>
                          )}
                        </span>
                        {chordObj.symbols?.length > 0 && (
                          <span className="text-xs" style={{ color: '#FFD700' }}>
                            {renderSymbols(chordObj.symbols)}
                          </span>
                        )}
                      </div>
                    ))}
                    {measure.chords?.length === 2 && (
                      <div className="absolute bottom-2 left-2 right-2 h-px bg-[#333333]" />
                    )}
                  </div>
                  {measure.cue && (
                    <div className="arrangement-cue text-xs mt-2 pt-1 border-t border-[#333333]">
                      {measure.cue}
                    </div>
                  )}
                </div>
              )
            ))}

            {editMode && (
              <button
                onClick={() => onAddMeasure(section.id)}
                className="bg-[#1a1a1a] border-2 border-dashed border-[#333333] rounded p-3 min-h-[80px] flex items-center justify-center hover:border-[#FFD700] hover:bg-[#121212] transition-colors"
                style={{ minWidth: '140px' }}
              >
                <Plus className="w-6 h-6 text-[#333333]" />
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