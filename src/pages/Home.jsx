import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Music, FileMusic } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: charts, isLoading } = useQuery({
    queryKey: ['charts'],
    queryFn: () => base44.entities.Chart.list('-updated_date'),
    initialData: [],
  });

  const filteredCharts = charts.filter(chart => 
    chart.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chart.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Music className="w-10 h-10 text-slate-700" />
            <h1 className="text-4xl font-bold text-slate-900">Chord Chart Generator</h1>
          </div>
          <p className="text-slate-600">Professional Nashville Number System charts for musicians</p>
        </div>

        {/* Actions Bar */}
        <div className="flex gap-4 mb-6">
          <Link to={createPageUrl("ChartCreator")} className="flex-shrink-0">
            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus className="w-5 h-5" />
              Create New Chart
            </Button>
          </Link>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by song title or artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Charts Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading charts...</div>
        ) : filteredCharts.length === 0 ? (
          <Card className="bg-white border-2 border-dashed border-slate-200">
            <CardContent className="py-12 text-center">
              <FileMusic className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                {searchQuery ? "No charts found" : "No charts yet"}
              </h3>
              <p className="text-slate-500 mb-4">
                {searchQuery ? "Try a different search term" : "Create your first chart to get started"}
              </p>
              {!searchQuery && (
                <Link to={createPageUrl("ChartCreator")}>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Chart
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCharts.map((chart) => (
              <Link key={chart.id} to={createPageUrl("ChartViewer") + `?id=${chart.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl">{chart.title}</CardTitle>
                    <p className="text-sm text-slate-500">{chart.artist}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 text-sm text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded">Key: {chart.key}</span>
                      <span className="bg-slate-100 px-2 py-1 rounded">{chart.time_signature}</span>
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded capitalize">
                        {chart.display_mode === 'nashville' ? 'NNS' : 'Chords'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}