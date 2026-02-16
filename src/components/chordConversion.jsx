// Chord to Nashville Number System conversion utilities using TonalJS
import { Chord, Key, Distance, Note } from "tonal";

// Convert chord to NNS notation using TonalJS
export function chordToNNS(chord, chartKey) {
  if (!chord || chord === '-') return '-';
  
  // Parse the chord using TonalJS
  const chordData = Chord.get(chord);
  if (!chordData || chordData.empty) return chord;
  
  // Get the key data using TonalJS
  const keyData = Key.majorKey(chartKey);
  if (!keyData || keyData.tonic === '') {
    // Try as minor key
    const minorKeyData = Key.minorKey(chartKey);
    if (!minorKeyData || minorKeyData.tonic === '') return chord;
  }
  
  // Calculate the interval from the key tonic to the chord root
  const interval = Distance.interval(chartKey.replace('m', ''), chordData.tonic);
  
  // Map intervals to scale degrees
  const intervalToDegree = {
    '1P': '1', 'P1': '1',
    '2M': '2', 'M2': '2', '2m': '♭2', 'm2': '♭2',
    '3M': '3', 'M3': '3', '3m': '♭3', 'm3': '♭3',
    '4P': '4', 'P4': '4', '4A': '♯4', 'A4': '♯4',
    '5P': '5', 'P5': '5', '5d': '♭5', 'd5': '♭5',
    '6M': '6', 'M6': '6', '6m': '♭6', 'm6': '♭6',
    '7M': '7', 'M7': '7', '7m': '♭7', 'm7': '♭7'
  };
  
  let degree = intervalToDegree[interval] || '?';
  
  // Add quality suffix
  let nnsNotation = degree;
  const quality = chordData.quality.toLowerCase();
  
  if (quality.includes('minor') || quality === 'm') {
    nnsNotation += '-';
  } else if (quality.includes('major') && chordData.quality !== 'Major') {
    nnsNotation += 'Δ';
  } else if (quality.includes('dim')) {
    nnsNotation += '°';
  } else if (quality.includes('aug')) {
    nnsNotation += '+';
  }
  
  // Add extensions (7, 9, sus, etc.)
  const extensions = chordData.aliases[0]?.replace(chordData.tonic, '').replace(chordData.quality, '') || '';
  nnsNotation += extensions;
  
  return nnsNotation;
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