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

    const prompt = `You are a music theory professor creating educational quiz questions.

Song: "${chartData.title}" by ${chartData.artist}
Key: ${chartData.key}
Time Signature: ${chartData.time_signature}
Full Chord Progression: ${allChords}

Generate 5-8 progressively harder harmonic analysis questions covering the entire song. Focus on:
1. Easy: Chord identification and function
2. Medium: Cadences, chord movement, voice leading
3. Hard: Advanced concepts (borrowed chords, secondary dominants, modulations, etc.)

Return ONLY valid JSON with no explanation:
{
  "questions": [
    {
      "difficulty": "easy",
      "question": "What type of cadence is...",
      "hints": ["Hint 1", "Hint 2"],
      "answer": "The answer explanation",
      "teachingPoint": "What this teaches about music theory"
    }
  ]
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                difficulty: { type: "string" },
                question: { type: "string" },
                options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                hints: { type: "array", items: { type: "string" } },
                answer: { type: "string" },
                teachingPoint: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      questions: response.questions || []
    });

  } catch (error) {
    console.error('musicTheoryQuiz error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});