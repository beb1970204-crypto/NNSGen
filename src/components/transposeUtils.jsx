// Transposition utilities for chord charts

const NOTE_TO_NUMBER = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

const NUMBER_TO_SHARP_NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NUMBER_TO_FLAT_NOTE = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Parse chord into components
function parseChord(chord) {
  if (!chord || chord === '-') return null;
  
  const match = chord.match(/^([A-G][b#]?)(m|min|maj|M|dim|aug)?(.*)$/);
  if (!match) return null;
  
  const [, root, quality = '', extensions = ''] = match;
  return { root, quality, extensions };
}

// Transpose a single chord
export function transposeChord(chord, fromKey, toKey) {
  if (!chord || chord === '-') return chord;
  
  const parsed = parseChord(chord);
  if (!parsed) return chord;
  
  const { root, quality, extensions } = parsed;
  
  const fromKeyNum = NOTE_TO_NUMBER[fromKey];
  const toKeyNum = NOTE_TO_NUMBER[toKey];
  
  if (fromKeyNum === undefined || toKeyNum === undefined) return chord;
  
  const rootNum = NOTE_TO_NUMBER[root];
  if (rootNum === undefined) return chord;
  
  const interval = (toKeyNum - fromKeyNum + 12) % 12;
  const newRootNum = (rootNum + interval) % 12;
  
  // Use flats if target key uses flats, sharps otherwise
  const useFlats = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Fm', 'Bbm', 'Ebm', 'Abm', 'Dbm', 'Gbm'].includes(toKey);
  const noteMap = useFlats ? NUMBER_TO_FLAT_NOTE : NUMBER_TO_SHARP_NOTE;
  
  const newRoot = noteMap[newRootNum];
  return newRoot + quality + extensions;
}

// Transpose all chords in a section's measures
export function transposeSectionMeasures(measures, fromKey, toKey) {
  if (!measures) return measures;
  
  return measures.map(measure => ({
    ...measure,
    chords: measure.chords?.map(chordObj => ({
      ...chordObj,
      chord: transposeChord(chordObj.chord, fromKey, toKey)
    }))
  }));
}