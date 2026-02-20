import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Standard tuning low to high: E A D G B e
const STANDARD_TUNING = ['E', 'A', 'D', 'G', 'B', 'e'];

export default function ChordDiagram({ chord, frets: initialFrets, size = 'sm' }) {
  const [voicing, setVoicing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialFrets && Array.isArray(initialFrets) && initialFrets.length === 6) {
      setVoicing(initialFrets);
      setLoading(false);
      return;
    }
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
  }, [chord, initialFrets]);

  if (!chord && !initialFrets) return null;
  if (loading) return <div className="text-xs text-[#6b6b6b] py-2 text-center">Loading...</div>;
  if (error || !voicing) return null;

  // Layout constants
  const NUM_STRINGS = 6;
  const NUM_FRETS = 4;
  const paddingLeft = 18;   // space for mute/open markers on left edge
  const paddingRight = 14;
  const paddingTop = 22;    // space above nut for open/mute indicators
  const paddingBottom = 18; // space below last fret for tuning labels

  const isSmall = size === 'sm';
  const stringSpacing = isSmall ? 16 : 20;
  const fretSpacing = isSmall ? 18 : 22;
  const dotRadius = isSmall ? 5 : 6;
  const labelFontSize = isSmall ? 8 : 9;

  const totalWidth = paddingLeft + (NUM_STRINGS - 1) * stringSpacing + paddingRight;
  const totalHeight = paddingTop + NUM_FRETS * fretSpacing + paddingBottom;

  // Determine fret window
  const playedFrets = voicing.filter(f => f !== null && f > 0);
  const maxFret = playedFrets.length > 0 ? Math.max(...playedFrets) : 0;
  const minFret = playedFrets.length > 0 ? Math.min(...playedFrets) : 0;

  // Start the window so all dots fit in NUM_FRETS rows
  let startFret = minFret > 0 ? minFret - 1 : 0;
  if (maxFret - startFret > NUM_FRETS) startFret = maxFret - NUM_FRETS;
  const showNut = startFret === 0;

  const getStringX = (stringIdx) => paddingLeft + stringIdx * stringSpacing;
  const getFretY = (fretNum) => paddingTop + (fretNum - startFret) * fretSpacing;

  return (
    <svg
      width={totalWidth}
      height={totalHeight}
      className="bg-[#0a0a0a] rounded border border-[#2a2a2a]"
      style={{ display: 'block' }}
    >
      {/* Nut or fret position indicator */}
      {showNut ? (
        <rect
          x={paddingLeft}
          y={paddingTop - 4}
          width={(NUM_STRINGS - 1) * stringSpacing}
          height={4}
          fill="#D0021B"
          rx={1}
        />
      ) : (
        <text
          x={paddingLeft - 2}
          y={paddingTop + fretSpacing * 0.5 + 3}
          textAnchor="end"
          fill="#6b6b6b"
          fontSize={labelFontSize}
        >
          {startFret + 1}fr
        </text>
      )}

      {/* Fret lines */}
      {Array.from({ length: NUM_FRETS + 1 }).map((_, i) => {
        const y = paddingTop + i * fretSpacing;
        return (
          <line
            key={`fret-${i}`}
            x1={paddingLeft}
            y1={y}
            x2={paddingLeft + (NUM_STRINGS - 1) * stringSpacing}
            y2={y}
            stroke={i === 0 ? '#3a3a3a' : '#2a2a2a'}
            strokeWidth={i === 0 ? 1.5 : 1}
          />
        );
      })}

      {/* Strings (vertical lines) + tuning labels + open/mute markers */}
      {voicing.map((fret, stringIdx) => {
        const x = getStringX(stringIdx);
        const isMuted = fret === null;
        const isOpen = fret === 0;

        return (
          <g key={`string-${stringIdx}`}>
            {/* Vertical string line */}
            <line
              x1={x}
              y1={paddingTop}
              x2={x}
              y2={paddingTop + NUM_FRETS * fretSpacing}
              stroke="#4a4a4a"
              strokeWidth="1.2"
            />

            {/* Open/mute marker above nut */}
            {isMuted && (
              <text
                x={x}
                y={paddingTop - 7}
                textAnchor="middle"
                fill="#D0021B"
                fontSize={labelFontSize + 2}
                fontWeight="bold"
              >
                ✕
              </text>
            )}
            {isOpen && (
              <text
                x={x}
                y={paddingTop - 7}
                textAnchor="middle"
                fill="#a0a0a0"
                fontSize={labelFontSize + 2}
              >
                ○
              </text>
            )}

            {/* Tuning label below */}
            <text
              x={x}
              y={totalHeight - 4}
              textAnchor="middle"
              fill="#6b6b6b"
              fontSize={labelFontSize}
              fontWeight="bold"
            >
              {STANDARD_TUNING[stringIdx]}
            </text>
          </g>
        );
      })}

      {/* Fret dots */}
      {voicing.map((fret, stringIdx) => {
        if (fret === null || fret === 0) return null;
        const fretRow = fret - startFret;
        if (fretRow < 1 || fretRow > NUM_FRETS) return null;

        const x = getStringX(stringIdx);
        // Center dot between fret lines
        const y = paddingTop + (fretRow - 0.5) * fretSpacing;

        return (
          <g key={`dot-${stringIdx}`}>
            <circle cx={x} cy={y} r={dotRadius} fill="#D0021B" />
            <text
              x={x}
              y={y + labelFontSize * 0.35}
              textAnchor="middle"
              fill="white"
              fontSize={labelFontSize - 1}
              fontWeight="bold"
            >
              {fret}
            </text>
          </g>
        );
      })}
    </svg>
  );
}