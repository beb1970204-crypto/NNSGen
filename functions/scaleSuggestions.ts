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

    const allChords = chartData.sections?.flatMap(sectionId => {
      const section = chartData._sections?.find(s => s.id === sectionId);
      return section?.measures?.flatMap(m => m.chords?.map(c => c.chord)) || [];
    }).join(' ') || '';

    const prompt = `You are a music theory educator suggesting scales and modes for improvisation.

Song: "${chartData.title}" by ${chartData.artist}
Key: ${chartData.key}
Time Signature: ${chartData.time_signature}
Full Chord Progression: ${allChords}

Suggest 4-6 scales, modes, and melodic approaches that work well for improvising over this entire song. Include:
- Primary scales (major, minor, pentatonic)
- Modes that fit specific sections
- Tension/extension approaches
- When to use each one

Return ONLY valid JSON:
{
  "primaryScales": [
    {
      "scale": "Scale Name (e.g., C Major)",
      "reason": "Why this works for the song",
      "bestFor": "Which sections or parts",
      "avoidNotes": ["Notes to be careful with"]
    }
  ],
  "modesSuggestions": [
    {
      "mode": "Mode Name (e.g., Dorian, Lydian)",
      "application": "When and how to use it",
      "soundCharacter": "How it sounds"
    }
  ],
  "improvisationTips": [
    "Tip 1",
    "Tip 2",
    "Tip 3"
  ],
  "practiceApproach": "Suggested way to practice improvisation over this song"
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          primaryScales: {
            type: "array",
            items: {
              type: "object",
              properties: {
                scale: { type: "string" },
                reason: { type: "string" },
                bestFor: { type: "string" },
                avoidNotes: { type: "array", items: { type: "string" } }
              }
            }
          },
          modesSuggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                mode: { type: "string" },
                application: { type: "string" },
                soundCharacter: { type: "string" }
              }
            }
          },
          improvisationTips: { type: "array", items: { type: "string" } },
          practiceApproach: { type: "string" }
        }
      }
    });

    return Response.json({ success: true, scales: response });
  } catch (error) {
    console.error('scaleSuggestions error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});