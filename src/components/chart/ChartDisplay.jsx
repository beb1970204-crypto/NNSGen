import React from "react";
import { chordToRoman } from "@/components/chordConversion";
import EditableMeasure from "./EditableMeasure";
import MeasureContextMenu from "./MeasureContextMenu";
import SectionContextMenu from "./SectionContextMenu";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";

export default function ChartDisplay({ 
  sections, 
  chartKey, 
  displayMode, 
  editMode = false,
  onUpdateSection,
  onAddMeasure,
  onMeasureClick,
  selectedMeasureIndex,
  selectedSectionId,
  onDeleteSection,
  onDuplicateSection,
  onMoveSectionUp,
  onMoveSectionDown
}) {
  const renderChord = (chordObj) => {
    const chordText = typeof chordObj === 'string' ? chordObj : chordObj.chord;
    const bassNote = typeof chordObj === 'object' && chordObj.bass_note ? chordObj.bass_note : null;
    
    let displayText = chordText;
    if (displayMode === 'roman') {
      displayText = chordToRoman(chordText, chartKey);
    }
    
    // Add bass note if present
    if (bassNote) {
      displayText += `/${bassNote}`;
    }
    
    return displayText;
  };

  // Larger, more prominent measure cells for the new design
  const baseFontSize = 'text-3xl';
  const measurePadding = 'p-6';
  const measureHeight = 'min-h-[120px]';

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
      'Chorus': { border: 'border-l-red-600', bg: 'bg-red-600', text: 'text-red-600' },
      'Verse': { border: 'border-l-blue-600', bg: 'bg-blue-600', text: 'text-blue-600' },
      'Bridge': { border: 'border-l-orange-600', bg: 'bg-orange-600', text: 'text-orange-600' },
      'Intro': { border: 'border-l-purple-600', bg: 'bg-purple-600', text: 'text-purple-600' },
      'Outro': { border: 'border-l-indigo-600', bg: 'bg-indigo-600', text: 'text-indigo-600' },
      'Pre': { border: 'border-l-yellow-600', bg: 'bg-yellow-600', text: 'text-yellow-600' },
      'Instrumental Solo': { border: 'border-l-green-600', bg: 'bg-green-600', text: 'text-green-600' },
    };
    return colors[label] || { border: 'border-l-gray-600', bg: 'bg-gray-600', text: 'text-gray-600' };
  };

  const handleDuplicateMeasure = (section, measureIdx) => {
    const measure = section.measures[measureIdx];
    const updatedMeasures = [...section.measures];
    updatedMeasures.splice(measureIdx + 1, 0, { ...measure });
    onUpdateSection(section.id, { measures: updatedMeasures });
  };

  const handleInsertAfter = (section, measureIdx) => {
    const newMeasure = {
      chords: [{ chord: '-', beats: 4, symbols: [] }],
      cue: ''
    };
    const updatedMeasures = [...section.measures];
    updatedMeasures.splice(measureIdx + 1, 0, newMeasure);
    onUpdateSection(section.id, { measures: updatedMeasures });
  };

  const renderMeasureCell = (measure, measureIdx, section) => {
    const chordCount = measure.chords?.length || 0;
    const hasSplit = chordCount === 2;
    const hasDotNotation = measure.chords?.some(c => c.beats && c.beats !== 4 && c.beats !== 2);
    const isSelected = selectedSectionId === section.id && selectedMeasureIndex === measureIdx;

    const measureElement = (
      <div
        key={measureIdx}
        onClick={() => onMeasureClick && onMeasureClick(measure, measureIdx, section)}
        className={`bg-[#1a1a1a] border ${isSelected ? 'border-2 border-red-600 shadow-xl shadow-red-600/30 scale-[1.02]' : 'border-[#2a2a2a]'} rounded-lg ${measurePadding} ${measureHeight} flex flex-col justify-center relative cursor-pointer hover:bg-[#252525] hover:border-[#3a3a3a] hover:scale-[1.01] transition-all duration-200`}
        style={{ minWidth: '160px' }}
      >
        <div className={`text-white ${baseFontSize} font-bold chart-chord relative`}>
          {/* Single Chord - Centered */}
          {chordCount === 1 && (
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                {hasDotNotation && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg text-yellow-500">●</span>
                )}
                <span className={measure.chords[0].chord === '-' ? 'text-[#3a3a3a]' : ''}>
                  {renderChord(measure.chords[0])}
                </span>
                {measure.chords[0].symbols?.length > 0 && (
                  <span className="ml-3 text-lg text-yellow-500">
                    {renderSymbols(measure.chords[0].symbols)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Split Chords - Two Chords with Underline */}
          {hasSplit && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-around w-full relative">
                {measure.chords.map((chordObj, chordIdx) => (
                  <div key={chordIdx} className="relative flex-1 text-center">
                    {hasDotNotation && chordObj.beats && chordObj.beats !== 2 && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg text-yellow-500">●</span>
                    )}
                    <span className={chordObj.chord === '-' ? 'text-[#3a3a3a]' : ''}>
                      {renderChord(chordObj)}
                    </span>
                    {chordObj.symbols?.length > 0 && (
                      <span className="ml-2 text-lg text-yellow-500">
                        {renderSymbols(chordObj.symbols)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {/* Underline for split chords */}
              <div className="w-full h-0.5 bg-[#4a4a4a]" />
            </div>
          )}

          {/* More than 2 chords - Stacked vertically */}
          {chordCount > 2 && (
            <div className="flex flex-col items-center gap-2">
              {measure.chords.map((chordObj, chordIdx) => (
                <div key={chordIdx} className="flex items-center gap-2">
                  <span className={chordObj.chord === '-' ? 'text-[#3a3a3a]' : ''}>
                    {renderChord(chordObj)}
                    {chordObj.beats && chordObj.beats < 4 && (
                      <span className="text-lg ml-2 text-[#a0a0a0]">({chordObj.beats})</span>
                    )}
                  </span>
                  {chordObj.symbols?.length > 0 && (
                    <span className="text-lg text-yellow-500">
                      {renderSymbols(chordObj.symbols)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {measure.cue && (
          <div className="text-xs mt-3 pt-2 border-t border-[#2a2a2a] text-[#a0a0a0] italic">
            {measure.cue}
          </div>
        )}
      </div>
    );

    // Wrap in context menu if in edit mode
    if (editMode) {
      return (
        <MeasureContextMenu
          key={measureIdx}
          trigger={measureElement}
          onEditChord={() => onMeasureClick && onMeasureClick(measure, measureIdx, section)}
          onAddChord={() => {
            const newChord = { chord: '-', beats: 4, symbols: [] };
            const updatedMeasure = {
              ...measure,
              chords: [...measure.chords, newChord]
            };
            handleUpdateMeasure(section, measureIdx, updatedMeasure);
          }}
          onDeleteMeasure={() => handleDeleteMeasure(section, measureIdx)}
          onDuplicateMeasure={() => handleDuplicateMeasure(section, measureIdx)}
          onInsertAfter={() => handleInsertAfter(section, measureIdx)}
          chordCount={chordCount}
        />
      );
    }

    return measureElement;
  };

  return (
    <div className="space-y-8 chart-grid">
      {sections.map((section, sectionIdx) => {
        const sectionColors = getSectionColor(section.label);
        
        const sectionContent = (
          <div key={section.id || sectionIdx} className={`bg-[#0a0a0a] rounded-xl border-2 ${sectionColors.border} overflow-hidden`}>
            {/* Section Header with Color Bar */}
            <div className={`${sectionColors.bg} px-6 py-4 flex items-center gap-3`}>
              {editMode && (
                <div className="cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-5 h-5 text-white/50" />
                </div>
              )}
              <div className="flex items-center justify-between flex-1">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black text-white uppercase tracking-wide">
                    {section.label}
                  </h3>
                  {section.repeat_count > 1 && (
                    <span className="bg-white/20 text-white px-3 py-1 rounded text-sm font-semibold">
                      x{section.repeat_count}
                    </span>
                  )}
                  {section.modulation_key && (
                    <span className="bg-yellow-500 text-black px-3 py-1 rounded text-sm font-bold">
                      MOD to {section.modulation_key}
                    </span>
                  )}
                </div>
                {section.pivot_cue && (
                  <div className="text-sm text-white/80 italic">
                    Pivot: {section.pivot_cue}
                  </div>
                )}
              </div>
              {section.arrangement_cue && (
                <div className="text-sm text-white/70 mt-2 italic">
                  {section.arrangement_cue}
                </div>
              )}
            </div>

            {/* Measures Grid */}
            <div className="p-6">
              <div className="grid grid-cols-4 gap-4">
            {section.measures?.map((measure, measureIdx) => 
              renderMeasureCell(measure, measureIdx, section)
            )}

                {editMode && (
                  <button
                    onClick={() => onAddMeasure(section.id)}
                    className="bg-[#1a1a1a] border-2 border-dashed border-[#2a2a2a] rounded-lg p-6 min-h-[120px] flex items-center justify-center hover:border-red-600 hover:bg-[#252525] transition-all"
                    style={{ minWidth: '160px' }}
                  >
                    <Plus className="w-8 h-8 text-[#6b6b6b]" />
                  </button>
                )}
              </div>

              {(!section.measures || section.measures.length === 0) && (
                <div className="text-[#6b6b6b] text-center py-12 italic">
                  No measures in this section
                </div>
              )}
            </div>
          </div>
        );

        if (editMode) {
          return (
            <Draggable key={section.id} draggableId={section.id} index={sectionIdx}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={snapshot.isDragging ? 'opacity-50' : ''}
                >
                  <SectionContextMenu
                    trigger={sectionContent}
                    onDuplicate={() => onDuplicateSection && onDuplicateSection(section)}
                    onDelete={() => onDeleteSection && onDeleteSection(section.id)}
                    onMoveUp={() => onMoveSectionUp && onMoveSectionUp(sectionIdx)}
                    onMoveDown={() => onMoveSectionDown && onMoveSectionDown(sectionIdx)}
                    canMoveUp={sectionIdx > 0}
                    canMoveDown={sectionIdx < sections.length - 1}
                  />
                </div>
              )}
            </Draggable>
          );
        }

        return sectionContent;
      })}
    </div>
  );
}