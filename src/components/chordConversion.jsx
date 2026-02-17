// Chord conversion utilities using TonalJS
import { Chord, distance } from "tonal";

// Convert chord to Roman numeral notation
export function chordToRoman(chord, chartKey) {
  if (!chord || chord === '-') return '-';

  const chordData = Chord.get(chord);
  if (!chordData || chordData.empty) return chord;

  const tonic = chartKey.replace(/m$/, '');
  const interval = distance(tonic, chordData.tonic);

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

  // Extract suffix (type) from original chord string
  const root = chordData.tonic;
  let suffix = chord.slice(root.length); // e.g. "m7", "maj7", "7", "sus4"

  // Handle slash/bass chords
  let bass = '';
  if (suffix.includes('/')) {
    const parts = suffix.split('/');
    suffix = parts[0];
    bass = '/' + parts[1];
  }

  // Minor → lowercase Roman numeral, strip leading 'm'
  if (suffix.startsWith('m') && !suffix.startsWith('maj')) {
    roman = roman.toLowerCase();
    suffix = suffix.slice(1);
  }

  // Dim / Aug quality adjustments
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

// Parse measure input text (e.g., "C | Dm G7 | F C")
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