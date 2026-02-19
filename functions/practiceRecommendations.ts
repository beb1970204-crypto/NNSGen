import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { chartData, sectionData, skillLevel = 'intermediate' } = await req.json();
    if (!chartData || !sectionData) {
      return Response.json({ error: 'Chart and section data required' }, { status: 400 });
    }

    const chords = sectionData.measures?.map(m => m.chords?.[0]?.chord).join('-') || '';

    const prompt = `You are a practice coach creating targeted exercises for musicians.

Progression: ${chords}
Section: ${sectionData.label}
Key: ${chartData.key}
Skill Level: ${skillLevel}

Create 3-4 specific practice exercises focused on mastering different aspects of this progression. Include voice leading exercises, rhythm patterns, and listening exercises.

Return ONLY valid JSON:
{
  "focusAreas": ["Area 1", "Area 2", "Area 3"],
  "exercises": [
    {
      "title": "Exercise Name",
      "focus": "What this exercise targets",
      "description": "How to practice this",
      "duration": "Suggested practice duration",
      "progression": "Exact chords to practice",
      "difficulty": "easy/moderate/hard",
      "tips": "Specific guidance for success",
      "whyMatters": "Why this exercise improves your playing"
    }
  ],
  "practiceSequence": "Recommended order and daily practice plan",
  "progressionMilestones": ["Milestone 1", "Milestone 2", "Milestone 3"]
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          focusAreas: { type: "array", items: { type: "string" } },
          exercises: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                focus: { type: "string" },
                description: { type: "string" },
                duration: { type: "string" },
                progression: { type: "string" },
                difficulty: { type: "string" },
                tips: { type: "string" },
                whyMatters: { type: "string" }
              }
            }
          },
          practiceSequence: { type: "string" },
          progressionMilestones: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({ success: true, practice: response });
  } catch (error) {
    console.error('practiceRecommendations error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});