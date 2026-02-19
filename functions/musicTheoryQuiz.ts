import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { chartData, sectionData } = await req.json();
    if (!chartData || !sectionData) {
      return Response.json({ error: 'Chart and section data required' }, { status: 400 });
    }

    const prompt = `You are a music theory professor creating educational quiz questions.

Given this chart:
- Title: ${chartData.title}
- Artist: ${chartData.artist}
- Key: ${chartData.key}
- Section: ${sectionData.label}
- Chords: ${sectionData.measures?.map(m => m.chords?.map(c => c.chord).join(' ')).join(' | ')}

Generate 3 progressively harder harmonic analysis questions for this section. Focus on:
1. Easy: Chord identification and function
2. Medium: Cadences, chord movement, voice leading
3. Hard: Advanced concepts (borrowed chords, secondary dominants, etc.)

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