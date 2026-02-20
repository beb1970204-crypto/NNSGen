import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { chartData, sectionData } = await req.json();
    if (!chartData) {
      return Response.json({ error: 'Chart data required' }, { status: 400 });
    }

    const sectionsData = chartData._sections || (sectionData ? [sectionData] : []);
    const chords = sectionsData.flatMap(s =>
      s.measures?.flatMap(m => m.chords?.map(c => c.chord) || []) || []
    ).filter(Boolean).join(' - ') || 'chord progression not available';

    const prompt = `You are an experienced arranger. Given the full chord progression for this song:

Progression: ${chords}
Key: ${chartData.key}
Song: "${chartData.title}" by ${chartData.artist}

Create detailed arrangement guidance for each instrument family showing what they could play during this section.

Return ONLY valid JSON:
{
  "drums": {
    "pattern": "Description of drum pattern",
    "intensity": "low/medium/high",
    "groove": "Groove feel and style",
    "tips": "Specific playing tips"
  },
  "bass": {
    "pattern": "Outline of bass line",
    "technique": "Playing technique",
    "rhythm": "Rhythmic pattern relative to drums",
    "tips": "Voice leading and movement tips"
  },
  "keys": {
    "voicing": "Suggested keyboard voicing approach",
    "rhythm": "Rhythmic feel",
    "texture": "Sparse/medium/dense",
    "tips": "Comping or accompaniment tips"
  },
  "guitar": {
    "voicing": "Strumming/fingerpicking voicing",
    "technique": "Technique (fingerpicking, strumming, etc)",
    "rhythm": "Rhythmic pattern",
    "tips": "Guitar-specific playing advice"
  },
  "overall": "How these parts work together"
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          drums: { type: "object", properties: { pattern: { type: "string" }, intensity: { type: "string" }, groove: { type: "string" }, tips: { type: "string" } } },
          bass: { type: "object", properties: { pattern: { type: "string" }, technique: { type: "string" }, rhythm: { type: "string" }, tips: { type: "string" } } },
          keys: { type: "object", properties: { voicing: { type: "string" }, rhythm: { type: "string" }, texture: { type: "string" }, tips: { type: "string" } } },
          guitar: { type: "object", properties: { voicing: { type: "string" }, technique: { type: "string" }, rhythm: { type: "string" }, tips: { type: "string" } } },
          overall: { type: "string" }
        }
      }
    });

    return Response.json({ success: true, arrangement: response });
  } catch (error) {
    console.error('arrangementGuidance error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});