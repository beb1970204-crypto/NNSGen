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
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto p-6">
        <Link to={createPageUrl("Home")}>
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Charts
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-red-500" />
              Generate Chart with AI
            </CardTitle>
            <p className="text-sm text-[#a0a0a0]">
              Enter song details and let AI create your chart
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title">Song Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Amazing Grace"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="artist">Artist (Optional)</Label>
              <Input
                id="artist"
                placeholder="e.g., Traditional"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="referenceFile">Upload Reference Chart (Optional)</Label>
              <div className="mt-1 flex items-center gap-3">
                <Input
                  id="referenceFile"
                  type="file"
                  accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="flex-1"
                />
                {uploadingFile && (
                  <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                )}
                {referenceFile && !uploadingFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReferenceFile(null)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-[#6b6b6b] mt-1">
                Upload an existing chord chart, lyric sheet, or image to help AI understand the song
              </p>
            </div>

            <Button
              onClick={handleGenerateChart}
              disabled={isGenerating || !title}
              className="w-full text-lg py-6"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Chart...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Chart
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}