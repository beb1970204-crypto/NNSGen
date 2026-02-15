import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus } from "lucide-react";
import { parseMeasureInput } from "@/components/utils/chordConversion";

export default function SectionInput({ sections, setSections, timeSignature }) {
  const addSection = () => {
    setSections([...sections, {
      label: "Verse",
      measures: [],
      repeat_count: 1,
      arrangement_cue: "",
      measureInput: ""
    }]);
  };

  const removeSection = (index) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index, field, value) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    
    // If measureInput changes, parse it
    if (field === 'measureInput') {
      updated[index].measures = parseMeasureInput(value, timeSignature);
    }
    
    setSections(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-semibold">Chart Sections</Label>
        <Button onClick={addSection} variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Section
        </Button>
      </div>

      {sections.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-slate-500">
            No sections added yet. Click "Add Section" to start building your chart.
          </CardContent>
        </Card>
      )}

      {sections.map((section, index) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Section {index + 1}</CardTitle>
              <Button
                onClick={() => removeSection(index)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Section Type</Label>
                <Select
                  value={section.label}
                  onValueChange={(value) => updateSection(index, 'label', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Intro">Intro</SelectItem>
                    <SelectItem value="Verse">Verse</SelectItem>
                    <SelectItem value="Pre">Pre</SelectItem>
                    <SelectItem value="Chorus">Chorus</SelectItem>
                    <SelectItem value="Bridge">Bridge</SelectItem>
                    <SelectItem value="Instrumental Solo">Instrumental Solo</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Repeat Count</Label>
                <Input
                  type="number"
                  min="1"
                  value={section.repeat_count}
                  onChange={(e) => updateSection(index, 'repeat_count', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Arrangement Cue (Optional)</Label>
              <Input
                placeholder="e.g., Band Building, MOD +1"
                value={section.arrangement_cue}
                onChange={(e) => updateSection(index, 'arrangement_cue', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">
                Chord Progression <span className="text-slate-400">(use | to separate measures)</span>
              </Label>
              <Textarea
                placeholder="Example: C | Dm G7 | Am F | C G"
                value={section.measureInput}
                onChange={(e) => updateSection(index, 'measureInput', e.target.value)}
                className="mt-1 font-mono"
                rows={3}
              />
              {section.measures.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ {section.measures.length} measure{section.measures.length !== 1 ? 's' : ''} parsed
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}