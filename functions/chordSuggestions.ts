import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { chartData, sectionData, measureIndex } = await req.json();
    if (!chartData || !sectionData || measureIndex === null) {
      return Response.json({ error: 'Missing required data' }, { status: 400 });
    }

    const targetMeasure = sectionData.measures?.[measureIndex];
    if (!targetMeasure) {
      return Response.json({ error: 'Measure not found' }, { status: 400 });
    }

    const currentChord = targetMeasure.chords?.[0]?.chord || '-';
    const previousChord = measureIndex > 0 ? sectionData.measures[measureIndex - 1]?.chords?.[0]?.chord : null;
    const nextChord = measureIndex < sectionData.measures.length - 1 ? sectionData.measures[measureIndex + 1]?.chords?.[0]?.chord : null;

    const prompt = `You are an experienced music theorist suggesting chord substitutions and voicings.

Song Context:
- Title: ${chartData.title}
- Key: ${chartData.key}
- Section: ${sectionData.label}
- Current Chord: ${currentChord}
- Previous Chord: ${previousChord || 'none'}
- Next Chord: ${nextChord || 'none'}

Suggest 2-3 creative but musically sensible chord substitutions that work in this context. Consider:
- Secondary dominants
- Tritone substitutions
- Borrowed chords from parallel keys
- Extensions/alterations

Return ONLY valid JSON:
{
  "substitutions": [
    {
      "original": "${currentChord}",
      "suggested": "Dm7",
      "type": "Secondary Dominant",
      "reasoning": "Creates tension and forward motion...",
      "musicEffect": "How it will sound and what character it adds"
    }
  ]
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          substitutions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                original: { type: "string" },
                suggested: { type: "string" },
                type: { type: "string" },
                reasoning: { type: "string" },
                musicEffect: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      substitutions: response.substitutions || []
    });

  } catch (error) {
    console.error('chordSuggestions error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});