import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MAJOR_KEYS = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];
const MINOR_KEYS = ["Cm", "C#m", "Dm", "D#m", "Ebm", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bbm", "Bm"];

export default function KeySelector({ currentKey, onKeyChange, disabled }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-300">Transpose to:</span>
      <Select value={currentKey} onValueChange={onKeyChange} disabled={disabled}>
        <SelectTrigger className="w-24 bg-slate-700 border-slate-600">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-1 text-xs font-semibold text-slate-400">Major Keys</div>
          {MAJOR_KEYS.map(key => (
            <SelectItem key={key} value={key}>{key}</SelectItem>
          ))}
          <div className="px-2 py-1 text-xs font-semibold text-slate-400 border-t mt-1 pt-2">Minor Keys</div>
          {MINOR_KEYS.map(key => (
            <SelectItem key={key} value={key}>{key}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}