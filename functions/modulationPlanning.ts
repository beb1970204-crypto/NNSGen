import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { chartData, currentKey, targetKey, context = 'general' } = await req.json();
    if (!chartData || !currentKey || !targetKey) {
      return Response.json({ error: 'Chart data and keys required' }, { status: 400 });
    }

    const prompt = `You are an expert in harmonic modulation and key changes.

Song: "${chartData.title}" by ${chartData.artist}
Current Key: ${currentKey}
Target Key: ${targetKey}
Context: ${context}

Provide modulation strategies for smoothly transitioning from ${currentKey} to ${targetKey}. Include several approaches from subtle to dramatic.

Return ONLY valid JSON:
{
  "modulationStrategies": [
    {
      "type": "Direct/Pivot/Chromatic/Enharmonic",
      "approach": "Name of approach",
      "description": "How this modulation works",
      "pivotChord": "Chord that works in both keys (if applicable)",
      "transitionMeasures": "Number of measures needed",
      "musicEffect": "How it will sound",
      "complexity": "simple/moderate/advanced"
    }
  ],
  "recommendedStrategy": "Which approach best fits this song",
  "placement": "Where to place the modulation for maximum impact",
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          modulationStrategies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                approach: { type: "string" },
                description: { type: "string" },
                pivotChord: { type: "string" },
                transitionMeasures: { type: "string" },
                musicEffect: { type: "string" },
                complexity: { type: "string" }
              }
            }
          },
          recommendedStrategy: { type: "string" },
          placement: { type: "string" },
          tips: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({ success: true, modulation: response });
  } catch (error) {
    console.error('modulationPlanning error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});