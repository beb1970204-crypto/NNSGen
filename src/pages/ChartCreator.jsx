import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Sparkles, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import ChartDisplay from "@/components/chart/ChartDisplay";

export default function ChartCreator() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [referenceFile, setReferenceFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Preview state — holds generated data before saving
  const [preview, setPreview] = useState(null); // { chartData, sectionsData, source }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setReferenceFile(file_url);
    toast.success("File uploaded successfully");
    setUploadingFile(false);
  };

  const handleGenerateChart = async () => {
    if (!title) { toast.error("Please enter a song title"); return; }
    setIsGenerating(true);
    setPreview(null);

    const response = await base44.functions.invoke('generateChartAI', {
      title,
      artist: artist || null,
      reference_file_url: referenceFile || null
    });

    if (response.data.error) {
      toast.error(response.data.error);
      setIsGenerating(false);
      return;
    }

    setPreview(response.data);
    toast.success(response.data.message || "Chart generated! Review and save.");
    setIsGenerating(false);
  };

  const handleSave = async () => {
    if (!preview) return;
    setIsSaving(true);

    const chart = await base44.entities.Chart.create(preview.chartData);
    await Promise.all(preview.sectionsData.map(section =>
      base44.entities.Section.create({
        chart_id: chart.id,
        label: section.label,
        measures: section.measures,
        repeat_count: section.repeat_count || 1,
        arrangement_cue: section.arrangement_cue || ''
      })
    ));

    toast.success("Chart saved!");
    navigate(createPageUrl("ChartViewer") + `?id=${chart.id}`);
    setIsSaving(false);
  };

  // Build fake section objects with IDs for preview rendering
  const previewSections = preview?.sectionsData?.map((s, i) => ({ ...s, id: `preview-${i}` })) || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top bar */}
      <div className="bg-[#141414] border-b border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("Home")}>
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          </Link>
          <h1 className="text-lg font-bold text-white">Create New Chart</h1>
        </div>
        {preview && (
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 shadow-lg shadow-red-600/20">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Chart
          </Button>
        )}
      </div>

      <div className="flex gap-0 h-[calc(100vh-65px)]">
        {/* Left panel - form */}
        <div className="w-80 flex-shrink-0 bg-[#141414] border-r border-[#2a2a2a] p-6 overflow-y-auto">
          <div className="space-y-5">
            <div>
              <Label className="text-sm text-[#a0a0a0] mb-2 block font-medium">Song Title *</Label>
              <Input
                placeholder="e.g., Franklin's Tower"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateChart()}
                className="h-11"
              />
            </div>
            <div>
              <Label className="text-sm text-[#a0a0a0] mb-2 block font-medium">Artist</Label>
              <Input
                placeholder="e.g., Grateful Dead"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateChart()}
                className="h-11"
              />
            </div>
            <div>
              <Label className="text-sm text-[#a0a0a0] mb-2 block font-medium">Reference Chart (Optional)</Label>
              <div className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-6 text-center hover:border-red-600/50 transition-all">
                {uploadingFile ? (
                  <><Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-2" /><p className="text-sm text-[#a0a0a0]">Uploading...</p></>
                ) : referenceFile ? (
                  <div>
                    <div className="text-green-500 mb-2 text-sm font-semibold">✓ File uploaded</div>
                    <button onClick={() => setReferenceFile(null)} className="text-xs text-red-500 hover:text-red-400">Remove</button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input type="file" className="hidden" accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileUpload} />
                    <div className="text-[#6b6b6b]">
                      <div className="text-3xl mb-2">📄</div>
                      <p className="text-sm text-white">Click to upload</p>
                      <p className="text-xs mt-1">PDF, DOC, TXT, JPG, PNG</p>
                    </div>
                  </label>
                )}
              </div>
            </div>
            <Button
              onClick={handleGenerateChart}
              disabled={isGenerating || !title}
              className="w-full h-12 font-semibold shadow-xl shadow-red-600/30"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Generate Chart</>
              )}
            </Button>
          </div>
        </div>

        {/* Right panel - preview */}
        <div className="flex-1 overflow-auto bg-[#0a0a0a] p-8">
          {!preview && !isGenerating && (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <div className="text-6xl mb-4">🎵</div>
                <p className="text-[#6b6b6b] text-lg">Enter a song title and click Generate</p>
                <p className="text-[#4a4a4a] text-sm mt-2">Review the chart before saving it to your library</p>
              </div>
            </div>
          )}
          {isGenerating && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto mb-4" />
                <p className="text-white text-xl font-semibold">Generating chart...</p>
                <p className="text-[#6b6b6b] mt-2">Looking up chords and building your chart</p>
              </div>
            </div>
          )}
          {preview && !isGenerating && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{preview.chartData.title}</h2>
                  <p className="text-[#a0a0a0]">{preview.chartData.artist} · Key of {preview.chartData.key} · {preview.chartData.time_signature}</p>
                  <span className="text-xs text-[#6b6b6b] mt-1 inline-block">
                    Source: {preview.source === 'chordonomicon' ? '📖 Chordonomicon database' : '🤖 AI generated'}
                  </span>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2 shadow-lg shadow-red-600/20">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save to Library
                </Button>
              </div>
              <ChartDisplay
                sections={previewSections}
                chartKey={preview.chartData.key}
                displayMode="chords"
                editMode={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}