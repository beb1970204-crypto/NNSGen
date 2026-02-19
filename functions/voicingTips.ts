import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { chartData, chord, instrument = 'piano', context = 'general' } = await req.json();
    if (!chartData || !chord) {
      return Response.json({ error: 'Chart data and chord required' }, { status: 400 });
    }

    const prompt = `You are an expert voicing and arrangement coach.

Chord: ${chord}
Key: ${chartData.key}
Instrument: ${instrument}
Context: ${context}

Provide 2-3 practical voicing suggestions for this chord on a ${instrument}. Consider:
- Range and playability on the instrument
- Voice leading smoothness
- Harmonic function in the key
- Contemporary vs. traditional approaches

CRITICAL for guitar: Include the specific fret positions as an array of 6 numbers for strings [E,A,D,G,B,e]. Use null for muted strings.

Return ONLY valid JSON:
{
  "voicings": [
    {
      "chord": "${chord}",
      "name": "Shell Voicing",
      "notes": "Root-3rd-7th",
      "frets": [null, 3, 5, 3, 4, 3],
      "description": "A minimal, clean voicing...",
      "technique": "How to play it on ${instrument}",
      "context": "When to use this voicing",
      "difficulty": "intermediate"
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
                chord: { type: "string" },
                name: { type: "string" },
                notes: { type: "string" },
                frets: { type: "array", items: { type: ["number", "null"] }, minItems: 6, maxItems: 6 },
                description: { type: "string" },
                technique: { type: "string" },
                context: { type: "string" },
                difficulty: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      voicings: response.voicings || []
    });

  } catch (error) {
    console.error('voicingTips error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});