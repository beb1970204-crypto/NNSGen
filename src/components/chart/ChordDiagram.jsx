import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const STANDARD_TUNING = ['E', 'A', 'D', 'G', 'B', 'E'];

export default function ChordDiagram({ chord, size = 'sm' }) {
  const [voicing, setVoicing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chord) return;

    const fetchChordDiagram = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await base44.functions.invoke('getGuitarChordDiagram', { chord });
        if (response.data?.found) {
          setVoicing(response.data.frets);
        } else {
          setError(response.data?.error || 'Chord not found');
          setVoicing(null);
        }
      } catch (err) {
        setError(err.message || 'Failed to load chord');
        setVoicing(null);
      } finally {
        setLoading(false);
      }
    };

    fetchChordDiagram();
  }, [chord]);

  if (!chord) return null;
  if (loading) return <div className="text-xs text-[#6b6b6b]">Loading...</div>;
  if (error || !voicing) return null;

  const isSmall = size === 'sm';
  const width = isSmall ? 100 : 120;
  const height = isSmall ? 140 : 160;
  const stringSpacing = (width - 20) / 5;
  const fretSpacing = isSmall ? 20 : 25;
  const dotRadius = isSmall ? 4 : 5;
  const fontSize = isSmall ? 8 : 10;

  const maxFret = Math.max(...voicing.filter(f => f > 0));
  const startFret = Math.max(0, maxFret - 4);

  return (
    <svg width={width} height={height} className="bg-[#0a0a0a] rounded border border-[#2a2a2a]">
      {/* Nut/Fret indicator */}
      {startFret === 0 ? (
        <rect x={8} y={8} width={width - 16} height={3} fill="#D0021B" />
      ) : (
        <text x={width / 2} y={12} textAnchor="middle" fill="#6b6b6b" fontSize={fontSize - 1}>
          {startFret + 1}
        </text>
      )}

      {/* Fret lines */}
      {[0, 1, 2, 3, 4].map((fretIdx) => {
        const fretNum = startFret + fretIdx;
        const y = 12 + (fretIdx + 1) * fretSpacing;
        return (
          <line
            key={`fret-${fretNum}`}
            x1={10}
            y1={y}
            x2={width - 10}
            y2={y}
            stroke="#2a2a2a"
            strokeWidth="1"
          />
        );
      })}

      {/* Strings */}
      {[0, 1, 2, 3, 4, 5].map((stringIdx) => {
        const x = 10 + stringIdx * stringSpacing + stringSpacing / 2;
        return (
          <g key={`string-${stringIdx}`}>
            <line x1={x} y1={12} x2={x} y2={height - 8} stroke="#6b6b6b" strokeWidth="1.5" />
            {/* String label */}
            <text
              x={x}
              y={height - 2}
              textAnchor="middle"
              fill="#a0a0a0"
              fontSize={fontSize - 1}
              fontWeight="bold"
            >
              {STANDARD_TUNING[stringIdx]}
            </text>
          </g>
        );
      })}

      {/* Fret dots and mutes */}
      {voicing.map((fret, stringIdx) => {
        const x = 10 + stringIdx * stringSpacing + stringSpacing / 2;

        if (fret === null || fret === undefined) {
          // Open string (O)
          return (
            <text
              key={`dot-${stringIdx}`}
              x={x}
              y={18}
              textAnchor="middle"
              fill="#a0a0a0"
              fontSize={fontSize + 2}
              fontWeight="bold"
            >
              ○
            </text>
          );
        }

        if (fret === 0) {
          // Muted string (X)
          return (
            <text
              key={`dot-${stringIdx}`}
              x={x}
              y={18}
              textAnchor="middle"
              fill="#D0021B"
              fontSize={fontSize + 2}
              fontWeight="bold"
            >
              ✕
            </text>
          );
        }

        const fretIdx = fret - startFret - 1;
        if (fretIdx < 0 || fretIdx > 3) return null;

        const y = 12 + (fretIdx + 1) * fretSpacing + fretSpacing / 2;

        return (
          <circle
            key={`dot-${stringIdx}`}
            cx={x}
            cy={y}
            r={dotRadius}
            fill="#D0021B"
            stroke="white"
            strokeWidth="0.5"
          />
        );
      })}
    </svg>
  );
}