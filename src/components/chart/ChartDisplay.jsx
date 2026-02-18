import React from "react";
import { chordToRoman, chordToNNS } from "@/components/chordConversion";
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

  const baseFontSize = 'text-2xl';
  const measurePadding = 'p-4';
  const measureHeight = 'min-h-[100px]';

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
      'Chorus':            { border: 'border-l-red-500',    bg: 'bg-red-500',    text: 'text-red-500' },
      'Verse':             { border: 'border-l-blue-500',   bg: 'bg-blue-500',   text: 'text-blue-500' },
      'Bridge':            { border: 'border-l-yellow-500', bg: 'bg-yellow-500', text: 'text-yellow-500' },
      'Intro':             { border: 'border-l-purple-500', bg: 'bg-purple-500', text: 'text-purple-500' },
      'Outro':             { border: 'border-l-indigo-400', bg: 'bg-indigo-400', text: 'text-indigo-400' },
      'Pre':               { border: 'border-l-orange-400', bg: 'bg-orange-400', text: 'text-orange-400' },
      'Instrumental Solo': { border: 'border-l-green-500',  bg: 'bg-green-500',  text: 'text-green-500' },
    };
    return colors[label] || { border: 'border-l-gray-500', bg: 'bg-gray-500', text: 'text-gray-500' };
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
    const isSelected = selectedSectionId === section.id && selectedMeasureIndex === measureIdx;

    const chordContent = (
      <div className={`text-white ${baseFontSize} font-bold chart-chord`}>
        {chordCount === 1 && (
          <div className="flex items-center justify-center">
            <span className={measure.chords[0].chord === '-' ? 'text-[#3a3a3a]' : ''}>
              {renderChord(measure.chords[0])}
            </span>
            {measure.chords[0].symbols?.length > 0 && (
              <span className="ml-2 text-lg text-yellow-500">{renderSymbols(measure.chords[0].symbols)}</span>
            )}
          </div>
        )}
        {hasSplit && (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center justify-around w-full">
              {measure.chords.map((chordObj, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className={chordObj.chord === '-' ? 'text-[#3a3a3a]' : ''}>{renderChord(chordObj)}</span>
                </div>
              ))}
            </div>
            <div className="w-full h-0.5 bg-[#4a4a4a]" />
          </div>
        )}
        {chordCount > 2 && (
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 w-full">
            {measure.chords.map((chordObj, i) => (
              <div key={i} className={`text-center ${chordObj.chord === '-' ? 'text-[#3a3a3a]' : ''}`}>
                {renderChord(chordObj)}
              </div>
            ))}
          </div>
        )}
      </div>
    );

    if (editMode) {
      return (
        <MeasureContextMenu
          key={measureIdx}
          onEditChord={() => onMeasureClick && onMeasureClick(measure, measureIdx, section)}
          onAddChord={() => handleUpdateMeasure(section, measureIdx, { ...measure, chords: [...measure.chords, { chord: '-', beats: 4, symbols: [] }] })}
          onDeleteMeasure={() => handleDeleteMeasure(section, measureIdx)}
          onDuplicateMeasure={() => handleDuplicateMeasure(section, measureIdx)}
          onInsertAfter={() => handleInsertAfter(section, measureIdx)}
          chordCount={chordCount}
          onClick={() => onMeasureClick && onMeasureClick(measure, measureIdx, section)}
          isSelected={isSelected}
          measurePadding={measurePadding}
          measureHeight={measureHeight}
          cue={measure.cue}
        >
          {chordContent}
        </MeasureContextMenu>
      );
    }

    return (
      <div
        key={measureIdx}
        onClick={() => onMeasureClick && onMeasureClick(measure, measureIdx, section)}
        className={`bg-[#1a1a1a] border ${isSelected ? 'border-red-600 shadow-lg shadow-red-600/20' : 'border-[#2a2a2a]'} rounded-lg ${measurePadding} ${measureHeight} flex flex-col justify-center cursor-pointer hover:bg-[#202020] hover:border-[#3a3a3a] transition-all duration-150`}
      >
        {chordContent}
        {measure.cue && (
          <div className="text-xs mt-2 pt-1 border-t border-[#2a2a2a] text-[#a0a0a0] italic">{measure.cue}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 chart-grid">
      {sections.map((section, sectionIdx) => {
        const sectionColors = getSectionColor(section.label);
        
        const barCount = section.measures?.length || 0;

        const sectionContent = (
          <div key={section.id || sectionIdx} className="bg-[#111111] rounded-xl overflow-hidden border border-[#2a2a2a]">
            {/* Section Header - Full colored bar like the design */}
            <div className={`${sectionColors.bg} px-5 py-2.5 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                {editMode && (
                  <div className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4 text-white/40" />
                  </div>
                )}
                <span className="text-sm font-black uppercase tracking-wider text-white">
                  [{section.label}]
                </span>
                <span className="text-xs text-white/60 font-medium">{barCount} bars</span>
                {section.repeat_count > 1 && (
                  <span className="bg-black/20 text-white px-2 py-0.5 rounded text-xs font-semibold">
                    x{section.repeat_count}
                  </span>
                )}
                {section.modulation_key && (
                  <span className="bg-black/30 text-yellow-300 border border-yellow-400/50 px-2 py-0.5 rounded text-xs font-bold">
                    MOD to {section.modulation_key}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {section.arrangement_cue && (
                  <span className="text-xs text-white/50 italic">{section.arrangement_cue}</span>
                )}
                {section.pivot_cue && (
                  <span className="text-xs text-white/50 italic">Pivot: {section.pivot_cue}</span>
                )}
              </div>
            </div>

            {/* Measures Grid */}
            <div className="p-4">
              <div className="grid grid-cols-4 gap-3">
                {section.measures?.map((measure, measureIdx) =>
                  renderMeasureCell(measure, measureIdx, section)
                )}
                {editMode && (
                  <button
                    onClick={() => onAddMeasure(section.id)}
                    className="bg-[#1a1a1a] border-2 border-dashed border-[#2a2a2a] rounded-lg p-4 min-h-[100px] flex items-center justify-center hover:border-red-600 hover:bg-[#1e1e1e] transition-all"
                  >
                    <Plus className="w-6 h-6 text-[#4a4a4a]" />
                  </button>
                )}
              </div>
              {(!section.measures || section.measures.length === 0) && (
                <div className="text-[#4a4a4a] text-center py-8 italic text-sm">
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