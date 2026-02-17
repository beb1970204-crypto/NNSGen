import React, { useState, useRef, useEffect } from "react";
import { chordToRoman } from "@/components/chordConversion";
import SectionContextMenu from "./SectionContextMenu";
import { Plus, GripVertical } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";

// ─── Measure Context Menu ────────────────────────────────────────────────────

function MeasureMenu({ measure, measureIdx, section, onEdit, onAddChord, onDuplicate, onInsertAfter, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handle = (e, fn) => { e.stopPropagation(); fn(); setOpen(false); };

  return (
    <div ref={ref} style={{ position: 'absolute', top: 4, right: 4, zIndex: 20 }}>
      <button
        onMouseDown={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="w-6 h-6 flex items-center justify-center rounded bg-[#2a2a2a] hover:bg-[#3a3a3a] opacity-0 group-hover:opacity-100 transition-opacity text-[#a0a0a0] text-xs"
        style={{ opacity: open ? 1 : undefined }}
      >···</button>
      {open && (
        <div className="absolute top-7 right-0 w-44 bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg shadow-xl p-1">
          {[
            ['Edit Chord', onEdit],
            ['Add Chord', onAddChord],
            ['Duplicate', onDuplicate],
            ['Insert After', onInsertAfter],
          ].map(([label, fn]) => (
            <button key={label} onMouseDown={e => handle(e, fn)}
              className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-[#2a2a2a] rounded-md block">
              {label}
            </button>
          ))}
          <div className="h-px bg-[#3a3a3a] my-1" />
          <button onMouseDown={e => handle(e, onDelete)}
            className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-[#2a2a2a] rounded-md block">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Single Measure Cell ─────────────────────────────────────────────────────

function MeasureCell({ measure, measureIdx, section, isSelected, editMode, onMeasureClick, onUpdateMeasure, onDeleteMeasure, onDuplicateMeasure, onInsertAfter, displayMode, chartKey }) {
  const chords = measure.chords || [];
  const chordCount = chords.length;

  const renderChord = (chordObj) => {
    const chordText = typeof chordObj === 'string' ? chordObj : chordObj.chord;
    let displayText = chordText;
    if (displayMode === 'roman') displayText = chordToRoman(chordText, chartKey);
    if (typeof chordObj === 'object' && chordObj.bass_note) displayText += `/${chordObj.bass_note}`;
    return displayText;
  };

  const renderSymbols = (symbols) => {
    if (!symbols?.length) return null;
    const map = { diamond: "◆", marcato: "^", push: ">", pull: "<", fermata: "𝄐", bass_up: "↑", bass_down: "↓" };
    return symbols.map(s => map[s] || s).join(' ');
  };

  const isDash = (c) => !c || c === '-';

  return (
    <div
      onClick={() => onMeasureClick && onMeasureClick(measure, measureIdx, section)}
      className={`group bg-[#1a1a1a] border rounded-lg p-3 min-h-[90px] flex flex-col justify-center relative cursor-pointer transition-all duration-150
        ${isSelected ? 'border-red-600 shadow-lg shadow-red-600/20' : 'border-[#2a2a2a] hover:bg-[#202020] hover:border-[#3a3a3a]'}`}
    >
      {editMode && (
        <MeasureMenu
          measure={measure}
          measureIdx={measureIdx}
          section={section}
          onEdit={() => onMeasureClick && onMeasureClick(measure, measureIdx, section)}
          onAddChord={() => onUpdateMeasure({ ...measure, chords: [...chords, { chord: '-', beats: 4, symbols: [] }] })}
          onDuplicate={onDuplicateMeasure}
          onInsertAfter={onInsertAfter}
          onDelete={onDeleteMeasure}
        />
      )}

      <div className="text-white font-bold chart-chord w-full">
        {/* 1 chord — centered */}
        {chordCount === 1 && (
          <div className="flex items-center justify-center text-2xl">
            <span className={isDash(chords[0].chord) ? 'text-[#3a3a3a]' : ''}>{renderChord(chords[0])}</span>
            {chords[0].symbols?.length > 0 && <span className="ml-2 text-lg text-yellow-500">{renderSymbols(chords[0].symbols)}</span>}
          </div>
        )}

        {/* 2 chords — side by side */}
        {chordCount === 2 && (
          <div className="flex items-center justify-around w-full text-xl">
            {chords.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="w-px h-6 bg-[#4a4a4a] flex-shrink-0" />}
                <div className="flex-1 text-center">
                  <span className={isDash(c.chord) ? 'text-[#3a3a3a]' : ''}>{renderChord(c)}</span>
                  {c.symbols?.length > 0 && <span className="ml-1 text-sm text-yellow-500">{renderSymbols(c.symbols)}</span>}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* 3–4 chords — 2×2 grid */}
        {chordCount >= 3 && (
          <div className="grid grid-cols-2 gap-x-1 gap-y-1 w-full">
            {chords.map((c, i) => (
              <div key={i} className="text-center text-lg leading-tight">
                <span className={isDash(c.chord) ? 'text-[#3a3a3a]' : ''}>{renderChord(c)}</span>
                {c.beats && c.beats < 4 && <span className="text-xs ml-1 text-[#6b6b6b]">({c.beats}b)</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {measure.cue && (
        <div className="text-xs mt-2 pt-2 border-t border-[#2a2a2a] text-[#a0a0a0] italic truncate">
          {measure.cue}
        </div>
      )}
    </div>
  );
}

// ─── Main ChartDisplay ───────────────────────────────────────────────────────

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
  const getSectionColor = (label) => {
    const colors = {
      'Chorus':            'bg-red-500',
      'Verse':             'bg-blue-500',
      'Bridge':            'bg-yellow-500',
      'Intro':             'bg-purple-500',
      'Outro':             'bg-indigo-400',
      'Pre':               'bg-orange-400',
      'Instrumental Solo': 'bg-green-500',
    };
    return colors[label] || 'bg-gray-500';
  };

  const handleUpdateMeasure = (section, measureIdx, updatedMeasure) => {
    const updatedMeasures = [...section.measures];
    updatedMeasures[measureIdx] = updatedMeasure;
    onUpdateSection(section.id, { measures: updatedMeasures });
  };

  const handleDeleteMeasure = (section, measureIdx) => {
    onUpdateSection(section.id, { measures: section.measures.filter((_, i) => i !== measureIdx) });
  };

  const handleDuplicateMeasure = (section, measureIdx) => {
    const updated = [...section.measures];
    updated.splice(measureIdx + 1, 0, { ...section.measures[measureIdx] });
    onUpdateSection(section.id, { measures: updated });
  };

  const handleInsertAfter = (section, measureIdx) => {
    const updated = [...section.measures];
    updated.splice(measureIdx + 1, 0, { chords: [{ chord: '-', beats: 4, symbols: [] }], cue: '' });
    onUpdateSection(section.id, { measures: updated });
  };

  return (
    <div className="space-y-4 chart-grid">
      {sections.map((section, sectionIdx) => {
        const bgColor = getSectionColor(section.label);
        const barCount = section.measures?.length || 0;

        const sectionContent = (
          <div className="bg-[#111111] rounded-xl overflow-hidden border border-[#2a2a2a]">
            {/* Header */}
            <div className={`${bgColor} px-5 py-2.5 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                {editMode && <GripVertical className="w-4 h-4 text-white/40 cursor-grab" />}
                <span className="text-sm font-black uppercase tracking-wider text-white">[{section.label}]</span>
                <span className="text-xs text-white/60 font-medium">{barCount} bars</span>
                {section.repeat_count > 1 && (
                  <span className="bg-black/20 text-white px-2 py-0.5 rounded text-xs font-semibold">x{section.repeat_count}</span>
                )}
                {section.modulation_key && (
                  <span className="bg-black/30 text-yellow-300 border border-yellow-400/50 px-2 py-0.5 rounded text-xs font-bold">
                    MOD to {section.modulation_key}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {section.arrangement_cue && <span className="text-xs text-white/50 italic">{section.arrangement_cue}</span>}
                {section.pivot_cue && <span className="text-xs text-white/50 italic">Pivot: {section.pivot_cue}</span>}
              </div>
            </div>

            {/* Measures */}
            <div className="p-4">
              {(!section.measures || section.measures.length === 0) ? (
                <div className="text-[#4a4a4a] text-center py-8 italic text-sm">No measures in this section</div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {section.measures.map((measure, measureIdx) => (
                    <MeasureCell
                      key={measureIdx}
                      measure={measure}
                      measureIdx={measureIdx}
                      section={section}
                      isSelected={selectedSectionId === section.id && selectedMeasureIndex === measureIdx}
                      editMode={editMode}
                      onMeasureClick={onMeasureClick}
                      onUpdateMeasure={(updated) => handleUpdateMeasure(section, measureIdx, updated)}
                      onDeleteMeasure={() => handleDeleteMeasure(section, measureIdx)}
                      onDuplicateMeasure={() => handleDuplicateMeasure(section, measureIdx)}
                      onInsertAfter={() => handleInsertAfter(section, measureIdx)}
                      displayMode={displayMode}
                      chartKey={chartKey}
                    />
                  ))}
                  {editMode && (
                    <button
                      onClick={() => onAddMeasure(section.id)}
                      className="bg-[#1a1a1a] border-2 border-dashed border-[#2a2a2a] rounded-lg p-4 min-h-[90px] flex items-center justify-center hover:border-red-600 hover:bg-[#1e1e1e] transition-all"
                    >
                      <Plus className="w-6 h-6 text-[#4a4a4a]" />
                    </button>
                  )}
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

        return <div key={section.id || sectionIdx}>{sectionContent}</div>;
      })}
    </div>
  );
}