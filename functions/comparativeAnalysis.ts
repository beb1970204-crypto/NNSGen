import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { chartData, genre } = await req.json();
    if (!chartData) {
      return Response.json({ error: 'Chart data required' }, { status: 400 });
    }

    const sectionsData = chartData._sections || [];
    const allChords = sectionsData.flatMap(s =>
      s.measures?.flatMap(m => m.chords?.map(c => c.chord) || []) || []
    ).filter(Boolean).join(' ') || 'chord progression not available';

    const prompt = `You are a music analyst comparing chord progressions across famous songs.

Song to analyze: "${chartData.title}" by ${chartData.artist}
Full Progression: ${allChords}
Key: ${chartData.key}
Genres: ${genre || chartData.genres || 'various'}

Find 4-6 famous songs with similar harmonic structures, progressions, or song forms. Explain how they approach it and what you can learn.

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

    return Response.json({ success: true, comparisons: response.comparisons, patterns: response.patterns, contextNote: response.contextNote });
  } catch (error) {
    console.error('comparativeAnalysis error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});