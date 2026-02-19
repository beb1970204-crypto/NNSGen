import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { chartData, sectionData, genre } = await req.json();
    if (!chartData || !sectionData) {
      return Response.json({ error: 'Chart and section data required' }, { status: 400 });
    }

    const chords = sectionData.measures?.map(m => m.chords?.[0]?.chord).join('-') || '';

    const prompt = `You are a music analyst comparing chord progressions across famous songs.

Progression to analyze: ${chords}
Key: ${chartData.key}
Genre: ${genre || 'various'}
Section Type: ${sectionData.label}

Find 3-4 famous songs that use similar harmonic ideas or progressions. Explain how they approach it similarly or differently.

Return ONLY valid JSON:
{
  "comparisons": [
    {
      "songTitle": "Song Title",
      "artist": "Artist Name",
      "genre": "Genre",
      "similarity": "How it's similar to the analyzed progression",
      "differences": "Key differences in approach",
      "musicEffect": "How the famous song uses this progression",
      "lessonsLearned": "What you can learn from it"
    }
  ],
  "patterns": "Common patterns these songs share",
  "contextNote": "Genre/era context for these progressions"
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          comparisons: {
            type: "array",
            items: {
              type: "object",
              properties: {
                songTitle: { type: "string" },
                artist: { type: "string" },
                genre: { type: "string" },
                similarity: { type: "string" },
                differences: { type: "string" },
                musicEffect: { type: "string" },
                lessonsLearned: { type: "string" }
              }
            }
          },
          patterns: { type: "string" },
          contextNote: { type: "string" }
        }
      }
    });

    return Response.json({ success: true, analysis: response });
  } catch (error) {
    console.error('comparativeAnalysis error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});