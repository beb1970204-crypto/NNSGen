import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Loader2, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

const KEYS = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];
const MINOR_KEYS = ["Cm", "C#m", "Dm", "D#m", "Ebm", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bbm", "Bm"];

export default function ChartCreator() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    key: "C",
    time_signature: "4/4",
    display_mode: "chords"
  });
  const [referenceFile, setReferenceFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const createChartMutation = useMutation({
    mutationFn: async (data) => {
      const chart = await base44.entities.Chart.create(data);
      return chart;
    },
    onSuccess: (chart) => {
      toast.success("Chart created successfully!");
      navigate(createPageUrl("ChartViewer") + `?id=${chart.id}`);
    },
    onError: (error) => {
      toast.error("Failed to create chart");
      console.error(error);
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReferenceFile(file);
    }
  };

  const handleGenerate = async () => {
    if (!formData.title) {
      toast.error("Please enter a song title");
      return;
    }

    setIsGenerating(true);

    try {
      // TODO: Implement AI chart generation with Time-Grid Reconstruction
      // For now, create a basic chart structure
      const chartData = {
        ...formData,
        sections: []
      };

      // If reference file exists, upload it
      if (referenceFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', referenceFile);
        const { data: uploadResult } = await base44.integrations.Core.UploadFile({ file: referenceFile });
        chartData.reference_file_url = uploadResult.file_url;
      }

      createChartMutation.mutate(chartData);
    } catch (error) {
      toast.error("Failed to generate chart");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto p-6">
        <Link to={createPageUrl("Home")}>
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Charts
          </Button>
        </Link>

        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              Create New Chart
            </CardTitle>
            <p className="text-sm text-slate-500">
              Enter song details and optionally upload a reference file for AI-powered chart generation
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Song Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Song Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Amazing Grace"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="artist">Artist</Label>
                <Input
                  id="artist"
                  placeholder="e.g., Traditional"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="key">Key</Label>
                  <Select value={formData.key} onValueChange={(value) => setFormData({ ...formData, key: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C">Major Keys</SelectItem>
                      {KEYS.map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                      <SelectItem value="minor-divider" disabled>Minor Keys</SelectItem>
                      {MINOR_KEYS.map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="time_signature">Time Signature</Label>
                  <Select value={formData.time_signature} onValueChange={(value) => setFormData({ ...formData, time_signature: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4/4">4/4</SelectItem>
                      <SelectItem value="3/4">3/4</SelectItem>
                      <SelectItem value="6/8">6/8</SelectItem>
                      <SelectItem value="2/4">2/4</SelectItem>
                      <SelectItem value="5/4">5/4</SelectItem>
                      <SelectItem value="7/8">7/8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="display_mode">Default Display Mode</Label>
                <Select value={formData.display_mode} onValueChange={(value) => setFormData({ ...formData, display_mode: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chords">Regular Chords</SelectItem>
                    <SelectItem value="nashville">Nashville Number System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reference File Upload */}
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 mb-2">Upload Reference File (Optional)</h3>
              <p className="text-sm text-slate-500 mb-4">
                PDF, DOC, or TXT file with chord progression or lyrics
              </p>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="max-w-xs mx-auto"
              />
              {referenceFile && (
                <p className="text-sm text-green-600 mt-2">✓ {referenceFile.name}</p>
              )}
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !formData.title}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6"
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