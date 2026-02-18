// Chord conversion utilities using TonalJS
// The database ALWAYS stores standard chord names (e.g. "C", "Am7", "F/G").
// These utilities convert for display only — they never mutate stored data.

import { Chord, distance, Note } from "tonal";

// ─── Roman Numeral Conversion ─────────────────────────────────────────────────

export function chordToRoman(chord, chartKey) {
  if (!chord || chord === '-') return '-';

  const chordData = Chord.get(chord);
  if (!chordData || chordData.empty) return chord;

  // Use only the letter root of the chart key (strip minor suffix for distance calc)
  const keyRoot = chartKey.replace(/m$/, '');
  const tonic = Note.get(chordData.tonic).pc || chordData.tonic;
  const interval = distance(keyRoot, tonic);

  const intervalToRoman = {
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

  let roman = intervalToRoman[interval] || '?';

  const root = chordData.tonic;
  let suffix = chord.slice(root.length);

  let bass = '';
  if (suffix.includes('/')) {
    const parts = suffix.split('/');
    suffix = parts[0];
    bass = '/' + parts[1];
  }

  if (suffix.startsWith('m') && !suffix.startsWith('maj')) {
    roman = roman.toLowerCase();
    suffix = suffix.slice(1);
  }

  const quality = chordData.quality.toLowerCase();
  if (quality.includes('dim')) {
    roman = roman.toLowerCase() + '°';
    suffix = suffix.replace(/^dim/, '');
  } else if (quality.includes('aug')) {
    roman += '+';
    suffix = suffix.replace(/^aug/, '');
  }

  return roman + suffix + bass;
}

// ─── Nashville Number System Conversion ──────────────────────────────────────
// NNS uses scale degree numbers (1–7) instead of letter names.
// Minor chords are shown with a dash: 1, 2-, 3-, 4, 5, 6-, 7°
// The key center is always "1" regardless of major/minor.

const NNS_DEGREE_MAP = {
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

  const chordData = Chord.get(chord);
  if (!chordData || chordData.empty) return chord;

  const keyRoot = chartKey.replace(/m$/, '');
  const tonic = Note.get(chordData.tonic).pc || chordData.tonic;
  const interval = distance(keyRoot, tonic);

  const degree = NNS_DEGREE_MAP[interval] || '?';

  const root = chordData.tonic;
  let suffix = chord.slice(root.length);

  let bass = '';
  if (suffix.includes('/')) {
    const parts = suffix.split('/');
    suffix = parts[0];
    bass = '/' + parts[1];
  }

  // Minor → append '-'
  let minorDash = '';
  if (suffix.startsWith('m') && !suffix.startsWith('maj')) {
    minorDash = '-';
    suffix = suffix.slice(1);
  }

  const quality = chordData.quality.toLowerCase();
  let qualityMark = '';
  if (quality.includes('dim')) {
    qualityMark = '°';
    suffix = suffix.replace(/^dim/, '');
  } else if (quality.includes('aug')) {
    qualityMark = '+';
    suffix = suffix.replace(/^aug/, '');
  }

  return degree + minorDash + qualityMark + suffix + bass;
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