import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { setlistId, skillLevel = 'intermediate' } = await req.json();
    if (!setlistId) {
      return Response.json({ error: 'Setlist ID required' }, { status: 400 });
    }

    // Fetch setlist and charts
    const setlist = await base44.entities.Setlist.get(setlistId);
    if (!setlist) {
      return Response.json({ error: 'Setlist not found' }, { status: 404 });
    }

    // Get chart details
    const chartIds = setlist.chart_ids || [];
    const charts = await Promise.all(
      chartIds.map(id => base44.entities.Chart.get(id).catch(() => null))
    );
    const validCharts = charts.filter(Boolean);

    if (validCharts.length === 0) {
      return Response.json({ error: 'No valid charts in setlist' }, { status: 400 });
    }

    const chartInfo = validCharts.map(c => `${c.title} (${c.key})`).join(', ');

    const prompt = `You are a music curriculum designer creating learning paths for setlists.

Setlist: "${setlist.name}"
Charts: ${chartInfo}
Skill Level: ${skillLevel}

Design a structured learning path that orders these songs by difficulty and concept progression. Group songs that share similar concepts. Provide weekly practice structure.

Return ONLY valid JSON:
{
  "overallGoal": "What mastering this setlist teaches",
  "estimatedDuration": "Total time to master",
  "weeks": [
    {
      "week": 1,
      "theme": "Learning theme",
      "focus": "What to focus on this week",
      "songs": ["Song 1", "Song 2"],
      "practiceGoals": ["Goal 1", "Goal 2"],
      "milestones": ["Milestone 1"]
    }
  ],
  "conceptProgression": "How concepts build on each other",
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          overallGoal: { type: "string" },
          estimatedDuration: { type: "string" },
          weeks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                week: { type: "number" },
                theme: { type: "string" },
                focus: { type: "string" },
                songs: { type: "array", items: { type: "string" } },
                practiceGoals: { type: "array", items: { type: "string" } },
                milestones: { type: "array", items: { type: "string" } }
              }
            }
          },
          conceptProgression: { type: "string" },
          tips: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({ success: true, learningPath: response });
  } catch (error) {
    console.error('generateLearningPath error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});