import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Save, User } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ChartDisplay from "@/components/chart/ChartDisplay";
import SongSettingsSidebar from "@/components/chart/SongSettingsSidebar";
import MeasurePropertiesSidebar from "@/components/chart/MeasurePropertiesSidebar";
import ChartToolbar from "@/components/chart/ChartToolbar";
import { toast } from "sonner";
import { transposeSectionMeasures } from "@/components/transposeUtils";

export default function ChartViewer() {
  const urlParams = new URLSearchParams(window.location.search);
  const chartId = urlParams.get('id');
  const queryClient = useQueryClient();
  
  const [selectedMeasure, setSelectedMeasure] = useState(null);
  const [selectedMeasureIndex, setSelectedMeasureIndex] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [exportingPDF, setExportingPDF] = useState(false);

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

  const updateChart = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Chart.update(chartId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart', chartId] });
      toast.success('Chart updated');
    }
  });

  const toggleDisplayMode = async (mode) => {
    await base44.entities.Chart.update(chartId, { display_mode: mode });
    queryClient.invalidateQueries({ queryKey: ['chart', chartId] });
  };

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

  const handleMeasureClick = (measure, measureIdx, section) => {
    setSelectedMeasure(measure);
    setSelectedMeasureIndex(measureIdx);
    setSelectedSection(section);
  };

  const handleUpdateSelectedMeasure = (updatedMeasure) => {
    if (!selectedSection || selectedMeasureIndex === null) return;
    
    const updatedMeasures = [...selectedSection.measures];
    updatedMeasures[selectedMeasureIndex] = updatedMeasure;
    handleUpdateSection(selectedSection.id, { measures: updatedMeasures });
    
    // Update local state
    setSelectedMeasure(updatedMeasure);
  };

  const handleDuplicateMeasure = (measure) => {
    if (!selectedSection || selectedMeasureIndex === null) return;
    
    const updatedMeasures = [...selectedSection.measures];
    updatedMeasures.splice(selectedMeasureIndex + 1, 0, { ...measure });
    handleUpdateSection(selectedSection.id, { measures: updatedMeasures });
    toast.success('Measure duplicated');
  };

  const handleInsertAfter = (measure) => {
    if (!selectedSection || selectedMeasureIndex === null) return;
    
    const newMeasure = {
      chords: [{ chord: '-', beats: 4, symbols: [] }],
      cue: ''
    };
    
    const updatedMeasures = [...selectedSection.measures];
    updatedMeasures.splice(selectedMeasureIndex + 1, 0, newMeasure);
    handleUpdateSection(selectedSection.id, { measures: updatedMeasures });
    toast.success('Measure inserted');
  };

  const handleDeleteSelectedMeasure = () => {
    if (!selectedSection || selectedMeasureIndex === null) return;
    
    const updatedMeasures = selectedSection.measures.filter((_, idx) => idx !== selectedMeasureIndex);
    handleUpdateSection(selectedSection.id, { measures: updatedMeasures });
    setSelectedMeasure(null);
    setSelectedMeasureIndex(null);
    setSelectedSection(null);
    toast.success('Measure deleted');
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

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const response = await base44.functions.invoke('exportChartPDF', { chart_id: chartId });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chart.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error(error);
    } finally {
      setExportingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Loading chart...</div>
      </div>
    );
  }

  if (!chart) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Chart not found</div>
          <Link to={createPageUrl("Home")}>
            <Button variant="outline">Back to Charts</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Top Bar */}
      <div className="bg-[#141414] border-b border-[#2a2a2a] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("Home")}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">{chart.title}</h1>
            {chart.artist && <p className="text-xs text-[#6b6b6b]">{chart.artist}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Button size="sm" className="gap-2">
            <Save className="w-4 h-4" />
            Save
          </Button>
          <div className="w-8 h-8 bg-[#2a2a2a] rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-[#a0a0a0]" />
          </div>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Song Settings */}
        <SongSettingsSidebar
          chart={chart}
          sections={sections}
          onUpdateChart={(data) => updateChart.mutate(data)}
          onTransposeChart={(newKey) => transposeChart.mutate(newKey)}
          onToggleNotation={toggleDisplayMode}
        />

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChartToolbar
            hasSelection={!!selectedMeasure}
            zoomLevel={zoomLevel}
            onZoomIn={() => setZoomLevel(prev => Math.min(prev + 10, 200))}
            onZoomOut={() => setZoomLevel(prev => Math.max(prev - 10, 50))}
            onDelete={handleDeleteSelectedMeasure}
            onAddMeasure={() => sections[0] && handleAddMeasure(sections[0].id)}
          />
          
          <div className="flex-1 overflow-auto bg-[#0a0a0a] p-6">
            {sections.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-[#6b6b6b]">
                  <p className="text-sm">Chart is empty. Add sections to get started.</p>
                </div>
              </div>
            ) : (
              <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}>
                <ChartDisplay 
                  sections={sections}
                  chartKey={chart.key}
                  displayMode={chart.display_mode}
                  editMode={true}
                  onUpdateSection={handleUpdateSection}
                  onAddMeasure={handleAddMeasure}
                  onMeasureClick={handleMeasureClick}
                  selectedMeasureIndex={selectedMeasureIndex}
                  selectedSectionId={selectedSection?.id}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Measure Properties */}
        <MeasurePropertiesSidebar
          selectedMeasure={selectedMeasure}
          selectedMeasureIndex={selectedMeasureIndex}
          selectedSection={selectedSection}
          onUpdateMeasure={handleUpdateSelectedMeasure}
          onDuplicateMeasure={handleDuplicateMeasure}
          onInsertAfter={handleInsertAfter}
          onDeleteMeasure={handleDeleteSelectedMeasure}
          onClose={() => {
            setSelectedMeasure(null);
            setSelectedMeasureIndex(null);
            setSelectedSection(null);
          }}
        />
      </div>
    </div>
  );
}