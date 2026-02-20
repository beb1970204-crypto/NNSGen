import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ErrorBoundary from "@/components/ErrorBoundary";
import { 
  LayoutGrid, Star, Clock, List, Share2, 
  Settings, HelpCircle, User, HelpingHand
} from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const isChartViewer = currentPageName === "ChartViewer";
  const isChartCreator = currentPageName === "ChartCreator";
  const currentView = new URLSearchParams(location.search).get('view') || 'all';
  
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: charts = [] } = useQuery({
    queryKey: ['charts-count'],
    queryFn: () => base44.entities.Chart.list(),
    initialData: [],
  });

  const { data: setlists = [] } = useQuery({
    queryKey: ['setlists'],
    queryFn: () => base44.entities.Setlist.list('-created_date'),
    initialData: [],
  });

  const sharedChartsCount = charts.filter(chart => 
    user?.email && chart.shared_with?.some(share => share.email === user.email)
  ).length;
  
  const navItems = [
    { label: "My Charts", icon: LayoutGrid, path: "Home", view: "all", active: currentView === "all" },
    { label: "Favorites", icon: Star, path: "Home", view: "favorites", active: currentView === "favorites" },
    { label: "Recent", icon: Clock, path: "Home", view: "recent", active: currentView === "recent" },
    { label: "Setlists", icon: List, path: "Home", view: "setlists", active: currentView === "setlists" },
    { label: "Shared with me", icon: Share2, path: "Home", view: "shared", active: currentView === "shared", badge: sharedChartsCount },
  ];

  const folders = [
    { name: "Worship Songs", count: 24, color: "bg-blue-600" },
    { name: "Country Covers", count: 18, color: "bg-orange-600" },
    { name: "Originals", count: 7, color: "bg-red-600" },
  ];

  // Hide sidebar for ChartViewer and ChartCreator
  if (isChartViewer || isChartCreator) {
    return <div className="min-h-screen bg-[#0a0a0a]">{children}</div>;
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#141414] border-b border-[#2a2a2a] z-50 flex items-center px-6 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-2 gap-0.5 w-10 h-10 flex-shrink-0">
            <div className="bg-white rounded-sm flex items-center justify-center">
              <span className="text-black font-black text-xs leading-none">1</span>
            </div>
            <div className="rounded-sm flex items-center justify-center border border-[#D0021B]" style={{ background: '#0a0a0a', boxShadow: '0 0 6px #D0021B' }}>
              <span className="text-[#D0021B] font-black text-xs leading-none">4</span>
            </div>
            <div className="rounded-sm flex items-center justify-center border border-[#D0021B]" style={{ background: '#0a0a0a', boxShadow: '0 0 6px #D0021B' }}>
              <span className="text-[#D0021B] font-black text-xs leading-none">5</span>
            </div>
            <div className="rounded-sm flex items-center justify-center border border-[#c17f00]" style={{ background: '#0a0a0a', boxShadow: '0 0 6px #c17f00' }}>
              <span className="text-[#e09a00] font-black text-xs leading-none">6-</span>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold tracking-tight text-white font-mono">ChartScribe</span>
            <span className="text-lg font-bold tracking-tight text-[#D0021B] font-mono">AI</span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="fixed top-16 left-0 w-60 h-[calc(100vh-4rem)] bg-[#141414] border-r border-[#2a2a2a] overflow-y-auto">
        <div className="p-5">
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search charts..."
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/20 transition-all"
            />
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5 mb-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={`${createPageUrl(item.path)}?view=${item.view}`}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer font-sans ${
                  item.active 
                    ? 'bg-[#D0021B] text-white shadow-lg shadow-[#D0021B]/20' 
                    : 'text-[#a0a0a0] hover:bg-[#252525] hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="flex-1">{item.label}</span>
                {item.badge > 0 && (
                  <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-[#D0021B] text-white text-xs font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Setlists */}
          <div>
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-xs font-bold text-[#6b6b6b] uppercase tracking-widest">Setlists</span>
              <Link to={`${createPageUrl("Home")}?view=setlists`}>
                <button className="text-[#6b6b6b] hover:text-[#D0021B] hover:scale-110 transition-all">
                  <span className="text-lg">+</span>
                </button>
              </Link>
            </div>
            <div className="space-y-1.5">
              {setlists && setlists.length > 0 ? (
                setlists.map((setlist) => (
                  <Link
                    key={setlist.id}
                    to={`${createPageUrl("SetlistViewer")}?id=${setlist.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm hover:bg-[#252525] cursor-pointer text-[#a0a0a0] hover:text-white transition-all group"
                  >
                    <List className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span className="flex-1 font-medium truncate">{setlist.name}</span>
                    <span className="text-xs text-[#6b6b6b] font-semibold">{setlist.chart_ids?.length || 0}</span>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-[#4a4a4a] italic px-4 py-2">No setlists yet</p>
              )}
            </div>
          </div>
        </div>

        {/* User Profile at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-[#2a2a2a] bg-[#141414] space-y-2">
          <Link to={`${createPageUrl("HelpGuide")}`}>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#252525] transition-all text-[#a0a0a0] hover:text-white text-sm font-medium">
              <HelpingHand className="w-4 h-4" />
              Help & Guide
            </button>
          </Link>
          <Link to={`${createPageUrl("Settings")}`}>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1a1a1a] transition-all group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-[#D0021B] to-[#A0011B] rounded-full flex items-center justify-center shadow-lg shadow-[#D0021B]/20">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate text-white">{user?.full_name || user?.email || 'User'}</div>
                <div className="text-xs text-[#6b6b6b]">Pro Plan</div>
              </div>
              <Settings className="w-4 h-4 text-[#6b6b6b] group-hover:text-white transition-colors" />
            </div>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-60 pt-16">
        {children}
      </div>
    </div>
    </ErrorBoundary>
  );
}