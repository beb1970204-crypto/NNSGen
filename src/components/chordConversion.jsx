// Chord conversion utilities using TonalJS
// The database ALWAYS stores standard chord names (e.g. "C", "Am7", "F/G").
// These utilities convert for display only — they never mutate stored data.

import { Chord, distance, Note, Progression } from "tonal";

// ─── Shared: get scale degree interval from a chord's tonic to the chart key ──

function getScaleDegreeInterval(chord, chartKey) {
  const chordData = Chord.get(chord);
  if (!chordData || chordData.empty) return null;

  // Strip minor suffix from key for distance calculation (e.g. "Am" → "A")
  const keyRoot = chartKey.replace(/m$/, '');
  // Use .pc to ensure we're working with a pitch class, not an octave-specific note
  const tonic = Note.get(chordData.tonic).pc || chordData.tonic;
  const interval = distance(keyRoot, tonic);

  return { chordData, interval };
}

// ─── Shared: extract bass note from a slash chord ────────────────────────────

function extractBass(chord, root) {
  const afterRoot = chord.slice(root.length);
  const slashIdx = afterRoot.indexOf('/');
  if (slashIdx === -1) return { suffix: afterRoot, bass: '' };
  return {
    suffix: afterRoot.slice(0, slashIdx),
    bass: '/' + afterRoot.slice(slashIdx + 1)
  };
}

// ─── Roman Numeral Conversion ─────────────────────────────────────────────────

const INTERVAL_TO_ROMAN = {
  '1P': 'I',   'P1': 'I',
  '2m': '♭II', 'm2': '♭II',
  '2M': 'II',  'M2': 'II',
  '3m': '♭III','m3': '♭III',
  '3M': 'III', 'M3': 'III',
  '4P': 'IV',  'P4': 'IV',
  '4A': '♯IV', 'A4': '♯IV',
  '5d': '♭V',  'd5': '♭V',
  '5P': 'V',   'P5': 'V',
  '6m': '♭VI', 'm6': '♭VI',
  '6M': 'VI',  'M6': 'VI',
  '7m': '♭VII','m7': '♭VII',
  '7M': 'VII', 'M7': 'VII'
};

export function chordToRoman(chord, chartKey) {
  if (!chord || chord === '-') return '-';

  const result = getScaleDegreeInterval(chord, chartKey);
  if (!result) return chord;

  const { chordData, interval } = result;
  if (!interval) return chord;

  let roman = INTERVAL_TO_ROMAN[interval] || '?';
  const { suffix, bass } = extractBass(chord, chordData.tonic);

  let qualitySuffix = suffix;

  // Minor chord → lowercase roman
  if (qualitySuffix.startsWith('m') && !qualitySuffix.startsWith('maj')) {
    roman = roman.toLowerCase();
    qualitySuffix = qualitySuffix.slice(1);
  }

  const quality = chordData.quality.toLowerCase();
  if (quality.includes('dim')) {
    roman = roman.toLowerCase() + '°';
    qualitySuffix = qualitySuffix.replace(/^dim/, '');
  } else if (quality.includes('aug')) {
    roman += '+';
    qualitySuffix = qualitySuffix.replace(/^aug/, '');
  }

  return roman + qualitySuffix + bass;
}

// ─── Nashville Number System Conversion ──────────────────────────────────────
// NNS uses scale degree numbers (1–7) instead of letter names.
// Minor chords are shown with a dash: 1, 2-, 3-, 4, 5, 6-, 7°
// The key center is always "1" regardless of major/minor.

const INTERVAL_TO_NNS = {
  '1P': '1',  'P1': '1',
  '2m': '♭2', 'm2': '♭2',
  '2M': '2',  'M2': '2',
  '3m': '♭3', 'm3': '♭3',
  '3M': '3',  'M3': '3',
  '4P': '4',  'P4': '4',
  '4A': '♯4', 'A4': '♯4',
  '5d': '♭5', 'd5': '♭5',
  '5P': '5',  'P5': '5',
  '6m': '♭6', 'm6': '♭6',
  '6M': '6',  'M6': '6',
  '7m': '♭7', 'm7': '♭7',
  '7M': '7',  'M7': '7'
};

export function chordToNNS(chord, chartKey) {
  if (!chord || chord === '-') return '-';

  // NNS always uses the relative major scale
  // If the key is minor (e.g. "Am"), convert to its relative major (e.g. "C")
  const isMinorKey = chartKey.endsWith('m');
  let nnsKey = chartKey;
  if (isMinorKey) {
    // Get the interval from the minor root to its relative major (up 3 semitones)
    const minorRoot = chartKey.slice(0, -1);
    const majorIntervals = {
      'A': 'C', 'B': 'D', 'C': 'Eb', 'D': 'F', 'E': 'G', 'F': 'Ab', 'G': 'Bb',
      'A#': 'C#', 'Bb': 'Db', 'B#': 'D#', 'C#': 'E', 'D#': 'F#', 'E#': 'G#', 'F#': 'A',
      'Db': 'Fb', 'Eb': 'Gb', 'Fb': 'Abb', 'Gb': 'Bbb', 'Ab': 'Cb'
    };
    nnsKey = majorIntervals[minorRoot] || chartKey;
  }

  const result = getScaleDegreeInterval(chord, nnsKey);
  if (!result) return chord;

  const { chordData, interval } = result;
  if (!interval) return chord;

  const degree = INTERVAL_TO_NNS[interval] || '?';
  const { suffix, bass } = extractBass(chord, chordData.tonic);

  let qualitySuffix = suffix;
  let minorDash = '';

  if (qualitySuffix.startsWith('m') && !qualitySuffix.startsWith('maj')) {
    minorDash = '-';
    qualitySuffix = qualitySuffix.slice(1);
  }

  const quality = chordData.quality.toLowerCase();
  let qualityMark = '';
  if (quality.includes('dim')) {
    qualityMark = '°';
    qualitySuffix = qualitySuffix.replace(/^dim/, '');
  } else if (quality.includes('aug')) {
    qualityMark = '+';
    qualitySuffix = qualitySuffix.replace(/^aug/, '');
  }

  return degree + minorDash + qualityMark + qualitySuffix + bass;
}

// ─── Superscript Notation Splitter ───────────────────────────────────────────
// Used by Roman and NNS display modes to apply △, ⁷, and ⁻⁷ superscript notation.
// Returns { base: string, sup: string | null }

export function splitChordSuffix(str) {
  // Separate bass note (e.g. /V or /5) before processing
  const slashIdx = str.indexOf('/');
  const basePart = slashIdx !== -1 ? str.slice(0, slashIdx) : str;
  const bassSuffix = slashIdx !== -1 ? str.slice(slashIdx) : '';

  // Major 7th → △ superscript (e.g. Imaj7 → I△, 1maj7 → 1△)
  if (basePart.endsWith('maj7')) {
    return { base: basePart.slice(0, -4) + bassSuffix, sup: '△' };
  }

  // NNS minor 7th: -7 suffix (e.g. 6-7 → 6 + sup:-7)
  if (basePart.endsWith('-7')) {
    return { base: basePart.slice(0, -2) + bassSuffix, sup: '-7' };
  }

  // Any remaining 7 suffix
  if (basePart.endsWith('7')) {
    const beforeSeven = basePart.slice(0, -1);
    const lastChar = beforeSeven[beforeSeven.length - 1];
    // No superscript if 7 is the entire chord (e.g. bare "7") or immediately
    // preceded by ♭ or ♯ (e.g. ♭7 — the flat seven scale degree in NNS)
    if (!beforeSeven || lastChar === '♭' || lastChar === '♯') {
      return { base: str, sup: null };
    }
    // Roman numeral minor 7th: lowercase letter before 7 (e.g. vi7 → vi + sup:-7)
    if (/[a-z]/.test(lastChar)) {
      return { base: beforeSeven + bassSuffix, sup: '-7' };
    }
    // Dominant 7th or NNS number 7 (e.g. VI7 → VI + sup:7, or 57 → 5 + sup:7)
    return { base: beforeSeven + bassSuffix, sup: '7' };
  }

  return { base: str, sup: null };
}

// ─── Measure Input Parser ─────────────────────────────────────────────────────
// Supports two input formats:
//   1. Beat-duration format: "Bm - 16 beats Em7 - 8 beats" 
//      → expands into individual measures based on beatsPerMeasure
//   2. Pipe-separated format: "C | Am | F | G"
//      → each segment becomes one measure, chords split evenly

export function parseMeasureInput(input, timeSignature = '4/4') {
  const beatsPerMeasure = parseInt(timeSignature.split('/')[0]) || 4;

  // Detect beat-duration format: contains "- N beats" pattern
  const beatDurationPattern = /\b([A-G][b#]?[^\s-]*)\s*-\s*(\d+)\s*beats?\b/gi;
  const hasBeatDurations = beatDurationPattern.test(input);

  if (hasBeatDurations) {
    const measures = [];
    // Reset regex after .test() consumed it
    const regex = /\b([A-G][b#]?[^\s-]*)\s*-\s*(\d+)\s*beats?\b/gi;
    let match;

    while ((match = regex.exec(input)) !== null) {
      const chordName = match[1].trim();
      let beatsRemaining = parseInt(match[2], 10);

      // Expand into as many full measures as needed
      while (beatsRemaining > 0) {
        const beatsThisMeasure = Math.min(beatsRemaining, beatsPerMeasure);
        measures.push({
          chords: [{ chord: chordName, beats: beatsThisMeasure, symbols: [] }],
          cue: ''
        });
        beatsRemaining -= beatsThisMeasure;
      }
    }

    return measures.length > 0
      ? measures
      : [{ chords: [{ chord: '-', beats: beatsPerMeasure, symbols: [] }], cue: '' }];
  }

  // Pipe-separated format: "C Am | F G" → each pipe segment = one measure
  const measuresText = input.split('|').map(m => m.trim()).filter(m => m);

  return measuresText.map(measureText => {
    const chordStrings = measureText.split(/\s+/).filter(c => c);
    const chordsPerMeasure = chordStrings.length || 1;
    const beatsPerChord = beatsPerMeasure / chordsPerMeasure;

    return {
      chords: chordStrings.length > 0
        ? chordStrings.map(chord => ({ chord, beats: beatsPerChord, symbols: [] }))
        : [{ chord: '-', beats: beatsPerMeasure, symbols: [] }],
      cue: ''
    };
  });
}