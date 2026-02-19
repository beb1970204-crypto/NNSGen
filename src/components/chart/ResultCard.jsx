import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export default function ResultCard({
  title,
  subtitle,
  content,
  copyText,
  details,
  badge,
  color = 'text-[#a0a0a0]'
}) {
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 space-y-2 hover:border-[#3a3a3a] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-white">{title}</h4>
            {badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#D0021B]/20 text-[#D0021B]">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-[#6b6b6b]">{subtitle}</p>}
        </div>
        {copyText && (
          <button
            onClick={handleCopy}
            className="text-[#6b6b6b] hover:text-[#D0021B] transition-colors flex-shrink-0 p-1"
            title="Copy to clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className={`text-sm font-mono ${color}`}>
        {content}
      </div>

      {/* Details Section */}
      {details && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-xs text-[#6b6b6b] hover:text-white px-2 py-1.5 rounded bg-[#0a0a0a] transition-colors mt-2"
          >
            <span>More details</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>

          {expanded && (
            <div className="mt-2 space-y-2 text-xs text-[#a0a0a0] bg-[#0a0a0a] p-3 rounded border border-[#2a2a2a]">
              {typeof details === 'string' ? (
                <p>{details}</p>
              ) : Array.isArray(details) ? (
                details.map((detail, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-[#D0021B] flex-shrink-0">•</span>
                    <span>{detail}</span>
                  </div>
                ))
              ) : (
                Object.entries(details).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-[#6b6b6b] font-semibold">{key}</p>
                    <p className="text-[#a0a0a0]">{value}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}