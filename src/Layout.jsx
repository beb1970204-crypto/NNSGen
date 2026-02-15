import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutGrid, Star, Clock, List, Share2, FolderOpen, 
  Settings, HelpCircle, User, Music2 
} from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const isChartViewer = currentPageName === "ChartViewer";
  const isChartCreator = currentPageName === "ChartCreator";
  
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: charts = [] } = useQuery({
    queryKey: ['charts-count'],
    queryFn: () => base44.entities.Chart.list(),
    initialData: [],
  });

  const navItems = [
    { label: "My Charts", icon: LayoutGrid, path: "Home", active: currentPageName === "Home" },
    { label: "Favorites", icon: Star, path: "Home" },
    { label: "Recent", icon: Clock, path: "Home" },
    { label: "Setlists", icon: List, path: "Home" },
    { label: "Shared with me", icon: Share2, path: "Home" },
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-[#141414] border-b border-[#2a2a2a] z-50 flex items-center px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold">NNSGen</span>
        </div>
      </div>

      {/* Sidebar */}
      <div className="fixed top-14 left-0 w-56 h-[calc(100vh-3.5rem)] bg-[#141414] border-r border-[#2a2a2a] overflow-y-auto">
        <div className="p-4">
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search charts..."
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#3a3a3a]"
            />
          </div>

          {/* Navigation */}
          <nav className="space-y-1 mb-6">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={createPageUrl(item.path)}
                className={`sidebar-nav-item ${item.active ? 'active' : ''}`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Folders */}
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider">Folders</span>
              <button className="text-[#6b6b6b] hover:text-white">
                <span className="text-lg">+</span>
              </button>
            </div>
            <div className="space-y-1">
              {folders.map((folder) => (
                <div
                  key={folder.name}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm hover:bg-[#252525] cursor-pointer text-[#a0a0a0] hover:text-white transition-colors"
                >
                  <div className={`w-3 h-3 rounded ${folder.color}`} />
                  <span className="flex-1">{folder.name}</span>
                  <span className="text-xs text-[#6b6b6b]">{folder.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Profile at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2a2a2a] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-[#a0a0a0]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.full_name || user?.email || 'User'}</div>
              <div className="text-xs text-[#6b6b6b]">Pro Plan</div>
            </div>
            <button className="text-[#6b6b6b] hover:text-white">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-56 pt-14">
        {children}
      </div>
    </div>
  );
}