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

    const prompt = `You are a music theory educator creating a comprehensive lesson about a song.

Song: "${chartData.title}" by ${chartData.artist}
Key: ${chartData.key}
Time Signature: ${chartData.time_signature}
Tempo: ${chartData.tempo || 'Not specified'} BPM
Full Chord Progression: ${allChords}

Write a complete music theory lesson about this song that covers:
1. **Song Overview** - The song's style, era, and significance
2. **Harmonic Analysis** - The chord progression, key modulations, and harmonic functions
3. **Structure** - Section breakdown and form analysis
4. **Music Theory Concepts** - Specific techniques used (cadences, borrowed chords, voice leading, etc.)
5. **Performance Tips** - Advice for playing or interpreting this song
6. **Practice Suggestions** - How to approach learning this progression

Use markdown formatting with headers, lists, and emphasis. Be detailed and educational but accessible.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
    });

    return Response.json({
      success: true,
      lesson: response
    });

  } catch (error) {
    console.error('generateLessonAI error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});