import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function ChartCreator() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [referenceFile, setReferenceFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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

    // Save chart and sections, then navigate to ChartViewer
    const { chartData, sectionsData } = response.data;
    const chart = await base44.entities.Chart.create(chartData);
    await Promise.all(sectionsData.map(section =>
      base44.entities.Section.create({
        chart_id: chart.id,
        label: section.label,
        measures: section.measures,
        repeat_count: section.repeat_count || 1,
        arrangement_cue: section.arrangement_cue || ''
      })
    ));

    toast.success(response.data.message || "Chart created!");
    navigate(createPageUrl("ChartViewer") + `?id=${chart.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Top bar */}
      <div className="bg-[#141414] border-b border-[#2a2a2a] px-6 py-4 flex items-center gap-4">
        <Link to={createPageUrl("Home")}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-lg font-bold text-white">Create New Chart</h1>
      </div>

      {/* Centered form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🎵</div>
            <h2 className="text-2xl font-bold text-white">New Chart</h2>
            <p className="text-[#6b6b6b] mt-2">Enter a song title to generate a chart with AI</p>
          </div>

          <div className="space-y-4">
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
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                    <p className="text-sm text-[#a0a0a0]">Uploading...</p>
                  </div>
                ) : referenceFile ? (
                  <div>
                    <div className="text-green-500 mb-2 text-sm font-semibold">✓ File uploaded</div>
                    <button
                      onClick={() => setReferenceFile(null)}
                      className="text-xs text-red-500 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                    />
                    <div className="text-[#6b6b6b]">
                      <div className="text-3xl mb-2">📄</div>
                      <p className="text-sm text-white">Click to upload reference</p>
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
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Chart...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Chart
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}