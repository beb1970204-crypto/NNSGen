import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Music, Star, List, Share2, Filter, ChevronDown, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: charts, isLoading } = useQuery({
    queryKey: ['charts'],
    queryFn: () => base44.entities.Chart.list('-updated_date'),
    initialData: [],
  });

  const filteredCharts = charts.filter(chart => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      chart.title?.toLowerCase().includes(query) ||
      chart.artist?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Charts</h1>
          <p className="text-sm text-[#6b6b6b]">{charts.length} charts</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#252525] gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="outline" className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#252525] gap-2">
            Sort by: Recent
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Link to={createPageUrl("ChartCreator")}>
            <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              New Chart
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#a0a0a0]">Total Charts</span>
            <Music className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">{charts.length}</div>
          <div className="text-xs text-green-500">+3 this week</div>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#a0a0a0]">Favorites</span>
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">18</div>
          <div className="text-xs text-[#6b6b6b]">Most played</div>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#a0a0a0]">Setlists</span>
            <List className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">6</div>
          <div className="text-xs text-[#6b6b6b]">Active gigs</div>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#a0a0a0]">Shared</span>
            <Share2 className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">12</div>
          <div className="text-xs text-[#6b6b6b]">Band members</div>
        </div>
      </div>

      {/* Charts Grid */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-pulse text-[#6b6b6b]">Loading charts...</div>
        </div>
      ) : filteredCharts.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-dashed border-[#2a2a2a] rounded-lg p-20 text-center">
          <Music className="w-20 h-20 text-[#3a3a3a] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            {searchQuery ? "No charts found" : "No charts yet"}
          </h2>
          <p className="text-[#6b6b6b] mb-6">
            {searchQuery 
              ? "Try a different search term"
              : "Start creating your first chord chart"
            }
          </p>
          {!searchQuery && (
            <Link to={createPageUrl("ChartCreator")}>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Chart
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCharts.map((chart) => (
            <Link key={chart.id} to={createPageUrl("ChartViewer") + `?id=${chart.id}`}>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 hover:bg-[#252525] transition-colors cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1 truncate group-hover:text-red-500 transition-colors">
                      {chart.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-[#a0a0a0]">
                      <span>Key: {chart.key}</span>
                      <span>•</span>
                      <span>{chart.time_signature}</span>
                    </div>
                  </div>
                  <button className="text-[#6b6b6b] hover:text-yellow-500 transition-colors">
                    <Star className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-3 mb-3">
                  <div className="text-xs text-[#6b6b6b] mb-1">[V1] 4 bars</div>
                  <div className="font-mono text-sm text-white">| 1 | 4 | 1 | 5 |</div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-[#6b6b6b]">
                  <span>Modified {getRelativeTime(chart.updated_date)}</span>
                  <button className="hover:text-white transition-colors">
                    <Share2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function getRelativeTime(date) {
  const now = new Date();
  const past = new Date(date);
  const diffTime = Math.abs(now - past);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}