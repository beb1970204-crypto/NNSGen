import React from "react";
import { Copy, Trash2, Share2, ExternalLink, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function ChartCardMenu({ 
  onDuplicate, 
  onDelete, 
  onShare,
  onOpenNewTab,
  chart
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-[#6b6b6b] hover:text-white hover:bg-[#2a2a2a]"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="bg-[#1a1a1a] border-[#2a2a2a]"
        align="end"
      >
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            onOpenNewTab();
          }}
          className="text-white hover:bg-[#252525] cursor-pointer"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in New Tab
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            onDuplicate();
          }}
          className="text-white hover:bg-[#252525] cursor-pointer"
        >
          <Copy className="w-4 h-4 mr-2" />
          Duplicate Chart
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={(e) => {
            e.stopPropagation();
            onShare(chart);
          }}
          className="text-white hover:bg-[#252525] cursor-pointer"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-[#2a2a2a]" />
        
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
          className="text-red-500 hover:bg-red-600/20 cursor-pointer"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Chart
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}