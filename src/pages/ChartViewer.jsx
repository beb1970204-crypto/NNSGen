import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Edit, Music2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ChartDisplay from "@/components/chart/ChartDisplay";
import KeySelector from "@/components/chart/KeySelector";
import { toast } from "sonner";
import { transposeSectionMeasures } from "@/components/transposeUtils";

export default function ChartViewer() {
  const urlParams = new URLSearchParams(window.location.search);
  const chartId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);

  const { data: chart, isLoading } = useQuery({
    queryKey: ['chart', chartId],
    queryFn: () => base44.entities.Chart.get(chartId),
    enabled: !!chartId
  });

  const { data: sections = [] } = useQuery({
    queryKey: ['sections', chartId],
    queryFn: () => base44.entities.Section.filter({ chart_id: chartId }),
    enabled: !!chartId,
    initialData: []
  });

  const toggleDisplayMode = useMutation({
    mutationFn: async () => {
      const newMode = chart.display_mode === 'chords' ? 'nashville' : 'chords';
      await base44.entities.Chart.update(chartId, { display_mode: newMode });
      return newMode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart', chartId] });
      toast.success(`Switched to ${chart.display_mode === 'chords' ? 'Nashville Numbers' : 'Chords'}`);
    }
  });

  const transposeChart = useMutation({
    mutationFn: async (newKey) => {
      const originalKey = chart.key;
      
      // Update chart key
      await base44.entities.Chart.update(chartId, { key: newKey });
      
      // Transpose all sections
      const transposePromises = sections.map(section => {
        const transposedMeasures = transposeSectionMeasures(section.measures, originalKey, newKey);
        return base44.entities.Section.update(section.id, { measures: transposedMeasures });
      });
      
      await Promise.all(transposePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart', chartId] });
      queryClient.invalidateQueries({ queryKey: ['sections', chartId] });
      toast.success('Chart transposed successfully');
    },
    onError: () => {
      toast.error('Failed to transpose chart');
    }
  });

  const updateSection = useMutation({
    mutationFn: ({ sectionId, data }) => base44.entities.Section.update(sectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', chartId] });
    },
    onError: () => {
      toast.error('Failed to update section');
    }
  });

  const handleUpdateSection = (sectionId, data) => {
    updateSection.mutate({ sectionId, data });
  };

  const handleAddMeasure = (sectionId) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const newMeasure = {
      chords: [{ chord: '-', beats: 4, symbols: [] }],
      cue: ''
    };
    
    const updatedMeasures = [...section.measures, newMeasure];
    handleUpdateSection(sectionId, { measures: updatedMeasures });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading chart...</div>
      </div>
    );
  }

  if (!chart) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Music2 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <div className="text-white text-xl mb-4">Chart not found</div>
          <Link to={createPageUrl("Home")}>
            <Button variant="outline">Back to Charts</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Header */}
      <div className="bg-[#121212] border-b border-[#333333] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Home")}>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{chart.title}</h1>
              {chart.artist && <p className="text-slate-400 text-sm">{chart.artist}</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant={editMode ? "default" : "outline"}
              size="sm" 
              className={editMode ? "bg-indigo-600 hover:bg-indigo-700 gap-2" : "gap-2"}
              onClick={() => setEditMode(!editMode)}
            >
              <Edit className="w-4 h-4" />
              {editMode ? 'Done Editing' : 'Edit Chart'}
            </Button>
            <Button size="sm" variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Chart Info Bar */}
      <div className="bg-[#121212] border-b border-[#333333] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm flex-wrap">
          <div>
            <span className="text-slate-400">Key:</span>
            <span className="ml-2 font-bold text-lg">{chart.key}</span>
          </div>
          <div>
            <span className="text-slate-400">Time:</span>
            <span className="ml-2 font-bold text-lg">{chart.time_signature}</span>
          </div>
          {chart.tempo && (
            <div>
              <span className="text-slate-400">Tempo:</span>
              <span className="ml-2 font-bold">{chart.tempo} BPM</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-3">
            <KeySelector 
              currentKey={chart.key}
              onKeyChange={(newKey) => transposeChart.mutate(newKey)}
              disabled={transposeChart.isPending}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toggleDisplayMode.mutate()}
              disabled={toggleDisplayMode.isPending}
            >
              Switch to {chart.display_mode === 'chords' ? 'Nashville Numbers' : 'Chords'}
            </Button>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="max-w-7xl mx-auto p-8">
        {sections.length === 0 ? (
          <div className="text-center py-20">
            <Music2 className="w-20 h-20 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Chart is Empty</h2>
            <p className="text-slate-400 mb-6">This chart has no sections yet</p>
            <Link to={createPageUrl("Home")}>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Charts
              </Button>
            </Link>
          </div>
        ) : (
          <ChartDisplay 
            sections={sections}
            chartKey={chart.key}
            displayMode={chart.display_mode}
            editMode={editMode}
            onUpdateSection={handleUpdateSection}
            onAddMeasure={handleAddMeasure}
          />
        )}
      </div>
    </div>
  );
}