import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Music, Upload, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import SectionInput from "@/components/chart/SectionInput";
import { Textarea } from "@/components/ui/textarea";

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
  const [sections, setSections] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceText, setReferenceText] = useState("");
  const [useAI, setUseAI] = useState(false);

  const handleGenerateWithAI = async () => {
    if (!formData.title) {
      toast.error("Please enter a song title");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await base44.functions.invoke('generateChartAI', {
        title: formData.title,
        artist: formData.artist,
        key: formData.key,
        time_signature: formData.time_signature,
        reference_file_url: referenceText ? null : null // Could upload file here
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Set the generated sections
      setSections(response.data.sections || []);
      setUseAI(false);
      toast.success("Chart generated! Review and edit as needed.");
    } catch (error) {
      toast.error("Failed to generate chart with AI");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title) {
      toast.error("Please enter a song title");
      return;
    }

    if (sections.length === 0) {
      toast.error("Please add at least one section or generate with AI");
      return;
    }

    setIsGenerating(true);

    try {
      // Create the chart
      const chart = await base44.entities.Chart.create({
        ...formData,
        sections: []
      });

      // Create sections with their measures
      const sectionPromises = sections.map((section, index) => 
        base44.entities.Section.create({
          chart_id: chart.id,
          label: section.label,
          measures: section.measures,
          repeat_count: section.repeat_count || 1,
          arrangement_cue: section.arrangement_cue || ""
        })
      );

      await Promise.all(sectionPromises);

      toast.success("Chart created successfully!");
      navigate(createPageUrl("ChartViewer") + `?id=${chart.id}`);
    } catch (error) {
      toast.error("Failed to create chart");
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
              <Music className="w-6 h-6 text-indigo-600" />
              Create New Chart
            </CardTitle>
            <p className="text-sm text-slate-500">
              Enter song details and build your chart section by section
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Song Information */}
            <div className="space-y-4 pb-6 border-b border-slate-200">
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

            {/* AI Generation Toggle */}
            <div className="pb-6 border-b border-slate-200">
              <Button
                type="button"
                onClick={() => setUseAI(!useAI)}
                variant={useAI ? "default" : "outline"}
                className={useAI ? "bg-indigo-600 hover:bg-indigo-700 gap-2" : "gap-2"}
              >
                <Sparkles className="w-4 h-4" />
                {useAI ? "Using AI Generation" : "Generate with AI"}
              </Button>
              <p className="text-xs text-slate-500 mt-2">
                Let AI create a basic chart structure for you
              </p>
            </div>

            {useAI ? (
              /* AI Generation Interface */
              <div className="space-y-4">
                <div>
                  <Label htmlFor="referenceText">Reference Material (Optional)</Label>
                  <Textarea
                    id="referenceText"
                    placeholder="Paste chord chart, lyrics with chords, or any reference material..."
                    value={referenceText}
                    onChange={(e) => setReferenceText(e.target.value)}
                    className="mt-1 h-32"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Paste existing chord charts or lyrics to help AI understand the structure
                  </p>
                </div>

                <Button
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Chart with AI
                    </>
                  )}
                </Button>
              </div>
            ) : (
              /* Manual Section Input */
              <SectionInput 
                sections={sections}
                setSections={setSections}
                timeSignature={formData.time_signature}
              />
            )}

            {/* Create Button */}
            <Button
              onClick={handleCreate}
              disabled={isGenerating || !formData.title || sections.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Chart...
                </>
              ) : (
                <>
                  <Music className="w-5 h-5 mr-2" />
                  Create Chart
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}