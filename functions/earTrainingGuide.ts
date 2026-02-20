import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { chartData } = await req.json();
    if (!chartData) {
      return Response.json({ error: 'Chart data required' }, { status: 400 });
    }

    // _sections is populated by the frontend when passing chartData+sections together
    const sectionsData = chartData._sections || [];
    const allChords = sectionsData.flatMap(s =>
      s.measures?.flatMap(m => m.chords?.map(c => c.chord) || []) || []
    ).filter(Boolean).join(' ') || 'chord progression not available';

    const prompt = `You are an ear training coach preparing someone to recognize chord progressions by ear.

Song: "${chartData.title}" by ${chartData.artist} in ${chartData.key}
Full Chord Progression: ${allChords}

Create comprehensive ear training guidance that helps someone recognize the entire song by ear:
1. The emotional/sonic character to listen for
2. Specific moments and what makes them distinctive
3. Practice tips and what to focus on
4. Similar progressions they might encounter

Return ONLY valid JSON:
{
  "soundCharacter": "The overall emotional tone and feeling...",
  "listenFor": [
    {
      "moment": "Opening chord",
      "sound": "Description of what you hear",
      "distinguishingFeature": "What makes it unique"
    }
  ],
  "practiceTips": [
    "Tip 1",
    "Tip 2",
    "Tip 3"
  ],
  "similarProgressions": [
    {
      "example": "I-vi-IV-V",
      "comparison": "How it relates to this progression"
    }
  ]
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          soundCharacter: { type: "string" },
          listenFor: {
            type: "array",
            items: {
              type: "object",
              properties: {
                moment: { type: "string" },
                sound: { type: "string" },
                distinguishingFeature: { type: "string" }
              }
            }
          },
          practiceTips: { type: "array", items: { type: "string" } },
          similarProgressions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                example: { type: "string" },
                comparison: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      guide: response
    });

  } catch (error) {
    console.error('earTrainingGuide error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});