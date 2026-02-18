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

  const result = getScaleDegreeInterval(chord, chartKey);
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

// ─── Measure Input Parser ─────────────────────────────────────────────────────

export function parseMeasureInput(input, timeSignature = '4/4') {
  const beats = parseInt(timeSignature.split('/')[0]);
  const measuresText = input.split('|').map(m => m.trim()).filter(m => m);

  return measuresText.map(measureText => {
    const chordStrings = measureText.split(/\s+/).filter(c => c);
    const chordsPerMeasure = chordStrings.length || 1;
    const beatsPerChord = beats / chordsPerMeasure;

    return {
      chords: chordStrings.length > 0
        ? chordStrings.map(chord => ({
            chord,
            beats: beatsPerChord,
            symbols: []
          }))
        : [{ chord: '-', beats, symbols: [] }]
    };
  });
}