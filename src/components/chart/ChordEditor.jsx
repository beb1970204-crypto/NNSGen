import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, Music } from "lucide-react";
import { toast } from "sonner";

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
  const [bassNote, setBassNote] = useState(chord.bass_note || '');
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
    const trimmedChord = chordText.trim() || '-';
    const trimmedBass = bassNote.trim() || null;

    // Validate chord length
    if (trimmedChord.length > 20) {
      toast.error('Chord name is too long (max 20 characters)');
      return;
    }

    if (trimmedBass && trimmedBass.length > 10) {
      toast.error('Bass note is too long (max 10 characters)');
      return;
    }

    const updatedChord = { 
      ...chord, 
      chord: trimmedChord, 
      bass_note: trimmedBass,
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
    <div className="space-y-3 p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
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
          className="bg-[#0a0a0a] border-[#2a2a2a] text-white chart-chord"
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
          <p className="text-xs text-[#6b6b6b]">
            Tip: Type 6 for 6-, press . for dot notation
          </p>
          {hasDotNotation && (
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500">
              ● Dotted
            </span>
          )}
        </div>
      </div>

      <div>
        <Input
          value={bassNote}
          onChange={(e) => setBassNote(e.target.value)}
          placeholder="Bass note (e.g., G for C/G)"
          className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
        />
        <p className="text-xs text-[#6b6b6b] mt-1">
          Optional: Add slash chord bass note
        </p>
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
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-all ${
                  selectedSymbols.includes(symbol.value)
                    ? 'bg-red-600 text-white border border-red-600 shadow-lg shadow-red-600/20'
                    : 'bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-white'
                }`}
              >
                <span className="text-lg font-bold">{symbol.icon}</span>
                <span className="flex-1 text-left">{symbol.label}</span>
                {selectedSymbols.includes(symbol.value) && (
                  <Check className="w-4 h-4 text-white" />
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
              <span key={sym} className="px-2 py-1 bg-red-600/20 text-red-500 rounded text-xs font-medium">
                {symbol?.icon} {symbol?.label.split(' ')[1]}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSave} size="sm" className="flex-1">
          Save
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm" className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
}