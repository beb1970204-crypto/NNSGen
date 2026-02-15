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

  const renderMeasureCell = (measure, measureIdx, section) => {
    const chordCount = measure.chords?.length || 0;
    const hasSplit = chordCount === 2;
    const hasDotNotation = measure.chords?.some(c => c.beats && c.beats !== 4 && c.beats !== 2);
    const hasSyncopation = measure.chords?.some(c => c.chord?.includes('/'));

    return (
      <div
        key={measureIdx}
        className={`bg-[#1a1a1a] border-r border-[#333333] ${measurePadding} ${measureHeight} flex flex-col justify-center relative`}
        style={{ minWidth: '140px' }}
      >
        <div className={`text-[#F5F5F5] ${baseFontSize} chart-chord relative`}>
          {/* Single Chord - Centered */}
          {chordCount === 1 && (
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                {hasDotNotation && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs" style={{ color: '#FFD700' }}>●</span>
                )}
                <span className={measure.chords[0].chord === '-' ? 'text-[#333333]' : ''}>
                  {renderChord(measure.chords[0].chord)}
                  {hasSyncopation && <span className="ml-1 text-sm opacity-70">/</span>}
                </span>
                {measure.chords[0].symbols?.length > 0 && (
                  <span className="ml-2 text-xs" style={{ color: '#FFD700' }}>
                    {renderSymbols(measure.chords[0].symbols)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Split Chords - Two Chords with Underline */}
          {hasSplit && (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-around w-full relative">
                {measure.chords.map((chordObj, chordIdx) => (
                  <div key={chordIdx} className="relative flex-1 text-center">
                    {hasDotNotation && chordObj.beats && chordObj.beats !== 2 && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs" style={{ color: '#FFD700' }}>●</span>
                    )}
                    <span className={chordObj.chord === '-' ? 'text-[#333333]' : ''}>
                      {renderChord(chordObj.chord)}
                    </span>
                    {chordObj.symbols?.length > 0 && (
                      <span className="ml-1 text-xs" style={{ color: '#FFD700' }}>
                        {renderSymbols(chordObj.symbols)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {/* Underline for split chords */}
              <div className="w-full h-px bg-[#555555] mx-2" />
            </div>
          )}

          {/* More than 2 chords - Stacked vertically */}
          {chordCount > 2 && (
            <div className="flex flex-col items-center gap-1">
              {measure.chords.map((chordObj, chordIdx) => (
                <div key={chordIdx} className="flex items-center gap-2">
                  <span className={chordObj.chord === '-' ? 'text-[#333333]' : ''}>
                    {renderChord(chordObj.chord)}
                    {chordObj.beats && chordObj.beats < 4 && (
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
            </div>
          )}
        </div>
        {measure.cue && (
          <div className="arrangement-cue text-xs mt-2 pt-1 border-t border-[#333333]">
            {measure.cue}
          </div>
        )}
      </div>
    );
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

          {/* Measures Grid - Responsive: Mobile(4), Tablet(8), Desktop(2-column split) */}
          <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-8 xl:grid-cols-8 gap-3 md:gap-4">
            {section.measures?.map((measure, measureIdx) => (
              editMode ? (
                <EditableMeasure
                  key={measureIdx}
                  measure={measure}
                  measureIdx={measureIdx}
                  onUpdateMeasure={(updated) => handleUpdateMeasure(section, measureIdx, updated)}
                  onDeleteMeasure={() => handleDeleteMeasure(section, measureIdx)}
                  onDuplicateMeasure={(measure) => {
                    const updatedMeasures = [...section.measures];
                    updatedMeasures.splice(measureIdx + 1, 0, { ...measure });
                    onUpdateSection(section.id, { measures: updatedMeasures });
                  }}
                  baseFontSize={baseFontSize}
                  measurePadding={measurePadding}
                  measureHeight={measureHeight}
                />
              ) : (
                renderMeasureCell(measure, measureIdx, section)
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