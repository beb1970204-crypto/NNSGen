// Chord to Nashville Number System conversion utilities

const NOTE_TO_NUMBER = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

// Parse chord into root, quality, and extensions
function parseChord(chord) {
  if (!chord || chord === '-') return null;
  
  const match = chord.match(/^([A-G][b#]?)(m|min|maj|M|dim|aug)?(.*)$/);
  if (!match) return null;
  
  const [, root, quality = '', extensions = ''] = match;
  return { root, quality, extensions };
}

// Get scale degree from root note relative to key
function getScaleDegree(root, key) {
  const rootNum = NOTE_TO_NUMBER[root];
  const keyNum = NOTE_TO_NUMBER[key];
  if (rootNum === undefined || keyNum === undefined) return null;
  
  const degree = (rootNum - keyNum + 12) % 12;
  const scaleMap = [0, 2, 4, 5, 7, 9, 11]; // Major scale intervals
  const degreeIndex = scaleMap.indexOf(degree);
  
  if (degreeIndex !== -1) {
    return degreeIndex + 1;
  }
  
  // Handle chromatic notes (not in major scale)
  const chromaticMap = { 1: '♭2', 3: '♭3', 6: '♭5', 8: '♭6', 10: '♭7' };
  return chromaticMap[degree] || '?';
}

// Convert chord to NNS notation
export function chordToNNS(chord, key) {
  if (!chord || chord === '-') return '-';
  
  const parsed = parseChord(chord);
  if (!parsed) return chord;
  
  const { root, quality, extensions } = parsed;
  const degree = getScaleDegree(root, key);
  
  if (!degree) return chord;
  
  // Add quality suffix
  let nnsNotation = degree.toString();
  if (quality.toLowerCase().includes('m')) {
    nnsNotation += '-';
  } else if (quality.toLowerCase().includes('maj') || quality === 'M') {
    nnsNotation += 'Δ';
  } else if (quality.toLowerCase().includes('dim')) {
    nnsNotation += '°';
  } else if (quality.toLowerCase().includes('aug')) {
    nnsNotation += '+';
  }
  
  // Add extensions
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