import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';
import { Key } from 'npm:tonal@6.0.1';



// ─── Output Validation (refinement-specific, more lenient than generation) ────────

function validateChartOutput(sections) {
  if (!sections || sections.length < 1) {
    return { valid: false, reason: 'No sections generated' };
  }
  if (sections.length > 12) {
    return { valid: false, reason: 'Too many sections (likely fragmented)' };
  }

  // For refinement, be more lenient: just require at least one section
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

    // ── Step 1: Generate a fresh complete chart using the exact same prompt as generateChartAI ──
    const generationPrompt = `You are a professional chord transcriber. Transcribe "${title}" by ${artist || 'Unknown'} with COMPLETE song structure.

CRITICAL REQUIREMENTS:
1. Return a COMPLETE chart: Verse + Chorus are MANDATORY. Include Intro/Outro/Bridge as appropriate for the song.
2. Use ONLY these section labels: Intro, Verse, Pre, Chorus, Bridge, Instrumental Solo, Outro
3. Chart the ENTIRE song structure naturally — do not truncate or summarize
4. Measures may contain 1 or more chords; beats must sum to the time signature
5. All chords must be musically coherent and diatonic where possible
6. Return ONLY valid JSON, no explanation

JSON STRUCTURE:
{
  "key_tonic": "A",
  "key_mode": "major",
  "time_signature": "4/4",
  "sections": [
    {
      "label": "Verse",
      "repeat_count": 1,
      "arrangement_cue": "",
      "measures": [
        {"chords": [{"chord": "A", "beats": 4}], "cue": ""},
        {"chords": [{"chord": "A", "beats": 2}, {"chord": "E", "beats": 2}], "cue": ""}
      ]
    },
    {
      "label": "Chorus",
      "repeat_count": 1,
      "arrangement_cue": "",
      "measures": [
        {"chords": [{"chord": "D", "beats": 4}], "cue": ""}
      ]
    }
  ]
}`;

RESPONSE FORMAT:
{
  "key_tonic": "C",
  "key_mode": "major",
  "time_signature": "4/4",
  "sections": [
    {
      "label": "Verse",
      "repeat_count": 1,
      "arrangement_cue": "",
      "measures": [
        {"chords": [{"chord": "C", "beats": 4}], "cue": ""},
        {"chords": [{"chord": "F", "beats": 4}], "cue": ""}
      ]
    },
    {
      "label": "Chorus",
      "repeat_count": 1,
      "arrangement_cue": "",
      "measures": [
        {"chords": [{"chord": "G", "beats": 4}], "cue": ""}
      ]
    }
  ]
}`;

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

    let freshChart;
    try {
      freshChart = await base44.integrations.Core.InvokeLLM({
        prompt: generationPrompt,
        add_context_from_internet: true,
        response_json_schema: schema
      });
    } catch (llmError) {
      console.error('Fresh chart generation failed:', llmError.message);
      return Response.json({ 
        error: 'Failed to generate reference chart. Please try again.'
      }, { status: 400 });
    }

    if (!freshChart?.sections?.length) {
      return Response.json({ error: 'Fresh chart generation returned no sections' }, { status: 500 });
    }

    // ── Step 2: Validate fresh chart ──
    const freshValidation = validateChartOutput(freshChart.sections);
    if (!freshValidation.valid) {
      console.log('Fresh chart validation failed:', freshValidation.reason);
      return Response.json({ error: `Fresh chart invalid: ${freshValidation.reason}. Try refining again.` }, { status: 400 });
    }

    // ── Step 3: Compare fresh chart to current and determine if it addresses the user's issue ──
    const currentChartJSON = JSON.stringify(currentSections, null, 2);
    const freshChartJSON = JSON.stringify(freshChart.sections, null, 2);

    const comparisonPrompt = `You are evaluating if a freshly generated chart solves the user's stated problem with their current chart.

CURRENT CHART (user's existing chart):
${currentChartJSON}

FRESH CHART (newly generated from scratch):
${freshChartJSON}

USER'S FEEDBACK/ISSUE: "${userFeedback}"

TASK: Determine if the fresh chart addresses what the user complained about. Answer with JSON:
{
  "solves_issue": true or false,
  "reasoning": "brief explanation of why it does or doesn't solve the issue"
}`;

    const comparisonSchema = {
      type: "object",
      properties: {
        solves_issue: { type: "boolean" },
        reasoning: { type: "string" }
      },
      required: ["solves_issue", "reasoning"]
    };

    let comparisonResponse;
    try {
      comparisonResponse = await base44.integrations.Core.InvokeLLM({
        prompt: comparisonPrompt,
        add_context_from_internet: false,
        response_json_schema: comparisonSchema
      });
    } catch (comparisonError) {
      console.error('Comparison validation failed:', comparisonError.message);
      return Response.json({ 
        error: 'Failed to validate if fresh chart solves the issue. Try again.'
      }, { status: 400 });
    }

    if (!comparisonResponse?.solves_issue) {
      console.log('Comparison determined fresh chart does not solve issue:', comparisonResponse?.reasoning);
      return Response.json({ 
        error: `The fresh chart does not solve your issue (${comparisonResponse?.reasoning || 'unknown reason'}). Try providing different feedback.`
      }, { status: 400 });
    }

    // Sanitize and expand measures (same as generateChartAI)
    const VALID_SYMBOLS = ["diamond", "marcato", "push", "pull", "fermata", "bass_up", "bass_down"];
    const beatsPerMeasure = parseInt(time_signature.split('/')[0]) || 4;

    const refinedSections = freshChart.sections.map(section => ({
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