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

    const currentChartJSON = JSON.stringify(currentSections, null, 2);

    const refinementPrompt = `You are a professional chord chart editor. Refine the user's chart based on their feedback.

CURRENT CHART:
${currentChartJSON}

METADATA:
Song Key: ${key}
Time Signature: ${time_signature}

USER FEEDBACK: "${userFeedback}"

Apply the user's feedback to improve the chart structure, cues, and organization. Keep all sections and measures from the original. Return ONLY the JSON object — no explanation.`;

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

    let response;
    try {
      response = await base44.integrations.Core.InvokeLLM({
        prompt: refinementPrompt,
        add_context_from_internet: false,
        response_json_schema: schema
      });
    } catch (llmError) {
      console.error('LLM refinement call failed:', llmError.message);
      return Response.json({ 
        error: 'LLM response parsing failed. Please try refining with different feedback.'
      }, { status: 400 });
    }

    if (!response?.sections?.length) {
      return Response.json({ error: 'LLM refinement returned no sections' }, { status: 500 });
    }

    // Validate that refined chart preserves all original sections
    const originalSectionCount = currentSections.length;
    const refinedSectionCount = response.sections.length;
    
    if (refinedSectionCount < originalSectionCount) {
      console.log(`Refinement lost sections: ${originalSectionCount} → ${refinedSectionCount}`);
      return Response.json({ 
        error: `Refinement removed sections. Please provide different feedback or refine again.` 
      }, { status: 400 });
    }

    // Validate refined output quality
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