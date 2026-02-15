import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Plus, Trash2 } from "lucide-react";

export default function MeasurePropertiesSidebar({ 
  selectedMeasure,
  selectedMeasureIndex,
  selectedSection,
  onUpdateMeasure,
  onDuplicateMeasure,
  onInsertAfter,
  onDeleteMeasure,
  onClose
}) {
  const [localChord, setLocalChord] = useState("");
  const [localDuration, setLocalDuration] = useState("whole");
  const [localSymbols, setLocalSymbols] = useState([]);
  const [localCue, setLocalCue] = useState("");

  useEffect(() => {
    if (selectedMeasure) {
      const firstChord = selectedMeasure.chords?.[0];
      setLocalChord(firstChord?.chord || "");
      setLocalDuration(firstChord?.beats === 2 ? "half" : "whole");
      setLocalSymbols(firstChord?.symbols || []);
      setLocalCue(selectedMeasure.cue || "");
    }
  }, [selectedMeasure]);

  if (!selectedMeasure) {
    return (
      <div className="w-80 bg-[#141414] border-l border-[#2a2a2a] h-full flex items-center justify-center transition-all">
        <div className="text-center text-[#6b6b6b] px-6 animate-pulse">
          <div className="text-4xl mb-3 opacity-40">◆</div>
          <p className="text-sm">Select a measure to edit its properties</p>
        </div>
      </div>
    );
  }

  const handleSymbolToggle = (symbol) => {
    setLocalSymbols(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const handleSave = () => {
    const beats = localDuration === "half" ? 2 : 4;
    const updatedMeasure = {
      ...selectedMeasure,
      chords: [{
        chord: localChord || "-",
        beats,
        symbols: localSymbols
      }],
      cue: localCue
    };
    onUpdateMeasure(updatedMeasure);
  };

  return (
    <div className="w-80 bg-[#141414] border-l border-[#2a2a2a] h-full overflow-y-auto transition-all">
      <div className="p-6 space-y-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="pb-4 border-b border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Measure Properties</h3>
            <button 
              onClick={onClose}
              className="text-[#6b6b6b] hover:text-white text-xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-[#6b6b6b]">
            {selectedSection?.label} - Bar {(selectedMeasureIndex || 0) + 1}
          </p>
        </div>

        {/* Chord/Number */}
        <div>
          <Label className="text-xs text-[#a0a0a0] mb-2 block">Chord / Number</Label>
          <Input
            value={localChord}
            onChange={(e) => setLocalChord(e.target.value)}
            placeholder="C, Dm7, 1, 4, etc."
            onBlur={handleSave}
          />
        </div>

        {/* Duration */}
        <div>
          <Label className="text-xs text-[#a0a0a0] mb-2 block">Duration</Label>
          <Select value={localDuration} onValueChange={(val) => { setLocalDuration(val); setTimeout(handleSave, 0); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="whole">Whole Note (4 beats)</SelectItem>
              <SelectItem value="half">Half Note (2 beats)</SelectItem>
              <SelectItem value="quarter">Quarter Note (1 beat)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Articulation */}
        <div>
          <Label className="text-xs text-[#a0a0a0] mb-3 block">Articulation</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "diamond", label: "Diamond", symbol: "◆" },
              { value: "marcato", label: "Marcato", symbol: "^" },
              { value: "push", label: "Push", symbol: ">" },
              { value: "pull", label: "Pull", symbol: "<" },
              { value: "fermata", label: "Fermata", symbol: "𝄐" },
              { value: "bass_up", label: "Bass Up", symbol: "↑" },
            ].map(({ value, label, symbol }) => (
              <button
                key={value}
                onClick={() => { handleSymbolToggle(value); setTimeout(handleSave, 0); }}
                className={`px-3 py-2 rounded-lg border text-sm transition-all transform hover:scale-105 ${
                  localSymbols.includes(value)
                    ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20"
                    : "bg-[#1a1a1a] border-[#2a2a2a] text-[#a0a0a0] hover:bg-[#252525] hover:border-[#3a3a3a]"
                }`}
              >
                <div className="font-mono text-lg">{symbol}</div>
                <div className="text-xs mt-1">{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Bass Note / Inversion */}
        <div>
          <Label className="text-xs text-[#a0a0a0] mb-2 block">Bass Note / Inversion</Label>
          <Input placeholder="e.g., /G for C/G" />
        </div>

        {/* Arrangement Cue */}
        <div>
          <Label className="text-xs text-[#a0a0a0] mb-2 block">Arrangement Cue</Label>
          <Textarea
            value={localCue}
            onChange={(e) => setLocalCue(e.target.value)}
            onBlur={handleSave}
            placeholder="e.g., 'Drums out', 'Build', 'New 5'"
            rows={3}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <Label className="text-xs text-[#a0a0a0] mb-3 block">Quick Actions</Label>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2"
              onClick={() => onDuplicateMeasure(selectedMeasure)}
            >
              <Copy className="w-4 h-4" />
              Duplicate Measure
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2"
              onClick={() => onInsertAfter(selectedMeasure)}
            >
              <Plus className="w-4 h-4" />
              Insert After
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2 text-red-500 hover:text-red-600"
              onClick={onDeleteMeasure}
            >
              <Trash2 className="w-4 h-4" />
              Delete Measure
            </Button>
          </div>
        </div>

        {/* Symbol Reference */}
        <div className="pt-4 border-t border-[#2a2a2a]">
          <Label className="text-xs text-[#a0a0a0] mb-2 block">Symbol Reference</Label>
          <div className="text-xs text-[#6b6b6b] space-y-1">
            <div>◆ Diamond - Hit and stop</div>
            <div>^ Marcato - Strong accent</div>
            <div>&gt; Push - Anticipate beat</div>
            <div>&lt; Pull - Delay beat</div>
            <div>𝄐 Fermata - Hold/Pause</div>
            <div>↑ Bass Up - Bass note up</div>
          </div>
        </div>
      </div>
    </div>
  );
}