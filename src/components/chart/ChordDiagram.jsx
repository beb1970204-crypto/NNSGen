import React from 'react';

const STANDARD_TUNING = ['E', 'A', 'D', 'G', 'B', 'E'];
const DIAGRAM_WIDTH = 120;
const DIAGRAM_HEIGHT = 160;
const STRING_SPACING = (DIAGRAM_WIDTH - 20) / 5;
const FRET_SPACING = 25;

// Common chord voicings - maps chord name to fret positions [string 1-6] and finger positions
const CHORD_VOICINGS = {
  'C': [0, 3, 2, 0, 1, 0],
  'C#': [4, 4, 3, 1, 2, 4],
  'Cm': [3, 3, 5, 5, 5, 3],
  'D': [0, 0, 0, 2, 3, 2],
  'D#': [1, 1, 1, 3, 4, 3],
  'Dm': [0, 0, 0, 2, 3, 1],
  'E': [0, 2, 2, 1, 0, 0],
  'Em': [0, 2, 2, 0, 0, 0],
  'F': [1, 3, 3, 2, 1, 1],
  'F#': [2, 4, 4, 3, 2, 2],
  'Fm': [1, 3, 3, 1, 1, 1],
  'G': [3, 2, 0, 0, 3, 3],
  'G#': [4, 3, 1, 1, 4, 4],
  'Gm': [3, 5, 5, 3, 3, 3],
  'A': [0, 0, 2, 2, 2, 0],
  'A#': [1, 1, 3, 3, 3, 1],
  'Am': [0, 0, 2, 2, 1, 0],
  'B': [2, 2, 4, 4, 4, 2],
  'Bb': [1, 1, 3, 3, 3, 1],
  'Bm': [2, 3, 4, 4, 3, 2],
};

export default function ChordDiagram({ chord, size = 'sm' }) {
  if (!chord) return null;

  // Extract base chord name (remove extensions like maj7, add9, etc)
  const baseChord = chord.match(/^[A-G]#?m?b?/)?.[0] || chord;
  const voicing = CHORD_VOICINGS[baseChord];

  if (!voicing) return null;

  const isSmall = size === 'sm';
  const width = isSmall ? 100 : DIAGRAM_WIDTH;
  const height = isSmall ? 140 : DIAGRAM_HEIGHT;
  const stringSpacing = (width - 20) / 5;
  const fretSpacing = isSmall ? 20 : FRET_SPACING;
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

        if (fret === -1) return null; // Skip

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