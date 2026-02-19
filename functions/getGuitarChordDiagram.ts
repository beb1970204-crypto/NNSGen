import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Guitar chord voicings - maps chord name to fret positions [string 1-6]
const GUITAR_CHORDS = {
  'C': [0, 3, 2, 0, 1, 0], 'C7': [null, 3, 2, 3, 1, 0], 'Cmaj7': [null, 3, 2, 0, 0, 0], 'Cm7': [null, 3, 5, 3, 4, 3], 'Cdim': [null, 3, 4, 2, 4, 2],
  'C#': [null, 4, 6, 6, 6, 4], 'C#m': [null, 4, 6, 6, 5, 4], 'C#7': [null, 4, 6, 4, 6, 4], 'C#maj7': [null, 4, 6, 5, 6, 4], 'C#m7': [null, 4, 6, 4, 5, 4], 'Db': [null, 4, 6, 6, 6, 4], 'Dbm': [null, 4, 6, 6, 5, 4],
  'D': [null, null, 0, 2, 3, 2], 'D7': [null, null, 0, 2, 1, 2], 'Dmaj7': [null, null, 0, 2, 2, 2], 'Dm7': [null, null, 0, 2, 1, 1], 'Ddim': [null, null, 0, 1, 3, 1],
  'D#': [null, null, 1, 3, 4, 3], 'D#m': [null, null, 1, 3, 4, 2], 'D#7': [null, null, 1, 3, 2, 3], 'D#maj7': [null, null, 1, 3, 3, 3], 'D#m7': [null, null, 1, 3, 2, 2], 'Eb': [null, null, 1, 3, 4, 3], 'Ebm': [null, null, 1, 3, 4, 2],
  'E': [0, 2, 2, 1, 0, 0], 'E7': [0, 2, 0, 1, 0, 0], 'Emaj7': [0, 2, 1, 1, 0, 0], 'Em7': [0, 2, 0, 0, 0, 0], 'Edim': [0, 1, 2, 0, 2, 0],
  'F': [1, 3, 3, 2, 1, 1], 'F7': [1, 3, 1, 2, 1, 1], 'Fmaj7': [1, 3, 3, 2, 1, null], 'Fm7': [1, 3, 1, 1, 1, 1], 'Fdim': [null, null, 2, 3, 2, null],
  'F#': [2, 4, 4, 3, 2, 2], 'F#m': [2, 4, 4, 2, 2, 2], 'F#7': [2, 4, 2, 3, 2, 2], 'F#maj7': [2, 4, 3, 3, 2, null], 'F#m7': [2, 4, 2, 2, 2, 2], 'Gb': [2, 4, 4, 3, 2, 2], 'Gbm': [2, 4, 4, 2, 2, 2],
  'G': [3, 2, 0, 0, 0, 3], 'G7': [3, 2, 0, 0, 0, 1], 'Gmaj7': [3, 2, 0, 0, 0, 2], 'Gm7': [3, 5, 3, 3, 3, 3], 'Gdim': [null, null, 2, 3, 2, 3],
  'G#': [4, 3, 1, 1, 4, 4], 'G#m': [4, 6, 6, 4, 4, 4], 'G#7': [4, 6, 4, 5, 4, 4], 'G#maj7': [4, 6, 5, 5, 4, null], 'G#m7': [4, 6, 4, 4, 4, 4], 'Ab': [4, 3, 1, 1, 4, 4], 'Abm': [4, 6, 6, 4, 4, 4],
  'A': [null, 0, 2, 2, 2, 0], 'A7': [null, 0, 2, 0, 2, 0], 'Amaj7': [null, 0, 2, 1, 2, 0], 'Am7': [null, 0, 2, 0, 1, 0], 'Adim': [null, 0, 1, 2, 1, 2],
  'A#': [null, 1, 3, 3, 3, 1], 'A#m': [null, 1, 3, 3, 2, 1], 'A#7': [null, 1, 3, 1, 3, 1], 'A#maj7': [null, 1, 3, 2, 3, 1], 'A#m7': [null, 1, 3, 1, 2, 1], 'Bb': [null, 1, 3, 3, 3, 1], 'Bbm': [null, 1, 3, 3, 2, 1],
  'B': [null, 2, 4, 4, 4, 2], 'B7': [null, 2, 1, 2, 0, 2], 'Bmaj7': [null, 2, 4, 3, 4, 2], 'Bm7': [null, 2, 4, 2, 3, 2], 'Bdim': [null, 2, 3, 4, 3, 4],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chord, frets: directFrets } = await req.json();

    let voicing;

    if (directFrets) {
      // If direct fret data is provided, use it
      if (!Array.isArray(directFrets) || directFrets.length !== 6) {
        return Response.json({ 
          error: 'Invalid frets array - must be exactly 6 elements',
          frets: [null, null, null, null, null, null],
          found: false
        }, { status: 400 });
      }
      voicing = directFrets;
    } else if (chord) {
      // Try exact match first
      voicing = GUITAR_CHORDS[chord];

      // If no exact match, try to simplify the chord name (remove extensions, match base chord)
      if (!voicing) {
        const baseChordMatch = chord.match(/^[A-G]#?b?m?/);
        const baseChord = baseChordMatch ? baseChordMatch[0] : chord;
        voicing = GUITAR_CHORDS[baseChord];
      }

      // If still no match, return error
      if (!voicing) {
        return Response.json({ 
          error: `Chord "${chord}" not found in database`,
          frets: [null, null, null, null, null, null],
          found: false
        }, { status: 200 });
      }
    } else {
      return Response.json({ error: 'Chord name or frets required' }, { status: 400 });
    }

    return Response.json({ 
      chord,
      frets: voicing,
      found: true
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});