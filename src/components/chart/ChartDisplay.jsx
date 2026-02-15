import React from "react";
import { chordToNNS } from "@/utils/chordConversion";

export default function ChartDisplay({ sections, chartKey, displayMode }) {
  const renderChord = (chord) => {
    if (displayMode === 'nashville') {
      return chordToNNS(chord, chartKey);
    }
    return chord;
  };

  return (
    <div className="space-y-6">
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
          <div className="grid grid-cols-4 gap-4">
            {section.measures?.map((measure, measureIdx) => (
              <div
                key={measureIdx}
                className="bg-slate-900 border border-slate-600 rounded p-3 min-h-[80px] flex flex-col justify-center"
              >
                <div className="font-mono text-lg text-white space-y-1">
                  {measure.chords?.map((chordObj, chordIdx) => (
                    <div key={chordIdx} className="flex items-center gap-2">
                      <span className={chordObj.chord === '-' ? 'text-slate-500' : ''}>
                        {renderChord(chordObj.chord)}
                      </span>
                      {chordObj.symbols?.length > 0 && (
                        <span className="text-xs text-purple-400">
                          {chordObj.symbols.join(' ')}
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
            ))}
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