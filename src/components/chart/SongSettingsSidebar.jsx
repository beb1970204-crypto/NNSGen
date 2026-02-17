import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Upload, Clock, Plus } from "lucide-react";

const KEYS = [
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F", 
  "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B",
  "Cm", "C#m", "Dm", "D#m", "Ebm", "Em", "Fm",
  "F#m", "Gm", "G#m", "Am", "A#m", "Bbm", "Bm"
];

const TIME_SIGNATURES = ["4/4", "3/4", "6/8", "2/4", "5/4", "7/8", "12/8"];

export default function SongSettingsSidebar({ 
  chart, 
  sections = [],
  onUpdateChart,
  onTransposeChart,
  onToggleNotation 
}) {
  return (
    <div className="w-72 bg-[#141414] border-r border-[#2a2a2a] h-full overflow-y-auto transition-all">
      <div className="p-6 space-y-8">
        {/* Song Settings */}
        <div>
          <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-widest opacity-60">Song Settings</h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-[#a0a0a0] mb-2 block">Key</Label>
              <Select value={chart.key} onValueChange={onTransposeChart}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KEYS.map(key => (
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-[#a0a0a0] mb-2 block">Time Signature</Label>
              <Select 
                value={chart.time_signature} 
                onValueChange={(value) => onUpdateChart({ time_signature: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SIGNATURES.map(ts => (
                    <SelectItem key={ts} value={ts}>{ts}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-[#a0a0a0] mb-2 block">Tempo (BPM)</Label>
              <Input
                type="number"
                value={chart.tempo || ""}
                onChange={(e) => onUpdateChart({ tempo: parseInt(e.target.value) || null })}
                placeholder="120"
              />
            </div>
          </div>
        </div>

        {/* Notation Mode */}
        <div>
          <Label className="text-xs text-[#a0a0a0] mb-2 block">Notation Mode</Label>
          <div className="flex gap-2">
            <Button
              variant={chart.display_mode === 'chords' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onToggleNotation('chords')}
              className="flex-1"
            >
              Chords
            </Button>
            <Button
              variant={chart.display_mode === 'roman' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onToggleNotation('roman')}
              className="flex-1"
            >
              Roman
            </Button>
          </div>
        </div>

        {/* Structure */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest opacity-60">Structure</h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {sections.map((section, idx) => {
              const barCount = section.measures?.length || 0;
              return (
                <div
                  key={section.id || idx}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 hover:bg-[#252525] hover:border-[#3a3a3a] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-red-500 transition-colors">{section.label}</div>
                      <div className="text-xs text-[#6b6b6b]">{barCount} bars</div>
                    </div>
                    {section.repeat_count > 1 && (
                      <div className="text-xs text-[#a0a0a0] bg-[#2a2a2a] px-2 py-1 rounded">
                        x{section.repeat_count}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tools */}
        <div>
          <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-widest opacity-60">Tools</h3>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <Upload className="w-4 h-4" />
              Import Chart
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <Clock className="w-4 h-4" />
              Version History
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}