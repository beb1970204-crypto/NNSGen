// Transposition utilities for chord charts using TonalJS
import { Chord, Distance, transpose } from "tonal";

// Transpose a single chord using TonalJS
export function transposeChord(chord, fromKey, toKey) {
  if (!chord || chord === '-') return chord;
  
  // Calculate the interval between keys using TonalJS
  const interval = Distance.interval(fromKey, toKey);
  
  if (!interval) return chord;
  
  // Transpose the chord using TonalJS
  const transposed = transpose(chord, interval);
  
  return transposed || chord;
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