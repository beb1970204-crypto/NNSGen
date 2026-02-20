import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

// Multi-voicing chord database: each chord has multiple positions across the fretboard.
// Format: [E, A, D, G, B, e] — null = muted
const CHORD_VOICINGS = {
  'C':    [{ frets: [null, 3, 2, 0, 1, 0], name: 'Open Position', position: 'Open' }, { frets: [8, 10, 10, 9, 8, 8], name: 'Barre (8th fret)', position: 'Barre' }, { frets: [null, null, 10, 9, 8, 8], name: 'High Position', position: 'High' }],
  'Cm':   [{ frets: [null, 3, 5, 5, 4, 3], name: 'Barre (3rd fret)', position: 'Barre' }, { frets: [8, 10, 10, 8, 8, 8], name: 'Barre (8th fret)', position: 'Barre' }],
  'C7':   [{ frets: [null, 3, 2, 3, 1, 0], name: 'Open Position', position: 'Open' }, { frets: [8, 10, 8, 9, 8, 8], name: 'Barre (8th fret)', position: 'Barre' }],
  'Cmaj7':[{ frets: [null, 3, 2, 0, 0, 0], name: 'Open Position', position: 'Open' }, { frets: [null, 3, 2, 0, 0, null], name: 'Shell Voicing', position: 'Open' }],
  'Cm7':  [{ frets: [null, 3, 5, 3, 4, 3], name: 'Barre (3rd fret)', position: 'Barre' }, { frets: [8, 10, 8, 8, 8, 8], name: 'Barre (8th fret)', position: 'Barre' }],
  'Cdim': [{ frets: [null, 3, 4, 2, 4, 2], name: 'Open Position', position: 'Open' }],

  'C#':   [{ frets: [null, 4, 6, 6, 6, 4], name: 'Barre (4th fret)', position: 'Barre' }, { frets: [9, 11, 11, 10, 9, 9], name: 'Barre (9th fret)', position: 'Barre' }],
  'C#m':  [{ frets: [null, 4, 6, 6, 5, 4], name: 'Barre (4th fret)', position: 'Barre' }, { frets: [9, 11, 11, 9, 9, 9], name: 'Barre (9th fret)', position: 'Barre' }],
  'C#7':  [{ frets: [null, 4, 6, 4, 6, 4], name: 'Barre (4th fret)', position: 'Barre' }],
  'C#maj7':[{ frets: [null, 4, 6, 5, 6, 4], name: 'Barre (4th fret)', position: 'Barre' }],
  'C#m7': [{ frets: [null, 4, 6, 4, 5, 4], name: 'Barre (4th fret)', position: 'Barre' }],
  'Db':   [{ frets: [null, 4, 6, 6, 6, 4], name: 'Barre (4th fret)', position: 'Barre' }],
  'Dbm':  [{ frets: [null, 4, 6, 6, 5, 4], name: 'Barre (4th fret)', position: 'Barre' }],

  'D':    [{ frets: [null, null, 0, 2, 3, 2], name: 'Open Position', position: 'Open' }, { frets: [null, 5, 7, 7, 7, 5], name: 'Barre (5th fret)', position: 'Barre' }, { frets: [10, 12, 12, 11, 10, 10], name: 'Barre (10th fret)', position: 'Barre' }],
  'Dm':   [{ frets: [null, null, 0, 2, 3, 1], name: 'Open Position', position: 'Open' }, { frets: [null, 5, 7, 7, 6, 5], name: 'Barre (5th fret)', position: 'Barre' }, { frets: [10, 12, 12, 10, 10, 10], name: 'Barre (10th fret)', position: 'Barre' }],
  'D7':   [{ frets: [null, null, 0, 2, 1, 2], name: 'Open Position', position: 'Open' }, { frets: [null, 5, 7, 5, 7, 5], name: 'Barre (5th fret)', position: 'Barre' }],
  'Dmaj7':[{ frets: [null, null, 0, 2, 2, 2], name: 'Open Position', position: 'Open' }],
  'Dm7':  [{ frets: [null, null, 0, 2, 1, 1], name: 'Open Position', position: 'Open' }, { frets: [null, 5, 7, 5, 6, 5], name: 'Barre (5th fret)', position: 'Barre' }],
  'Ddim': [{ frets: [null, null, 0, 1, 3, 1], name: 'Open Position', position: 'Open' }],
  'D#':   [{ frets: [null, null, 1, 3, 4, 3], name: 'Open Shape', position: 'Open' }, { frets: [null, 6, 8, 8, 8, 6], name: 'Barre (6th fret)', position: 'Barre' }],
  'D#m':  [{ frets: [null, null, 1, 3, 4, 2], name: 'Open Shape', position: 'Open' }, { frets: [null, 6, 8, 8, 7, 6], name: 'Barre (6th fret)', position: 'Barre' }],
  'Eb':   [{ frets: [null, null, 1, 3, 4, 3], name: 'Open Shape', position: 'Open' }, { frets: [null, 6, 8, 8, 8, 6], name: 'Barre (6th fret)', position: 'Barre' }],
  'Ebm':  [{ frets: [null, null, 1, 3, 4, 2], name: 'Open Shape', position: 'Open' }, { frets: [null, 6, 8, 8, 7, 6], name: 'Barre (6th fret)', position: 'Barre' }],

  'E':    [{ frets: [0, 2, 2, 1, 0, 0], name: 'Open Position', position: 'Open' }, { frets: [null, 7, 9, 9, 9, 7], name: 'Barre (7th fret)', position: 'Barre' }, { frets: [0, 2, 2, 4, 5, 4], name: 'Extended Open', position: 'Open' }],
  'Em':   [{ frets: [0, 2, 2, 0, 0, 0], name: 'Open Position', position: 'Open' }, { frets: [null, 7, 9, 9, 8, 7], name: 'Barre (7th fret)', position: 'Barre' }, { frets: [0, 2, 2, 0, 0, 3], name: 'Em add9', position: 'Open' }],
  'E7':   [{ frets: [0, 2, 0, 1, 0, 0], name: 'Open Position', position: 'Open' }, { frets: [null, 7, 9, 7, 9, 7], name: 'Barre (7th fret)', position: 'Barre' }],
  'Emaj7':[{ frets: [0, 2, 1, 1, 0, 0], name: 'Open Position', position: 'Open' }],
  'Em7':  [{ frets: [0, 2, 0, 0, 0, 0], name: 'Open Position', position: 'Open' }, { frets: [null, 7, 9, 7, 8, 7], name: 'Barre (7th fret)', position: 'Barre' }],

  'F':    [{ frets: [1, 3, 3, 2, 1, 1], name: 'Barre (1st fret)', position: 'Barre' }, { frets: [null, null, 3, 2, 1, 1], name: 'Partial Barre', position: 'Partial' }, { frets: [null, 8, 10, 10, 10, 8], name: 'Barre (8th fret)', position: 'Barre' }],
  'Fm':   [{ frets: [1, 3, 3, 1, 1, 1], name: 'Barre (1st fret)', position: 'Barre' }, { frets: [null, 8, 10, 10, 9, 8], name: 'Barre (8th fret)', position: 'Barre' }],
  'F7':   [{ frets: [1, 3, 1, 2, 1, 1], name: 'Barre (1st fret)', position: 'Barre' }],
  'Fmaj7':[{ frets: [1, 3, 3, 2, 1, null], name: 'Barre (1st fret)', position: 'Barre' }, { frets: [null, null, 3, 2, 1, 0], name: 'Open Shape', position: 'Open' }],
  'Fm7':  [{ frets: [1, 3, 1, 1, 1, 1], name: 'Barre (1st fret)', position: 'Barre' }],
  'Fdim': [{ frets: [null, null, 2, 3, 2, null], name: 'Mid Position', position: 'Mid' }],

  'F#':   [{ frets: [2, 4, 4, 3, 2, 2], name: 'Barre (2nd fret)', position: 'Barre' }, { frets: [null, 9, 11, 11, 11, 9], name: 'Barre (9th fret)', position: 'Barre' }],
  'F#m':  [{ frets: [2, 4, 4, 2, 2, 2], name: 'Barre (2nd fret)', position: 'Barre' }, { frets: [null, 9, 11, 11, 10, 9], name: 'Barre (9th fret)', position: 'Barre' }],
  'F#7':  [{ frets: [2, 4, 2, 3, 2, 2], name: 'Barre (2nd fret)', position: 'Barre' }],
  'F#maj7':[{ frets: [2, 4, 3, 3, 2, null], name: 'Barre (2nd fret)', position: 'Barre' }],
  'F#m7': [{ frets: [2, 4, 2, 2, 2, 2], name: 'Barre (2nd fret)', position: 'Barre' }],
  'Gb':   [{ frets: [2, 4, 4, 3, 2, 2], name: 'Barre (2nd fret)', position: 'Barre' }],
  'Gbm':  [{ frets: [2, 4, 4, 2, 2, 2], name: 'Barre (2nd fret)', position: 'Barre' }],

  'G':    [{ frets: [3, 2, 0, 0, 0, 3], name: 'Open Position', position: 'Open' }, { frets: [3, 5, 5, 4, 3, 3], name: 'Barre (3rd fret)', position: 'Barre' }, { frets: [3, 2, 0, 0, 3, 3], name: 'Alternate Open', position: 'Open' }],
  'Gm':   [{ frets: [3, 5, 5, 3, 3, 3], name: 'Barre (3rd fret)', position: 'Barre' }, { frets: [null, 10, 12, 12, 11, 10], name: 'Barre (10th fret)', position: 'Barre' }],
  'G7':   [{ frets: [3, 2, 0, 0, 0, 1], name: 'Open Position', position: 'Open' }, { frets: [3, 5, 3, 4, 3, 3], name: 'Barre (3rd fret)', position: 'Barre' }],
  'Gmaj7':[{ frets: [3, 2, 0, 0, 0, 2], name: 'Open Position', position: 'Open' }],
  'Gm7':  [{ frets: [3, 5, 3, 3, 3, 3], name: 'Barre (3rd fret)', position: 'Barre' }],

  'G#':   [{ frets: [4, 6, 6, 5, 4, 4], name: 'Barre (4th fret)', position: 'Barre' }],
  'G#m':  [{ frets: [4, 6, 6, 4, 4, 4], name: 'Barre (4th fret)', position: 'Barre' }],
  'G#7':  [{ frets: [4, 6, 4, 5, 4, 4], name: 'Barre (4th fret)', position: 'Barre' }],
  'Ab':   [{ frets: [4, 6, 6, 5, 4, 4], name: 'Barre (4th fret)', position: 'Barre' }],
  'Abm':  [{ frets: [4, 6, 6, 4, 4, 4], name: 'Barre (4th fret)', position: 'Barre' }],

  'A':    [{ frets: [null, 0, 2, 2, 2, 0], name: 'Open Position', position: 'Open' }, { frets: [5, 7, 7, 6, 5, 5], name: 'Barre (5th fret)', position: 'Barre' }, { frets: [null, 0, 2, 2, 2, 5], name: 'Open + High', position: 'Open' }],
  'Am':   [{ frets: [null, 0, 2, 2, 1, 0], name: 'Open Position', position: 'Open' }, { frets: [5, 7, 7, 5, 5, 5], name: 'Barre (5th fret)', position: 'Barre' }, { frets: [null, 0, 2, 2, 1, 3], name: 'Open + High', position: 'Open' }],
  'A7':   [{ frets: [null, 0, 2, 0, 2, 0], name: 'Open Position', position: 'Open' }, { frets: [5, 7, 5, 6, 5, 5], name: 'Barre (5th fret)', position: 'Barre' }],
  'Amaj7':[{ frets: [null, 0, 2, 1, 2, 0], name: 'Open Position', position: 'Open' }],
  'Am7':  [{ frets: [null, 0, 2, 0, 1, 0], name: 'Open Position', position: 'Open' }, { frets: [5, 7, 5, 5, 5, 5], name: 'Barre (5th fret)', position: 'Barre' }],
  'Adim': [{ frets: [null, 0, 1, 2, 1, 2], name: 'Open Position', position: 'Open' }],
  'A#':   [{ frets: [null, 1, 3, 3, 3, 1], name: 'Barre (1st fret)', position: 'Barre' }, { frets: [6, 8, 8, 7, 6, 6], name: 'Barre (6th fret)', position: 'Barre' }],
  'A#m':  [{ frets: [null, 1, 3, 3, 2, 1], name: 'Barre (1st fret)', position: 'Barre' }, { frets: [6, 8, 8, 6, 6, 6], name: 'Barre (6th fret)', position: 'Barre' }],
  'Bb':   [{ frets: [null, 1, 3, 3, 3, 1], name: 'Barre (1st fret)', position: 'Barre' }, { frets: [6, 8, 8, 7, 6, 6], name: 'Barre (6th fret)', position: 'Barre' }],
  'Bbm':  [{ frets: [null, 1, 3, 3, 2, 1], name: 'Barre (1st fret)', position: 'Barre' }, { frets: [6, 8, 8, 6, 6, 6], name: 'Barre (6th fret)', position: 'Barre' }],

  'B':    [{ frets: [null, 2, 4, 4, 4, 2], name: 'Barre (2nd fret)', position: 'Barre' }, { frets: [7, 9, 9, 8, 7, 7], name: 'Barre (7th fret)', position: 'Barre' }],
  'Bm':   [{ frets: [null, 2, 4, 4, 3, 2], name: 'Barre (2nd fret)', position: 'Barre' }, { frets: [7, 9, 9, 7, 7, 7], name: 'Barre (7th fret)', position: 'Barre' }],
  'B7':   [{ frets: [null, 2, 1, 2, 0, 2], name: 'Open Position', position: 'Open' }, { frets: [7, 9, 7, 8, 7, 7], name: 'Barre (7th fret)', position: 'Barre' }],
  'Bmaj7':[{ frets: [null, 2, 4, 3, 4, 2], name: 'Barre (2nd fret)', position: 'Barre' }],
  'Bm7':  [{ frets: [null, 2, 4, 2, 3, 2], name: 'Barre (2nd fret)', position: 'Barre' }],
  'Bdim': [{ frets: [null, 2, 3, 4, 3, 4], name: 'Open Position', position: 'Open' }],
};

// Enharmonic equivalents map
const ENHARMONIC_MAP = { 'C#': 'Db', 'Db': 'C#', 'D#': 'Eb', 'Eb': 'D#', 'F#': 'Gb', 'Gb': 'F#', 'G#': 'Ab', 'Ab': 'G#', 'A#': 'Bb', 'Bb': 'A#' };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { chartData, chord: rawChord, context = 'general' } = await req.json();
    if (!chartData || !rawChord) {
      return Response.json({ error: 'Chart data and chord required' }, { status: 400 });
    }

    // Strip slash bass note (e.g. "G/B" -> "G", "Am/C" -> "Am")
    const chord = rawChord.includes('/') ? rawChord.split('/')[0] : rawChord;

    // Find voicings for exact chord match only
    let voicingShapes = CHORD_VOICINGS[chord] || [];

    // If no exact match, try enharmonic equivalent
    if (voicingShapes.length === 0) {
      const root = chord.match(/^[A-G][#b]?/)?.[0] || '';
      const suffix = chord.slice(root.length);
      const enharmonicRoot = ENHARMONIC_MAP[root] || '';
      const enharmonicChord = enharmonicRoot ? enharmonicRoot + suffix : '';
      if (enharmonicChord && CHORD_VOICINGS[enharmonicChord]) {
        voicingShapes = CHORD_VOICINGS[enharmonicChord];
      }
    }

    if (voicingShapes.length === 0) {
      return Response.json({ success: false, voicings: [], error: `No voicings found for chord: ${chord}` });
    }

    // Ask the LLM to rank and describe the voicing positions
    const shapesDescription = voicingShapes.map((v, i) => `${i + 1}. "${v.name}" (${v.position})`).join('\n');

    const prompt = `You are an expert guitar voicing coach.

The guitarist needs to play the chord: "${chord}"
Key of the song: ${chartData.key}
Section context: ${context}

Here are the available voicing shapes for "${chord}":
${shapesDescription}

Rank these shapes from MOST to LEAST recommended for this key and context.
For each shape, return its index (1-based), a one-sentence description of why it suits this key/context, a brief technique tip, and the best musical situation for it.

Return ONLY valid JSON:
{
  "ranked": [
    { "index": 1, "description": "...", "technique": "...", "context": "..." }
  ]
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          ranked: {
            type: "array",
            items: {
              type: "object",
              properties: {
                index: { type: "number" },
                description: { type: "string" },
                technique: { type: "string" },
                context: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Merge LLM rankings back with fret data
    const ranked = (response.ranked || []);
    const voicings = ranked
      .map(r => {
        const shape = voicingShapes[r.index - 1];
        if (!shape) return null;
        return {
          chord,
          name: shape.name,
          frets: shape.frets,
          description: r.description,
          technique: r.technique,
          context: r.context
        };
      })
      .filter(Boolean);

    // Fallback: if LLM returned nothing, just return all shapes directly
    const finalVoicings = voicings.length > 0
      ? voicings
      : voicingShapes.map(v => ({ chord, name: v.name, frets: v.frets, description: '', technique: '', context: '' }));

    return Response.json({ success: true, voicings: finalVoicings });

  } catch (error) {
    console.error('voicingTips error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});