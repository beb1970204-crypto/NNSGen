import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

// ─── Output Validation (refinement-specific, more lenient than generation) ────────

function validateChartOutput(sections) {
  if (!sections || sections.length < 1) {
    return { valid: false, reason: 'No sections generated' };
  }
  if (sections.length > 12) {
    return { valid: false, reason: 'Too many sections (likely fragmented)' };
  }

  // For refinement, be more lenient: just require at least one section
  // (user may be restructuring a song that doesn't fit traditional patterns)
  const labels = sections.map(s => s.label);
  if (labels.length === 0) {
    return { valid: false, reason: 'No sections generated' };
  }

  const uniqueChords = new Set();
  let totalMeasures = 0;
  let totalChords = 0;
  
  for (const section of sections) {
    const measures = section.measures || [];
    totalMeasures += measures.length;
    
    for (const measure of measures) {
      const chords = measure.chords || [];
      for (const chordObj of chords) {
        if (chordObj.chord && chordObj.chord !== '-') {
          uniqueChords.add(chordObj.chord);
          totalChords++;
        }
      }
    }
  }



  console.log(`Refinement validation: ${sections.length} sections, ${totalMeasures} measures, ${totalChords} chords, ${uniqueChords.size} unique`);

  if (totalChords < 4) {
    console.log(`Warning: Very few chords (${totalChords}), may be valid but check manually`);
  }

  const expectedMaxChords = Math.ceil(totalMeasures / 2) + 10;
  if (uniqueChords.size > expectedMaxChords && uniqueChords.size > 25) {
    return { valid: false, reason: `Unusually high chord density (${uniqueChords.size} unique chords), likely hallucination` };
  }

  return { valid: true, uniqueChords: uniqueChords.size, totalMeasures, totalChords };
}

// ─── Main Refinement Handler ──────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, artist, key, time_signature, userFeedback, currentSections } = await req.json();
    
    if (!title || !userFeedback || !currentSections?.length) {
      return Response.json({ error: 'Title, feedback, and current sections are required' }, { status: 400 });
    }

    // Build full current chart structure for LLM context
    const currentChartJSON = JSON.stringify(currentSections, null, 2);

    // Simplified refinement prompt — let schema enforce structure, keep instruction clear
    const prompt = `You are refining a chord chart. Here is the current chart in JSON:

${currentChartJSON}

Key: ${key}
Time Signature: ${time_signature}

User's refinement request: "${userFeedback}"

Review the chart and make ONLY the changes the user requested. Return the complete refined chart with all sections.`;

    const schema = {
      type: "object",
      properties: {
        key_tonic: { type: "string" },
        key_mode: { type: "string", enum: ["major", "minor"] },
        time_signature: { type: "string" },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string", enum: ["Intro", "Verse", "Pre", "Chorus", "Bridge", "Instrumental Solo", "Outro"] },
              repeat_count: { type: "number" },
              arrangement_cue: { type: "string" },
              measures: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    chords: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          chord: { type: "string" },
                          beats: { type: "number" }
                        },
                        required: ["chord", "beats"]
                      }
                    },
                    cue: { type: "string" }
                  },
                  required: ["chords"]
                }
              }
            },
            required: ["label", "measures"]
          }
        }
      },
      required: ["key_tonic", "key_mode", "time_signature", "sections"]
    };

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      response_json_schema: schema
    });

    if (!response?.sections?.length) {
      return Response.json({ error: 'LLM refinement returned no sections' }, { status: 500 });
    }

    // Validate refined output
    const validation = validateChartOutput(response.sections);
    if (!validation.valid) {
      console.log('Refinement validation failed:', validation.reason);
      return Response.json({ error: `Refinement validation failed: ${validation.reason}. Please try different feedback.` }, { status: 400 });
    }

    // Sanitize and expand measures (same as generateChartAI)
    const VALID_SYMBOLS = ["diamond", "marcato", "push", "pull", "fermata", "bass_up", "bass_down"];
    const beatsPerMeasure = parseInt(time_signature.split('/')[0]) || 4;

    const refinedSections = response.sections.map(section => ({
      ...section,
      repeat_count: Number(section.repeat_count) || 1,
      arrangement_cue: section.arrangement_cue || '',
      measures: (section.measures || []).flatMap(measure => {
        const chords = (measure.chords || []).map(c => ({
          chord: c.chord || '-',
          beats: Number(c.beats) || 4,
          symbols: Array.isArray(c.symbols) ? c.symbols.filter(s => VALID_SYMBOLS.includes(s)) : []
        }));

        if (chords.length === 1 && chords[0].beats === beatsPerMeasure) {
          return [{ chords, cue: measure.cue || '' }];
        } else {
          return chords.map((c, idx) => ({
            chords: [{ ...c, beats: beatsPerMeasure }],
            cue: idx === 0 ? (measure.cue || '') : ''
          }));
        }
      })
    }));

    return Response.json({
      success: true,
      message: 'Chart refined successfully',
      sectionsData: refinedSections
    });

  } catch (error) {
    console.error('refineChartAI error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});