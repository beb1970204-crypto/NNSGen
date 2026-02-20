import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

// The chord database - same as getGuitarChordDiagram
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

const AVAILABLE_CHORDS = Object.keys(GUITAR_CHORDS);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { chartData, chord, instrument = 'guitar', context = 'general' } = await req.json();
    if (!chartData || !chord) {
      return Response.json({ error: 'Chart data and chord required' }, { status: 400 });
    }

    // Find all shapes in the database that match the exact chord
    const exactMatches = AVAILABLE_CHORDS.filter(c => c === chord);
    // Also find enharmonic equivalents (e.g. C# = Db)
    const enharmonicMap = { 'C#': 'Db', 'Db': 'C#', 'D#': 'Eb', 'Eb': 'D#', 'F#': 'Gb', 'Gb': 'F#', 'G#': 'Ab', 'Ab': 'G#', 'A#': 'Bb', 'Bb': 'A#' };
    const chordRoot = chord.match(/^[A-G][#b]?/)?.[0] || '';
    const chordSuffix = chord.slice(chordRoot.length);
    const enharmonicRoot = enharmonicMap[chordRoot] || '';
    const enharmonicChord = enharmonicRoot ? enharmonicRoot + chordSuffix : '';
    const enharmonicMatches = enharmonicChord ? AVAILABLE_CHORDS.filter(c => c === enharmonicChord) : [];

    const candidateChords = [...new Set([...exactMatches, ...enharmonicMatches])];

    const prompt = `You are an expert guitar voicing coach.

The guitarist needs to play the chord: "${chord}"
Key of the song: ${chartData.key}
Section context: ${context}

AVAILABLE SHAPES FOR THIS CHORD IN DATABASE:
${candidateChords.length > 0 ? candidateChords.join(', ') : 'None found - use closest match from: ' + AVAILABLE_CHORDS.join(', ')}

Your job is to rank these exact chord shapes from MOST to LEAST recommended for playing "${chord}" in the key of ${chartData.key}.
Do NOT suggest different chords or substitutions. Only rank the shapes listed above.
Each entry must use a "chordName" that is EXACTLY one of the shapes listed above.

For each shape:
- "chordName": EXACT name from the list above
- "name": a descriptive shape label (e.g. "Open Position", "Barre Shape", "Jazz Voicing")
- "description": why this shape is recommended for this key/context
- "technique": brief fingering or playing tip
- "context": best musical situation for this shape

Return ONLY valid JSON with shapes ordered best-first:
{
  "voicings": [
    {
      "chordName": "${candidateChords[0] || chord}",
      "name": "Open Position",
      "description": "Most natural shape in this key",
      "technique": "Let open strings ring",
      "context": "Best for strumming and open feels"
    }
  ]
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          voicings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                chordName: { type: "string" },
                name: { type: "string" },
                description: { type: "string" },
                technique: { type: "string" },
                context: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Enrich each voicing with actual fret data from the database
    const voicings = (response.voicings || []).map(v => {
      const frets = GUITAR_CHORDS[v.chordName] || null;
      return {
        ...v,
        chord: v.chordName,
        frets,
        found: !!frets
      };
    }).filter(v => v.found);

    return Response.json({ success: true, voicings });

  } catch (error) {
    console.error('voicingTips error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});