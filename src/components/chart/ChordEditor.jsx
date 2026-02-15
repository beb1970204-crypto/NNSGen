import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, Music } from "lucide-react";

const NNS_SYMBOLS = [
  { value: "diamond", label: "◆ Diamond (Stop)", icon: "◆" },
  { value: "marcato", label: "^ Marcato (Accent)", icon: "^" },
  { value: "push", label: "> Push", icon: ">" },
  { value: "pull", label: "< Pull", icon: "<" },
  { value: "fermata", label: "𝄐 Fermata (Hold)", icon: "𝄐" },
  { value: "bass_up", label: "↑ Bass Up", icon: "↑" },
  { value: "bass_down", label: "↓ Bass Down", icon: "↓" }
];

export default function ChordEditor({ chord, onSave, onCancel }) {
  const [chordText, setChordText] = useState(chord.chord);
  const [selectedSymbols, setSelectedSymbols] = useState(chord.symbols || []);
  const [hasDotNotation, setHasDotNotation] = useState(chord.beats && chord.beats !== 4 && chord.beats !== 2);

  const handleSmartEntry = (value) => {
    let formatted = value;
    
    // Auto-format minor chords with dash notation
    if (/^[1-7]$/.test(value) && ['2', '3', '6', '7'].includes(value)) {
      // Common minor degrees in Nashville
      if (value === '6' || value === '2' || value === '3') {
        formatted = value + '-';
      }
    }
    
    setChordText(formatted);
  };

  const handleDotNotation = () => {
    setHasDotNotation(!hasDotNotation);
  };

  const toggleSymbol = (symbol) => {
    setSelectedSymbols(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const handleSave = () => {
    const updatedChord = { 
      ...chord, 
      chord: chordText, 
      symbols: selectedSymbols 
    };
    
    // Set beats to indicate dot notation (3 beats for a dotted note in 4/4)
    if (hasDotNotation) {
      updatedChord.beats = 3;
    } else if (chord.beats === 3) {
      updatedChord.beats = 4;
    }
    
    onSave(updatedChord);
  };

  return (
    <div className="space-y-3 p-3 bg-[#1a1a1a] rounded-lg border border-[#333333]">
      <div>
        <Input
          value={chordText}
          onChange={(e) => {
            const value = e.target.value;
            // Smart entry for single digit Nashville numbers
            if (value.length === 1 && /^[1-7]$/.test(value)) {
              handleSmartEntry(value);
            } else {
              setChordText(value);
            }
          }}
          placeholder="Enter chord (e.g., C, 1, 4-, F/G)"
          className="bg-[#1a1a1a] border-[#333333] text-[#F5F5F5] chart-chord"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave();
            } else if (e.key === 'Escape') {
              onCancel();
            } else if (e.key === '.') {
              e.preventDefault();
              handleDotNotation();
            }
          }}
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-[#666]">
            Tip: Type 6 for 6-, press . for dot notation
          </p>
          {hasDotNotation && (
            <span className="text-xs px-2 py-0.5 rounded bg-[#FFD700] bg-opacity-20 text-[#FFD700]">
              ● Dotted
            </span>
          )}
        </div>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Music className="w-4 h-4 mr-2" />
            Symbols {selectedSymbols.length > 0 && `(${selectedSymbols.length})`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm mb-3">NNS Symbols</h4>
            {NNS_SYMBOLS.map(symbol => (
              <button
                key={symbol.value}
                onClick={() => toggleSymbol(symbol.value)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                  selectedSymbols.includes(symbol.value)
                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                    : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span className="text-lg font-bold">{symbol.icon}</span>
                <span className="flex-1 text-left">{symbol.label}</span>
                {selectedSymbols.includes(symbol.value) && (
                  <Check className="w-4 h-4 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {selectedSymbols.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {selectedSymbols.map(sym => {
            const symbol = NNS_SYMBOLS.find(s => s.value === sym);
            return (
              <span key={sym} className="px-2 py-1 bg-indigo-900 text-indigo-100 rounded text-xs">
                {symbol?.icon} {symbol?.label.split(' ')[1]}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSave} size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
          Save
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm" className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
}