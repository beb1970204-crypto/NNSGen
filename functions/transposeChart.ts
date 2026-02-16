import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';
import { transpose, distance } from 'npm:tonal@6.0.1';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { chart_id, target_key } = await req.json();

  if (!chart_id || !target_key) {
    return Response.json({ 
      error: 'chart_id and target_key are required' 
    }, { status: 400 });
  }

  try {
    // Fetch the latest chart and sections data server-side
    const chart = await base44.entities.Chart.get(chart_id);
    const sections = await base44.entities.Section.filter({ chart_id });

    if (!chart) {
      return Response.json({ error: 'Chart not found' }, { status: 404 });
    }

    const originalKey = chart.key;
    
    // Calculate the interval between keys
    const interval = distance(originalKey, target_key);
    
    if (!interval) {
      return Response.json({ 
        error: 'Unable to calculate transposition interval' 
      }, { status: 400 });
    }

    // Transpose all sections
    const transposedSections = sections.map(section => {
      const transposedMeasures = section.measures.map(measure => ({
        ...measure,
        chords: measure.chords?.map(chordObj => {
          const chord = chordObj.chord;
          if (!chord || chord === '-') return chordObj;
          
          const transposedChord = transpose(chord, interval);
          return {
            ...chordObj,
            chord: transposedChord || chord
          };
        })
      }));
      
      return {
        section_id: section.id,
        measures: transposedMeasures
      };
    });

    // Update chart key
    await base44.asServiceRole.entities.Chart.update(chart_id, { key: target_key });

    // Update all sections in parallel
    await Promise.all(
      transposedSections.map(({ section_id, measures }) =>
        base44.asServiceRole.entities.Section.update(section_id, { measures })
      )
    );

    return Response.json({ 
      success: true,
      message: `Chart transposed from ${originalKey} to ${target_key}`
    });

  } catch (error) {
    console.error('Transposition error:', error);
    return Response.json({ 
      error: 'Failed to transpose chart',
      details: error.message
    }, { status: 500 });
  }
});