import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, GripVertical, Calendar, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SetlistViewer() {
  const urlParams = new URLSearchParams(window.location.search);
  const setlistId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [addChartDialogOpen, setAddChartDialogOpen] = useState(false);

  const { data: setlist, isLoading, error } = useQuery({
    queryKey: ['setlist', setlistId],
    queryFn: () => base44.entities.Setlist.get(setlistId),
    enabled: !!setlistId
  });

  const { data: charts = [] } = useQuery({
    queryKey: ['charts'],
    queryFn: () => base44.entities.Chart.list(),
    initialData: []
  });

  const updateSetlist = useMutation({
    mutationFn: (data) => base44.entities.Setlist.update(setlistId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlist', setlistId] });
      toast.success('Setlist updated');
    }
  });

  const removeChart = (chartId) => {
    const updatedChartIds = setlist.chart_ids.filter(id => id !== chartId);
    updateSetlist.mutate({ chart_ids: updatedChartIds });
  };

  const addChart = (chartId) => {
    if (setlist.chart_ids.includes(chartId)) {
      toast.error('Chart already in setlist');
      return;
    }
    const updatedChartIds = [...setlist.chart_ids, chartId];
    updateSetlist.mutate({ chart_ids: updatedChartIds });
    setAddChartDialogOpen(false);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedIds = Array.from(setlist.chart_ids);
    const [removed] = reorderedIds.splice(result.source.index, 1);
    reorderedIds.splice(result.destination.index, 0, removed);

    updateSetlist.mutate({ chart_ids: reorderedIds });
  };

  const setlistCharts = setlist?.chart_ids
    ?.map(id => charts.find(c => c.id === id))
    .filter(Boolean) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white text-xl">Loading setlist...</div>
        </div>
      </div>
    );
  }

  if (error || !setlist) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Setlist not found</h2>
          <p className="text-[#a0a0a0] mb-6">This setlist may have been deleted or you don't have access to it.</p>
          <Link to={createPageUrl("Home") + "?view=setlists"}>
            <Button>Back to Setlists</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-[#141414] border-b border-[#2a2a2a] px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link to={createPageUrl("Home") + "?view=setlists"}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Setlists
              </Button>
            </Link>
            <Button onClick={() => setAddChartDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Chart
            </Button>
          </div>
          <h1 className="text-3xl font-bold">{setlist?.name}</h1>
          {setlist?.description && (
            <p className="text-[#a0a0a0] mt-2">{setlist.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-[#6b6b6b]">
            {setlist?.event_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(setlist.event_date).toLocaleDateString()}
              </div>
            )}
            {setlist?.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {setlist.venue}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart List */}
      <div className="max-w-5xl mx-auto p-6">
        {setlistCharts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#6b6b6b] mb-4">No charts in this setlist yet</p>
            <Button onClick={() => setAddChartDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Chart
            </Button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="setlist-charts">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {setlistCharts.map((chart, index) => (
                    <Draggable key={chart.id} draggableId={chart.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 flex items-center gap-4 ${
                            snapshot.isDragging ? 'opacity-50' : ''
                          }`}
                        >
                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-5 h-5 text-[#6b6b6b]" />
                          </div>
                          <div className="text-2xl font-bold text-[#6b6b6b] w-8">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{chart.title}</h3>
                            {chart.artist && (
                              <p className="text-sm text-[#6b6b6b]">{chart.artist}</p>
                            )}
                            <div className="flex gap-3 mt-2 text-xs text-[#6b6b6b]">
                              <span>Key: {chart.key}</span>
                              <span>•</span>
                              <span>{chart.time_signature}</span>
                              {chart.tempo && (
                                <>
                                  <span>•</span>
                                  <span>{chart.tempo} BPM</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Link to={createPageUrl("ChartViewer") + `?id=${chart.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeChart(chart.id)}
                            className="text-[#6b6b6b] hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Add Chart Dialog */}
      <Dialog open={addChartDialogOpen} onOpenChange={setAddChartDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Chart to Setlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {charts
              .filter(c => !setlist?.chart_ids.includes(c.id))
              .map(chart => (
                <button
                  key={chart.id}
                  onClick={() => addChart(chart.id)}
                  className="w-full text-left bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 hover:border-red-600 transition-all"
                >
                  <h3 className="font-semibold">{chart.title}</h3>
                  {chart.artist && <p className="text-sm text-[#6b6b6b]">{chart.artist}</p>}
                  <div className="flex gap-3 mt-2 text-xs text-[#6b6b6b]">
                    <span>Key: {chart.key}</span>
                    <span>•</span>
                    <span>{chart.time_signature}</span>
                  </div>
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}