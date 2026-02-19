import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Copy } from 'lucide-react';

export default function FeatureEmptyState({
  icon: Icon,
  title,
  description,
  expectedOutput,
  requirements = [],
  isLoading = false,
  onAction,
  actionLabel = 'Generate'
}) {
  const canAction = requirements.length === 0 || requirements.every(r => !r.unmet);

  return (
    <div className="flex flex-col gap-4 h-full justify-center">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 space-y-4">
        {/* Header with Icon */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#252525] rounded-lg">
            <Icon className="w-5 h-5 text-[#D0021B]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-xs text-[#a0a0a0] mt-1">{description}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#2a2a2a]" />

        {/* Requirements */}
        {requirements.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#6b6b6b] uppercase">Requirements</p>
            <div className="space-y-1">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[8px] font-bold ${
                    req.unmet ? 'bg-[#6b6b6b] text-[#2a2a2a]' : 'bg-green-600/30 text-green-400'
                  }`}>
                    {req.unmet ? '○' : '✓'}
                  </span>
                  <span className={req.unmet ? 'text-[#6b6b6b]' : 'text-[#a0a0a0]'}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expected Output */}
        {expectedOutput && (
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-3">
            <p className="text-xs font-semibold text-[#6b6b6b] mb-1">What you'll get</p>
            <p className="text-xs text-[#a0a0a0]">{expectedOutput}</p>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={onAction}
          disabled={isLoading || !canAction}
          className="w-full bg-[#D0021B] hover:bg-[#A0011B] text-white"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
              Generating...
            </>
          ) : (
            actionLabel
          )}
        </Button>

        {!canAction && (
          <p className="text-xs text-[#D0021B] text-center">
            {requirements.find(r => r.unmet)?.hint || 'Complete requirements to continue'}
          </p>
        )}
      </div>
    </div>
  );
}