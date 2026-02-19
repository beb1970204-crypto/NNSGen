import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Download, User, Plus, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ChartDisplay from "@/components/chart/ChartDisplay";
import SongSettingsSidebar from "@/components/chart/SongSettingsSidebar";
import MeasurePropertiesSidebar from "@/components/chart/MeasurePropertiesSidebar";
import ChartToolbar from "@/components/chart/ChartToolbar";
import ShareDialog from "@/components/chart/ShareDialog";
import { toast } from "sonner";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ChartViewer() {
  const urlParams = new URLSearchParams(window.location.search);
  const chartId = urlParams.get('id');
  const queryClient = useQueryClient();
  
  const [selectedMeasure, setSelectedMeasure] = useState(null);
  const [selectedMeasureIndex, setSelectedMeasureIndex] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(true);


  const { data: chart, isLoading, error } = useQuery({
    queryKey: ['chart', chartId],
    queryFn: () => base44.entities.Chart.get(chartId),
    enabled: !!chartId
  });

  const { data: rawSections = [] } = useQuery({
    queryKey: ['sections', chartId],
    queryFn: () => base44.entities.Section.filter({ chart_id: chartId }, 'created_date', 100),
    enabled: !!chartId,
    initialData: []
  });

  // Order sections by the chart's sections array (which stores ordered IDs)
  // Fall back to created_date order if chart.sections is empty/missing
  const sections = React.useMemo(() => {
    if (!chart?.sections?.length) return rawSections;
    const orderedIds = chart.sections;
    const sectionMap = Object.fromEntries(rawSections.map(s => [s.id, s]));
    const ordered = orderedIds.map(id => sectionMap[id]).filter(Boolean);
    // Append any sections not in the ordered list (shouldn't happen, but safe)
    const unordered = rawSections.filter(s => !orderedIds.includes(s.id));
    return [...ordered, ...unordered];
  }, [rawSections, chart?.sections]);

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
      await base44.functions.invoke('transposeChart', {
        chart_id: chartId,
        target_key: newKey
      });
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

  // No manual save needed in ChartViewer — all edits are persisted immediately via mutations.

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      
      // Delete: Delete selected measure
      if (e.key === 'Delete' && selectedMeasure) {
        e.preventDefault();
        handleDeleteSelectedMeasure();
      }
      
      // Arrow keys: Navigate measures
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (selectedSection && selectedMeasureIndex !== null) {
          e.preventDefault();
          const newIndex = e.key === 'ArrowLeft' 
            ? Math.max(0, selectedMeasureIndex - 1)
            : Math.min(selectedSection.measures.length - 1, selectedMeasureIndex + 1);
          
          if (newIndex !== selectedMeasureIndex) {
            handleMeasureClick(
              selectedSection.measures[newIndex],
              newIndex,
              selectedSection
            );
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMeasure, selectedMeasureIndex, selectedSection]);

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

  const createSection = useMutation({
    mutationFn: async (label) => {
      const newSection = await base44.entities.Section.create({
        chart_id: chartId,
        label,
        measures: [{ chords: [{ chord: '-', beats: 4, symbols: [] }], cue: '' }],
        repeat_count: 1
      });
      // Append the new section ID to the chart's ordered sections list
      const currentOrderedIds = chart?.sections || [];
      await base44.entities.Chart.update(chartId, {
        sections: [...currentOrderedIds, newSection.id]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', chartId] });
      queryClient.invalidateQueries({ queryKey: ['chart', chartId] });
      toast.success('Section added');
    }
  });

  const deleteSection = useMutation({
    mutationFn: async (sectionId) => {
      await base44.entities.Section.delete(sectionId);
      // Remove from chart's ordered sections list
      const currentOrderedIds = (chart?.sections || []).filter(id => id !== sectionId);
      await base44.entities.Chart.update(chartId, { sections: currentOrderedIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', chartId] });
      queryClient.invalidateQueries({ queryKey: ['chart', chartId] });
      toast.success('Section deleted');
    }
  });

  const duplicateSection = useMutation({
    mutationFn: async (section) => {
      const newSection = await base44.entities.Section.create({
        chart_id: chartId,
        label: section.label,
        measures: section.measures,
        repeat_count: section.repeat_count,
        arrangement_cue: section.arrangement_cue,
        modulation_key: section.modulation_key,
        pivot_cue: section.pivot_cue
      });
      // Insert duplicate right after the original in the order list
      const currentOrderedIds = chart?.sections || [];
      const originalIdx = currentOrderedIds.indexOf(section.id);
      const updatedIds = [...currentOrderedIds];
      if (originalIdx >= 0) {
        updatedIds.splice(originalIdx + 1, 0, newSection.id);
      } else {
        updatedIds.push(newSection.id);
      }
      await base44.entities.Chart.update(chartId, { sections: updatedIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', chartId] });
      queryClient.invalidateQueries({ queryKey: ['chart', chartId] });
      toast.success('Section duplicated');
    }
  });

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const reorderedSections = Array.from(sections);
    const [removed] = reorderedSections.splice(result.source.index, 1);
    reorderedSections.splice(result.destination.index, 0, removed);

    // Optimistically update UI
    queryClient.setQueryData(['sections', chartId], reorderedSections);

    // Persist the new order as an array of IDs on the chart record
    const orderedIds = reorderedSections.map(s => s.id);
    await base44.entities.Chart.update(chartId, { sections: orderedIds });
    queryClient.invalidateQueries({ queryKey: ['chart', chartId] });
  };

  const moveSectionUp = (sectionIndex) => {
    if (sectionIndex === 0) return;
    const newSections = [...sections];
    [newSections[sectionIndex - 1], newSections[sectionIndex]] = 
      [newSections[sectionIndex], newSections[sectionIndex - 1]];
    handleDragEnd({ 
      source: { index: sectionIndex }, 
      destination: { index: sectionIndex - 1 } 
    });
  };

  const moveSectionDown = (sectionIndex) => {
    if (sectionIndex === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[sectionIndex], newSections[sectionIndex + 1]] = 
      [newSections[sectionIndex + 1], newSections[sectionIndex]];
    handleDragEnd({ 
      source: { index: sectionIndex }, 
      destination: { index: sectionIndex + 1 } 
    });
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      let functionName = 'exportChartPDF';
      let filename = `${chart.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;

      if (chart.display_mode === 'roman') {
        functionName = 'exportChartPDFRoman';
        filename = `${chart.title.replace(/[^a-z0-9]/gi, '_')}_roman.pdf`;
      } else if (chart.display_mode === 'nns') {
        functionName = 'exportChartPDFNNS';
        filename = `${chart.title.replace(/[^a-z0-9]/gi, '_')}_nns.pdf`;
      }

      const response = await base44.functions.invoke(functionName, { chart_id: chartId });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
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

  const shareChart = useMutation({
    mutationFn: async (sharedWith) => {
      await base44.entities.Chart.update(chartId, { shared_with: sharedWith });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart', chartId] });
      toast.success('Chart sharing settings updated');
      setShareDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to update sharing settings');
    }
  });

  if (isLoading) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white text-xl font-sans">Loading chart...</div>
        </div>
      </div>
    );
  }

  if (error || !chart) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4 font-sans">Chart not found</h2>
          <p className="text-[#a0a0a0] mb-6 font-sans">This chart may have been deleted or you don't have access to it.</p>
          <Link to={createPageUrl("Home")}>
            <Button>Back to Charts</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Top Bar */}
      <div className="bg-[#141414] border-b border-[#2a2a2a] px-6 py-3 shadow-lg grid grid-cols-3 items-center">
        {/* Left — Logo */}
        <Link to={createPageUrl("Home")} className="flex items-center gap-1.5">
          <div className="grid grid-cols-2 gap-0.5 w-7 h-7 flex-shrink-0">
            <div className="bg-white rounded-[2px] flex items-center justify-center">
              <span className="text-black font-black text-[7px] leading-none">1</span>
            </div>
            <div className="rounded-[2px] flex items-center justify-center border border-[#D0021B]" style={{ background: '#0a0a0a', boxShadow: '0 0 4px #D0021B' }}>
              <span className="text-[#D0021B] font-black text-[7px] leading-none">4</span>
            </div>
            <div className="rounded-[2px] flex items-center justify-center border border-[#D0021B]" style={{ background: '#0a0a0a', boxShadow: '0 0 4px #D0021B' }}>
              <span className="text-[#D0021B] font-black text-[7px] leading-none">5</span>
            </div>
            <div className="rounded-[2px] flex items-center justify-center border border-[#c17f00]" style={{ background: '#0a0a0a', boxShadow: '0 0 4px #c17f00' }}>
              <span className="text-[#e09a00] font-black text-[6px] leading-none">6-</span>
            </div>
          </div>
          <span className="text-sm font-bold tracking-tight text-white font-mono">ChartScribe<span className="text-[#D0021B]">AI</span></span>
        </Link>

        {/* Center — Song title + artist */}
        <div className="flex flex-col items-center">
          <h1 className="text-base font-bold text-white font-sans leading-tight">{chart.title}</h1>
          {chart.artist && <p className="text-xs text-[#6b6b6b] font-sans">{chart.artist}</p>}
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-3 justify-end">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShareDialogOpen(true)}
            className="gap-2 transition-all"
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(208, 2, 27, 0.1)'; e.currentTarget.style.borderColor = 'rgba(208, 2, 27, 0.5)'; e.currentTarget.style.color = '#D0021B'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#ffffff'; }}
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="gap-2 transition-all"
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(208, 2, 27, 0.1)'; e.currentTarget.style.borderColor = 'rgba(208, 2, 27, 0.5)'; e.currentTarget.style.color = '#D0021B'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#ffffff'; }}
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <div className="text-xs text-[#4a4a4a] italic font-sans">Auto-saved</div>
          <div className="w-8 h-8 bg-[#2a2a2a] rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-[#a0a0a0]" />
          </div>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Song Settings */}
        {editMode && (
        <SongSettingsSidebar
          chart={chart}
          sections={sections}
          onSaveSettings={(data) => {
            if (data.key !== chart.key) {
              transposeChart.mutate(data.key);
            } else {
              const updates = {};
              if (data.time_signature !== chart.time_signature) updates.time_signature = data.time_signature;
              if (data.tempo !== chart.tempo) updates.tempo = data.tempo;
              if (Object.keys(updates).length > 0) updateChart.mutate(updates);
            }
          }}
           onToggleNotation={toggleDisplayMode}
          />
          )}

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChartToolbar
            hasSelection={!!selectedMeasure}
            zoomLevel={zoomLevel}
            onZoomIn={() => setZoomLevel(prev => Math.min(prev + 10, 200))}
            onZoomOut={() => setZoomLevel(prev => Math.max(prev - 10, 50))}
            onDelete={handleDeleteSelectedMeasure}
            onAddMeasure={() => sections[0] && handleAddMeasure(sections[0].id)}
            editMode={editMode}
            onToggleEditMode={() => setEditMode(!editMode)}
            displayMode={chart.display_mode}
            onToggleDisplayMode={toggleDisplayMode}
          />
          
          <div className="flex-1 overflow-auto bg-[#0a0a0a] p-8">
            {sections.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-[#6b6b6b] mb-4">Chart is empty. Add sections to get started.</p>
                  {editMode && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="gap-2" style={{ backgroundColor: '#D0021B' }}>
                          <Plus className="w-4 h-4" />
                          Add Section
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        {['Intro', 'Verse', 'Pre', 'Chorus', 'Bridge', 'Instrumental Solo', 'Outro'].map(label => (
                          <DropdownMenuItem 
                            key={label}
                            onClick={() => createSection.mutate(label)}
                            className="text-white hover:bg-[#252525]"
                          >
                            {label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ) : editMode ? (
              // Edit Mode - Standard View
              <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="sections">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className="space-y-8"
                      >
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
                          onDeleteSection={(sectionId) => deleteSection.mutate(sectionId)}
                          onDuplicateSection={(section) => duplicateSection.mutate(section)}
                          onMoveSectionUp={moveSectionUp}
                          onMoveSectionDown={moveSectionDown}
                        />
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {/* Add Section Button */}
                <div className="mt-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2 w-full" style={{ borderColor: '#D0021B', color: '#D0021B' }}>
                        <Plus className="w-4 h-4" />
                        Add Section
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                      {['Intro', 'Verse', 'Pre', 'Chorus', 'Bridge', 'Instrumental Solo', 'Outro'].map(label => (
                        <DropdownMenuItem 
                          key={label}
                          onClick={() => createSection.mutate(label)}
                          className="text-white hover:bg-[#252525]"
                        >
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : (
              // Read Mode - 2-Column Grid (fill left column first, then right)
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-3">
                  {sections.slice(0, Math.ceil(sections.length / 2)).map((section, index) => (
                    <div key={section.id} className="bg-[#111111] rounded-lg overflow-hidden border border-[#2a2a2a]">
                      <ChartDisplay 
                        sections={[section]}
                        chartKey={chart.key}
                        displayMode={chart.display_mode}
                        editMode={false}
                        onUpdateSection={handleUpdateSection}
                        onAddMeasure={handleAddMeasure}
                        onMeasureClick={handleMeasureClick}
                        selectedMeasureIndex={selectedMeasureIndex}
                        selectedSectionId={selectedSection?.id}
                        onDeleteSection={(sectionId) => deleteSection.mutate(sectionId)}
                        onDuplicateSection={(section) => duplicateSection.mutate(section)}
                        onMoveSectionUp={() => moveSectionUp(index)}
                        onMoveSectionDown={() => moveSectionDown(index)}
                      />
                    </div>
                  ))}
                </div>
                {/* Right Column */}
                <div className="space-y-3">
                  {sections.slice(Math.ceil(sections.length / 2)).map((section, index) => (
                    <div key={section.id} className="bg-[#111111] rounded-lg overflow-hidden border border-[#2a2a2a]">
                      <ChartDisplay 
                        sections={[section]}
                        chartKey={chart.key}
                        displayMode={chart.display_mode}
                        editMode={false}
                        onUpdateSection={handleUpdateSection}
                        onAddMeasure={handleAddMeasure}
                        onMeasureClick={handleMeasureClick}
                        selectedMeasureIndex={selectedMeasureIndex}
                        selectedSectionId={selectedSection?.id}
                        onDeleteSection={(sectionId) => deleteSection.mutate(sectionId)}
                        onDuplicateSection={(section) => duplicateSection.mutate(section)}
                        onMoveSectionUp={() => moveSectionUp(index + Math.ceil(sections.length / 2))}
                        onMoveSectionDown={() => moveSectionDown(index + Math.ceil(sections.length / 2))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Measure Properties */}
        {editMode && (
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
        )}
      </div>

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        currentSharedUsers={chart?.shared_with || []}
        onShare={(sharedWith) => shareChart.mutate(sharedWith)}
        isLoading={shareChart.isPending}
        chartId={chartId}
      />
    </div>
  );
}