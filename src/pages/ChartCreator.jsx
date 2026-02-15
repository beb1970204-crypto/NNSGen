import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setReferenceFile(file_url);
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
      console.error(error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleGenerateChart = async () => {
    if (!title) {
      toast.error("Please enter a song title");
      return;
    }

    setIsGenerating(true);

    try {
      // Generate chart with AI
      const response = await base44.functions.invoke('generateChartAI', {
        title,
        artist,
        key: "C",
        time_signature: "4/4",
        reference_file_url: referenceFile || null
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const generatedData = response.data;

      // Create the chart with AI-generated data
      const chart = await base44.entities.Chart.create({
        title,
        artist,
        key: generatedData.key || "C",
        time_signature: generatedData.time_signature || "4/4",
        display_mode: "chords",
        reference_file_url: referenceFile || null
      });

      // Create sections
      const sectionPromises = (generatedData.sections || []).map((section) => 
        base44.entities.Section.create({
          chart_id: chart.id,
          label: section.label,
          measures: section.measures,
          repeat_count: section.repeat_count || 1,
          arrangement_cue: section.arrangement_cue || "",
          modulation_key: section.modulation_key || null,
          pivot_cue: section.pivot_cue || null
        })
      );

      await Promise.all(sectionPromises);

      toast.success("Chart created successfully!");
      navigate(createPageUrl("ChartViewer") + `?id=${chart.id}`);
    } catch (error) {
      toast.error("Failed to generate chart");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Create New Chart</h1>
          <p className="text-[#a0a0a0] text-lg">AI-powered chart generation from your song details</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 shadow-2xl">
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-sm text-[#a0a0a0] mb-2 block font-medium">Song Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Amazing Grace"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11"
              />
            </div>

            <div>
              <Label htmlFor="artist" className="text-sm text-[#a0a0a0] mb-2 block font-medium">Artist (Optional)</Label>
              <Input
                id="artist"
                placeholder="e.g., Traditional"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="h-11"
              />
            </div>

            <div>
              <Label htmlFor="referenceFile" className="text-sm text-[#a0a0a0] mb-2 block font-medium">
                Upload Reference Chart (Optional)
              </Label>
              <div className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-10 text-center hover:border-red-600/50 hover:bg-[#252525] transition-all">
                {uploadingFile ? (
                  <div>
                    <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto mb-4" />
                    <p className="text-sm text-[#a0a0a0]">Uploading...</p>
                  </div>
                ) : referenceFile ? (
                  <div>
                    <div className="text-green-500 mb-3 text-lg font-semibold">✓ File uploaded successfully</div>
                    <button
                      onClick={() => setReferenceFile(null)}
                      className="text-sm text-red-500 hover:text-red-400 font-medium transition-colors"
                    >
                      Remove file
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
                      <div className="text-5xl mb-3">📄</div>
                      <p className="text-base font-medium text-white mb-1">Click to upload or drag and drop</p>
                      <p className="text-sm">PDF, DOC, TXT, JPG, PNG</p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <Button
              onClick={handleGenerateChart}
              disabled={isGenerating || !title}
              className="w-full h-14 text-lg font-semibold shadow-xl shadow-red-600/30 hover:shadow-2xl hover:shadow-red-600/40 transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Generating Chart...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Chart with AI
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}