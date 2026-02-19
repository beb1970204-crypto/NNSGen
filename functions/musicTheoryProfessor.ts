import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { chartData, sectionData, selectedMeasure, userQuestion } = await req.json();
    
    if (!userQuestion) {
      return Response.json({ error: 'Question is required' }, { status: 400 });
    }

    // Build context about the current chart
    const chartContext = `
Current Chart:
- Title: ${chartData?.title || 'Unknown'}
- Artist: ${chartData?.artist || 'Unknown'}
- Key: ${chartData?.key || 'C'}
- Time Signature: ${chartData?.time_signature || '4/4'}

${sectionData ? `
Current Section: ${sectionData?.label}
Measures in this section: ${sectionData?.measures?.length || 0}
Section repeat count: ${sectionData?.repeat_count || 1}
` : ''}

${selectedMeasure ? `
Selected Measure Chords:
${selectedMeasure.chords?.map(c => `- ${c.chord} (${c.beats} beats)`).join('\n')}
` : ''}
`;

    const prompt = `You are an expert music theory professor helping musicians understand harmonic analysis, chord progressions, and musical concepts.

${chartContext}

The user is asking: "${userQuestion}"

IMPORTANT:
1. Always ground your explanation in the actual chart data provided above
2. Explain THEORY - focus on why chords function the way they do
3. Use proper music terminology but explain it clearly
4. If explaining a chord, describe its function (dominant, subdominant, tonic, etc.)
5. Reference specific chords from the chart when relevant
6. Be encouraging and educational, not condescending
7. Keep explanations concise but thorough (2-3 paragraphs max)

Provide a clear, educational explanation that helps the musician understand the music theory.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true
    });

    if (!response) {
      return Response.json({ error: 'Failed to generate theory explanation' }, { status: 500 });
    }

    return Response.json({
      success: true,
      explanation: response
    });

  } catch (error) {
    console.error('musicTheoryProfessor error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});