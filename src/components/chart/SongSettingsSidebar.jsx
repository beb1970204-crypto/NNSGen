import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Save } from "lucide-react";

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
  onSaveSettings,
  onToggleNotation
}) {
  const [localKey, setLocalKey] = useState(chart.key);
  const [localTimeSignature, setLocalTimeSignature] = useState(chart.time_signature);
  const [localTempo, setLocalTempo] = useState(chart.tempo || "");

  // Keep local state in sync if the chart changes externally (e.g. after transpose save)
  useEffect(() => {
    setLocalKey(chart.key);
    setLocalTimeSignature(chart.time_signature);
    setLocalTempo(chart.tempo || "");
  }, [chart.key, chart.time_signature, chart.tempo]);

  const isDirty =
    localKey !== chart.key ||
    localTimeSignature !== chart.time_signature ||
    (localTempo || null) !== (chart.tempo || null);

  const handleSave = () => {
    onSaveSettings({
      key: localKey,
      time_signature: localTimeSignature,
      tempo: parseInt(localTempo) || null,
    });
  };

  return (
    <div className="w-72 bg-[#141414] border-r border-[#2a2a2a] h-full overflow-y-auto transition-all">
      <div className="p-6 space-y-8">
        {/* Song Settings */}
        <div>
          <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-widest opacity-60">Song Settings</h3>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-[#a0a0a0] mb-2 block">Key</Label>
              <Select value={localKey} onValueChange={setLocalKey}>
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
              <Select value={localTimeSignature} onValueChange={setLocalTimeSignature}>
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
                value={localTempo}
                onChange={(e) => setLocalTempo(e.target.value)}
                placeholder="120"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={!isDirty}
              className="w-full gap-2"
              size="sm"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </Button>
          </div>
        </div>

        {/* Notation Mode */}
        <div>
          <Label className="text-xs text-[#a0a0a0] mb-3 block">Notation Mode</Label>
          <div className="flex rounded-lg overflow-hidden border border-[#2a2a2a]">
            {[
              { mode: 'chords', label: 'ABC' },
              { mode: 'roman', label: 'I II' },
              { mode: 'nns',   label: '1 2 3' },
            ].map(({ mode, label }, i) => (
              <button
                key={mode}
                onClick={() => onToggleNotation(mode)}
                className={`flex-1 py-2 text-xs font-bold tracking-widest transition-all ${i > 0 ? 'border-l border-[#2a2a2a]' : ''} ${
                  chart.display_mode === mode
                    ? 'bg-red-600 text-white'
                    : 'bg-[#1a1a1a] text-[#6b6b6b] hover:text-white hover:bg-[#252525]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {chart.display_mode !== 'chords' && (
            <p className="text-xs text-[#6b6b6b] mt-2 italic">
              {chart.display_mode === 'roman' ? 'Roman numerals — display only' : 'Nashville Numbers — display only'}
            </p>
          )}
        </div>

        {/* Structure */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest opacity-60">Structure</h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-1">
            {sections.map((section, idx) => {
              const barCount = section.measures?.length || 0;
              const dotColors = {
                'Chorus': 'bg-red-500', 'Verse': 'bg-blue-500', 'Bridge': 'bg-yellow-500',
                'Intro': 'bg-purple-500', 'Outro': 'bg-indigo-400', 'Pre': 'bg-orange-400',
                'Instrumental Solo': 'bg-green-500',
              };
              const dotColor = dotColors[section.label] || 'bg-gray-500';
              return (
                <div
                  key={section.id || idx}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#1a1a1a] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                    <span className="text-sm text-[#a0a0a0] group-hover:text-white transition-colors">{section.label}</span>
                  </div>
                  <span className="text-xs text-[#6b6b6b]">{barCount} bars</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart Info */}
        {chart.data_source && (
          <div>
            <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-widest opacity-60">Source</h3>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
              <div className={`w-2 h-2 rounded-full ${chart.data_source === 'chordonomicon' ? 'bg-green-500' : chart.data_source === 'llm' ? 'bg-blue-400' : 'bg-gray-500'}`} />
              <span className="text-xs text-[#a0a0a0] capitalize">
                {chart.data_source === 'chordonomicon' ? 'Chordonomicon DB' : chart.data_source === 'llm' ? 'AI Generated' : 'Manual'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}