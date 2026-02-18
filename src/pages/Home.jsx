import React, { useState, useMemo, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, Star, List, Share2, Filter, ChevronDown, Plus, Search, X, Trash2, Calendar, MapPin, MoreVertical, Users } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import ChartCardMenu from "@/components/chart/ChartCardMenu";
import SetlistDialog from "@/components/setlist/SetlistDialog";
import ChartCardSkeleton from "@/components/ChartCardSkeleton";
import KeyboardShortcutsModal from "@/components/KeyboardShortcutsModal";
import BulkShareDialog from "@/components/chart/BulkShareDialog";
import BeginnerGuide from "@/components/BeginnerGuide";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentView = new URLSearchParams(location.search).get('view') || 'all';
  const searchInputRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKey, setFilterKey] = useState("all");
  const [filterTimeSignature, setFilterTimeSignature] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showSetlistDialog, setShowSetlistDialog] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showBulkShare, setShowBulkShare] = useState(false);
  const [showBeginnerGuide, setShowBeginnerGuide] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: charts, isLoading, error: chartsError } = useQuery({
    queryKey: ['charts', currentView],
    queryFn: async () => {
      const allCharts = await base44.entities.Chart.list('-updated_date');
      
      // Filter to shared charts when viewing "shared"
      if (currentView === 'shared' && user?.email) {
        return allCharts.filter(chart => 
          chart.shared_with_users?.includes(user.email)
        );
      }
      
      return allCharts;
    },
    initialData: [],
    enabled: currentView !== 'shared' || !!user?.email,
  });

  const { data: setlists = [], error: setlistsError } = useQuery({
    queryKey: ['setlists'],
    queryFn: () => base44.entities.Setlist.list('-created_date'),
    initialData: []
  });

  const toggleStarred = useMutation({
    mutationFn: async ({ chartId, starred }) => {
      await base44.entities.Chart.update(chartId, { starred });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charts'] });
    }
  });

  const duplicateChart = useMutation({
    mutationFn: async (chart) => {
      // Get all sections for this chart
      const sections = await base44.entities.Section.filter({ chart_id: chart.id });
      
      // Create duplicate chart
      const newChart = await base44.entities.Chart.create({
        title: `${chart.title} (Copy)`,
        artist: chart.artist,
        key: chart.key,
        time_signature: chart.time_signature,
        tempo: chart.tempo,
        display_mode: chart.display_mode,
        arrangement_notes: chart.arrangement_notes,
        starred: false
      });
      
      // Duplicate all sections
      await Promise.all(
        sections.map(section =>
          base44.entities.Section.create({
            chart_id: newChart.id,
            label: section.label,
            measures: section.measures,
            repeat_count: section.repeat_count,
            arrangement_cue: section.arrangement_cue,
            modulation_key: section.modulation_key,
            pivot_cue: section.pivot_cue
          })
        )
      );
      
      return newChart;
    },
    onSuccess: (newChart) => {
      queryClient.invalidateQueries({ queryKey: ['charts'] });
      toast.success('Chart duplicated successfully');
      navigate(createPageUrl("ChartViewer") + `?id=${newChart.id}`);
    },
    onError: () => {
      toast.error('Failed to duplicate chart');
    }
  });

  const deleteChart = useMutation({
    mutationFn: async (chartId) => {
      // Delete all sections first
      const sections = await base44.entities.Section.filter({ chart_id: chartId });
      await Promise.all(sections.map(section => base44.entities.Section.delete(section.id)));
      
      // Delete the chart
      await base44.entities.Chart.delete(chartId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charts'] });
      toast.success('Chart deleted');
    },
    onError: () => {
      toast.error('Failed to delete chart');
    }
  });

  const createSetlist = useMutation({
    mutationFn: (data) => base44.entities.Setlist.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlists'] });
      toast.success('Setlist created');
      setShowSetlistDialog(false);
    }
  });

  const deleteSetlist = useMutation({
    mutationFn: (setlistId) => base44.entities.Setlist.delete(setlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlists'] });
      toast.success('Setlist deleted');
    }
  });

  const bulkShareCharts = useMutation({
    mutationFn: async ({ chartIds, email, permission }) => {
      const { data } = await base44.functions.invoke('bulkShareCharts', {
        chartIds,
        email,
        permission
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['charts'] });
      toast.success(`Shared ${data.results.filter(r => r.success).length} chart(s) with ${data.email}`);
      setShowBulkShare(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to share charts');
    }
  });

  const filteredAndSortedCharts = useMemo(() => {
    let result = [...charts];

    // View filter (note: 'shared' filtering is already done in useQuery)
    if (currentView === 'favorites') {
      result = result.filter(chart => chart.starred);
    } else if (currentView === 'recent') {
      result = result.slice(0, 10); // Show last 10 edited
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(chart => 
        chart.title?.toLowerCase().includes(query) ||
        chart.artist?.toLowerCase().includes(query) ||
        chart.key?.toLowerCase().includes(query)
      );
    }

    // Key filter
    if (filterKey !== "all") {
      result = result.filter(chart => chart.key === filterKey);
    }

    // Time signature filter
    if (filterTimeSignature !== "all") {
      result = result.filter(chart => chart.time_signature === filterTimeSignature);
    }

    // Sort
    if (sortBy === "recent") {
      result.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.updated_date) - new Date(b.updated_date));
    } else if (sortBy === "alphabetical") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "key") {
      result.sort((a, b) => a.key.localeCompare(b.key));
    }

    return result;
  }, [charts, searchQuery, filterKey, filterTimeSignature, sortBy, currentView]);

  const uniqueKeys = useMemo(() => {
    const keys = new Set(charts.map(c => c.key));
    return Array.from(keys).sort();
  }, [charts]);

  const uniqueTimeSignatures = useMemo(() => {
    const sigs = new Set(charts.map(c => c.time_signature));
    return Array.from(sigs).sort();
  }, [charts]);

  const hasActiveFilters = filterKey !== "all" || filterTimeSignature !== "all" || searchQuery;

  const clearFilters = () => {
    setSearchQuery("");
    setFilterKey("all");
    setFilterTimeSignature("all");
  };

  // Dynamic stats
  const statsData = useMemo(() => {
    const favoritesCount = charts.filter(c => c.starred).length;
    const recentCount = charts.filter(c => {
      const diff = new Date() - new Date(c.updated_date);
      return diff < 7 * 24 * 60 * 60 * 1000; // Last 7 days
    }).length;
    
    return {
      total: charts.length,
      favorites: favoritesCount,
      setlists: setlists.length,
      recent: recentCount
    };
  }, [charts, setlists]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      
      // Cmd/Ctrl + K: Focus search
      if (modKey && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Cmd/Ctrl + N: New chart
      if (modKey && e.key === 'n') {
        e.preventDefault();
        navigate(createPageUrl("ChartCreator"));
      }
      
      // ?: Show shortcuts
      if (e.key === '?' && !e.shiftKey) {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {currentView === 'favorites' ? 'Favorites' : 
             currentView === 'recent' ? 'Recent' :
             currentView === 'setlists' ? 'Setlists' :
             currentView === 'shared' ? 'Shared with me' : 'My Charts'}
          </h1>
          <p className="text-sm text-[#a0a0a0]">
            {filteredAndSortedCharts.length} of {charts.length} {charts.length === 1 ? 'chart' : 'charts'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("ChartCreator")}>
            <Button className="gap-2 shadow-lg shadow-red-600/20">
              <Plus className="w-4 h-4" />
              New Chart
              <span className="ml-1 text-xs opacity-60">⌘N</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, artist, or key... (⌘K)"
              className="pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Key Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Key: {filterKey === "all" ? "All" : filterKey}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              <DropdownMenuLabel className="text-[#a0a0a0]">Filter by Key</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#2a2a2a]" />
              <DropdownMenuItem 
                onClick={() => setFilterKey("all")}
                className="text-white hover:bg-[#252525]"
              >
                All Keys
              </DropdownMenuItem>
              {uniqueKeys.map(key => (
                <DropdownMenuItem 
                  key={key}
                  onClick={() => setFilterKey(key)}
                  className="text-white hover:bg-[#252525]"
                >
                  {key}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Time Signature Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Time: {filterTimeSignature === "all" ? "All" : filterTimeSignature}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              <DropdownMenuLabel className="text-[#a0a0a0]">Filter by Time Signature</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#2a2a2a]" />
              <DropdownMenuItem 
                onClick={() => setFilterTimeSignature("all")}
                className="text-white hover:bg-[#252525]"
              >
                All Time Signatures
              </DropdownMenuItem>
              {uniqueTimeSignatures.map(sig => (
                <DropdownMenuItem 
                  key={sig}
                  onClick={() => setFilterTimeSignature(sig)}
                  className="text-white hover:bg-[#252525]"
                >
                  {sig}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Sort: {sortBy === "recent" ? "Recent" : sortBy === "oldest" ? "Oldest" : sortBy === "alphabetical" ? "A-Z" : "By Key"}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              <DropdownMenuLabel className="text-[#a0a0a0]">Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#2a2a2a]" />
              <DropdownMenuItem 
                onClick={() => setSortBy("recent")}
                className="text-white hover:bg-[#252525]"
              >
                Most Recent
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("oldest")}
                className="text-white hover:bg-[#252525]"
              >
                Oldest First
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("alphabetical")}
                className="text-white hover:bg-[#252525]"
              >
                Alphabetical (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("key")}
                className="text-white hover:bg-[#252525]"
              >
                By Key
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              onClick={clearFilters}
              className="gap-2 text-red-500 hover:text-red-400 hover:bg-red-600/10"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Setlists View */}
      {currentView === 'setlists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Setlists</h2>
              <p className="text-[#6b6b6b] text-sm mt-1">Organize your charts for performances</p>
            </div>
            <Button onClick={() => setShowSetlistDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Setlist
            </Button>
          </div>

          {setlists.length === 0 ? (
            <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
              <List className="w-12 h-12 text-[#6b6b6b] mx-auto mb-4" />
              <p className="text-[#6b6b6b] mb-4">No setlists yet</p>
              <Button onClick={() => setShowSetlistDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Setlist
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {setlists.map((setlist) => (
                <Link
                  key={setlist.id}
                  to={createPageUrl("SetlistViewer") + `?id=${setlist.id}`}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 hover:border-red-600 hover:bg-[#1e1e1e] transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{setlist.name}</h3>
                      {setlist.description && (
                        <p className="text-[#a0a0a0] text-sm mb-3">{setlist.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-[#6b6b6b]">
                        <span>{setlist.chart_ids?.length || 0} charts</span>
                        {setlist.event_date && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(setlist.event_date).toLocaleDateString()}
                            </div>
                          </>
                        )}
                        {setlist.venue && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {setlist.venue}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-[#6b6b6b] hover:text-white"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            if (window.confirm(`Delete "${setlist.name}"?`)) {
                              deleteSetlist.mutate(setlist.id);
                            }
                          }}
                          className="text-red-500 hover:bg-red-600/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Setlist
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Charts View */}
      {currentView !== 'setlists' && (
        <>
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 hover:bg-[#252525] hover:border-[#3a3a3a] transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#a0a0a0] group-hover:text-white transition-colors">Total Charts</span>
            <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
              <Music className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{statsData.total}</div>
          <div className="text-xs text-green-500 font-medium">+{statsData.recent} this week</div>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 hover:bg-[#252525] hover:border-[#3a3a3a] transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#a0a0a0] group-hover:text-white transition-colors">Favorites</span>
            <div className="w-10 h-10 rounded-lg bg-yellow-600/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{statsData.favorites}</div>
          <div className="text-xs text-[#6b6b6b]">Starred charts</div>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 hover:bg-[#252525] hover:border-[#3a3a3a] transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#a0a0a0] group-hover:text-white transition-colors">Setlists</span>
            <div className="w-10 h-10 rounded-lg bg-orange-600/10 flex items-center justify-center">
              <List className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{statsData.setlists}</div>
          <div className="text-xs text-[#6b6b6b]">Total setlists</div>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 hover:bg-[#252525] hover:border-[#3a3a3a] transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#a0a0a0] group-hover:text-white transition-colors">Shared</span>
            <div className="w-10 h-10 rounded-lg bg-red-600/10 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{statsData.recent}</div>
          <div className="text-xs text-[#6b6b6b]">Edited this week</div>
        </div>
      </div>

      {/* Error State */}
      {chartsError ? (
        <div className="bg-[#1a1a1a] border border-red-600/20 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to load charts</h2>
          <p className="text-[#a0a0a0] mb-6">There was an error loading your charts. Please try again.</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['charts'] })}>
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <ChartCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredAndSortedCharts.length === 0 ? (
        <div className="bg-[#1a1a1a] border-2 border-dashed border-[#2a2a2a] rounded-xl p-24 text-center hover:border-[#3a3a3a] transition-all">
          <div className="w-24 h-24 rounded-full bg-[#2a2a2a] flex items-center justify-center mx-auto mb-6">
            <Music className="w-12 h-12 text-[#4a4a4a]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            {hasActiveFilters ? "No charts found" : "No charts yet"}
          </h2>
          <p className="text-[#a0a0a0] mb-8 text-base">
            {hasActiveFilters 
              ? "Try adjusting your filters or search"
              : "Start creating your first chord chart"
            }
          </p>
          {hasActiveFilters ? (
            <Button onClick={clearFilters} variant="outline" className="gap-2">
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
          ) : (
            <Link to={createPageUrl("ChartCreator")}>
              <Button className="shadow-lg shadow-red-600/20">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Chart
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedCharts.map((chart) => (
            <Link key={chart.id} to={createPageUrl("ChartViewer") + `?id=${chart.id}`}>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 hover:bg-[#252525] hover:border-[#3a3a3a] hover:scale-[1.02] transition-all cursor-pointer group shadow-lg hover:shadow-xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-white truncate group-hover:text-red-500 transition-colors" title={chart.title}>
                        {chart.title}
                      </h3>
                      {currentView === 'shared' && (
                        <span className="flex-shrink-0 px-2 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-semibold whitespace-nowrap">
                          Shared with you
                        </span>
                      )}
                      {currentView !== 'shared' && chart.shared_with_users?.length > 0 && (
                        <span className="flex-shrink-0 px-2 py-1 rounded-full bg-purple-600/20 text-purple-400 text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                          <Users className="w-3 h-3" />
                          {chart.shared_with_users.length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-[#a0a0a0]">Key: <span className="text-white font-semibold">{chart.key}</span></span>
                      <span className="text-[#4a4a4a]">•</span>
                      <span className="text-[#a0a0a0]">{chart.time_signature}</span>
                      {currentView === 'shared' && chart.created_by && (
                        <>
                          <span className="text-[#4a4a4a]">•</span>
                          <span className="text-[#a0a0a0]">by <span className="text-white font-semibold">{chart.created_by}</span></span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleStarred.mutate({ chartId: chart.id, starred: !chart.starred });
                      }}
                      className="text-[#6b6b6b] hover:text-yellow-500 transition-all hover:scale-110 p-1"
                    >
                      <Star className={`w-5 h-5 ${chart.starred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </button>
                    <ChartCardMenu
                      onDuplicate={() => duplicateChart.mutate(chart)}
                      onDelete={() => {
                        if (window.confirm(`Delete "${chart.title}"? This cannot be undone.`)) {
                          deleteChart.mutate(chart.id);
                        }
                      }}
                      onShare={() => {
                        navigator.clipboard.writeText(window.location.origin + createPageUrl("ChartViewer") + `?id=${chart.id}`);
                        toast.success('Link copied to clipboard');
                      }}
                      onOpenNewTab={() => {
                        window.open(createPageUrl("ChartViewer") + `?id=${chart.id}`, '_blank');
                      }}
                    />
                  </div>
                </div>
                
                <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3 mb-4 min-h-[56px] flex items-center">
                  {chart.key && chart.time_signature ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider">{chart.key}</span>
                      <span className="text-[#3a3a3a]">·</span>
                      <span className="text-xs text-[#6b6b6b]">{chart.time_signature}</span>
                      {chart.tempo && (
                        <>
                          <span className="text-[#3a3a3a]">·</span>
                          <span className="text-xs text-[#6b6b6b]">{chart.tempo} BPM</span>
                        </>
                      )}
                      {chart.data_source && (
                        <>
                          <span className="text-[#3a3a3a]">·</span>
                          <span className={`text-xs font-semibold ${chart.data_source === 'chordonomicon' ? 'text-green-500' : chart.data_source === 'llm' ? 'text-blue-400' : 'text-[#6b6b6b]'}`}>
                            {chart.data_source === 'chordonomicon' ? 'Chordonomicon' : chart.data_source === 'llm' ? 'AI' : 'Manual'}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-[#4a4a4a] italic">No key set</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs text-[#6b6b6b]">
                  <span>Modified {getRelativeTime(chart.updated_date)}</span>
                  <button className="hover:text-white transition-colors p-1">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
        </>
      )}

      {/* Setlist Dialog */}
      <SetlistDialog
        open={showSetlistDialog}
        onOpenChange={setShowSetlistDialog}
        onSave={(data) => createSetlist.mutate(data)}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
      />
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