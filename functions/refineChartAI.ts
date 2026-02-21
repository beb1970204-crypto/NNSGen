import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

// ─── chord_string → measures parser (shared with generateChartAI) ─────────────
function chordStringToMeasures(chordString, beatsPerMeasure) {
  const bars = chordString.split('|').map(b => b.trim()).filter(Boolean);
  return bars.map(bar => {
    const tokens = bar.split(/\s+/).filter(Boolean);
    const beatsPerChord = beatsPerMeasure / tokens.length;
    const chords = tokens.map(token => {
      const starIdx = token.indexOf('*');
      if (starIdx !== -1) {
        return { chord: token.slice(0, starIdx), beats: parseFloat(token.slice(starIdx + 1)) || beatsPerChord, symbols: [] };
      }
      return { chord: token, beats: beatsPerChord, symbols: [] };
    });
    const total = chords.reduce((s, c) => s + c.beats, 0);
    if (total !== beatsPerMeasure) {
      const scale = beatsPerMeasure / total;
      chords.forEach(c => { c.beats = Math.round(c.beats * scale * 100) / 100; });
    }
    return { chords, cue: '' };
  });
}

// ─── Output Validation ────────────────────────────────────────────────────────
function validateChartOutput(sections) {
  if (!sections || sections.length < 1) return { valid: false, reason: 'No sections generated' };
  if (sections.length > 20) return { valid: false, reason: 'Too many sections (likely fragmented)' };

  const uniqueChords = new Set();
  let totalMeasures = 0;
  let totalChords = 0;

  for (const section of sections) {
    const measures = section.measures || [];
    totalMeasures += measures.length;
    for (const measure of measures) {
      for (const chordObj of measure.chords || []) {
        if (chordObj.chord && chordObj.chord !== '-') {
          uniqueChords.add(chordObj.chord);
          totalChords++;
        }
      }
    }
  }

  console.log(`Refinement validation: ${sections.length} sections, ${totalMeasures} measures, ${totalChords} chords`);

  if (totalMeasures < 4) return { valid: false, reason: 'Suspiciously low measure count' };
  if (totalChords < 1) return { valid: false, reason: 'No chords generated' };

  const expectedMaxChords = Math.ceil(totalMeasures / 2) + 15;
  if (uniqueChords.size > expectedMaxChords && uniqueChords.size > 50) {
    return { valid: false, reason: `Unusually high chord density (${uniqueChords.size} unique chords), likely hallucination` };
  }

  return { valid: true, uniqueChords: uniqueChords.size, totalMeasures, totalChords };
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, artist, key, time_signature, userFeedback, currentSections } = await req.json();
    if (!title || !userFeedback || !currentSections?.length) {
      return Response.json({ error: 'Title, feedback, and current sections are required' }, { status: 400 });
    }

    const currentChartSummary = currentSections.map(s =>
      `${s.label}: ${(s.measures || []).map(m => m.chords?.map(c => c.chord).join('/') || '-').join(' | ')}`
    ).join('\n');

    // ── Step 1: Research the refinement (free-text, internet-enabled) ──────────
    const researchPrompt = `You are an expert session musician and music theorist.
The user has a chord chart for "${title}" by ${artist || 'Unknown'} and wants it refined based on this feedback: "${userFeedback}"

### CURRENT CHART:
${currentChartSummary}

Research the actual, correct chord progression for this song and describe the corrections or improvements needed to address the user's feedback.
List the complete corrected chart section by section, bar by bar. Include the key and time signature.`;

    console.log('Step 1: Researching refinement...');
    let researchData;
    try {
      researchData = await base44.integrations.Core.InvokeLLM({
        prompt: researchPrompt,
        add_context_from_internet: true,
      });
    } catch (error) {
      throw new Error(`Research step failed: ${error.message}`);
    }

    if (!researchData || typeof researchData !== 'string' || researchData.trim().length < 50) {
      throw new Error('Could not retrieve refinement data. Please try again.');
    }

    console.log('Step 1 complete. Research length:', researchData.length);

    // ── Step 2: Convert refined research into structured JSON ──────────────────
    const tsMatch = (time_signature || '4/4').match(/^(\d+)/);
    const beatsPerMeasure = tsMatch ? parseInt(tsMatch[1], 10) : 4;

    const structurePrompt = `You are a music transcription expert. Convert the following chord refinement research into a structured JSON chart.

### CHORD RESEARCH:
${researchData}

### FORMAT RULES:
1. chord_string uses pipe "|" separators — each segment is ONE bar/measure.
   Example 4 bars of G7: "G7 | G7 | G7 | G7"
2. Two chords sharing one bar: space-separate them: "G F#7" (equal split) or "G*2 F#7*2" (explicit beats).
3. Section labels MUST be one of: Intro, Verse, Pre, Chorus, Bridge, Instrumental Solo, Outro.
   You may append numbers (e.g., Verse 1, Verse 2).
4. Do NOT truncate. Every bar of every section must appear in chord_string.

Now produce the full structured JSON for "${title}" by ${artist || 'Unknown'}:`;

    const schema = {
      type: "object",
      properties: {
        _structural_plan: { type: "string" },
        key: { type: "string" },
        time_signature: { type: "string" },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              repeat_count: { type: "number" },
              arrangement_cue: { type: "string" },
              chord_string: { type: "string" }
            },
            required: ["label", "chord_string"]
          }
        }
      },
      required: ["key", "time_signature", "sections"]
    };

    let response;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Step 2: Structuring JSON (attempt ${attempt}/${maxAttempts})...`);
        response = await base44.integrations.Core.InvokeLLM({
          prompt: structurePrompt,
          add_context_from_internet: false,
          response_json_schema: schema
        });
        if (response?.sections?.length) break;
        console.warn(`Attempt ${attempt}: LLM returned no sections, retrying...`);
      } catch (error) {
        console.error(`Attempt ${attempt} error: ${error.message}`);
        if (attempt === maxAttempts) throw new Error(`Failed to structure refined chart: ${error.message}`);
      }
    }

    if (!response?.sections?.length) {
      throw new Error('Unable to refine chart after multiple attempts. Please try again with different feedback.');
    }

    // ── Convert chord_string → measures ────────────────────────────────────────
    const sections = response.sections.map(section => ({
      label: section.label,
      repeat_count: Number(section.repeat_count) || 1,
      arrangement_cue: section.arrangement_cue || '',
      measures: chordStringToMeasures(section.chord_string || '', beatsPerMeasure)
    }));

    const validation = validateChartOutput(sections);
    if (!validation.valid) {
      return Response.json({ error: `Refined chart validation failed: ${validation.reason}. Please try again.` }, { status: 400 });
    }

    // ── Sanitize symbols ───────────────────────────────────────────────────────
    const VALID_SYMBOLS = ["diamond", "marcato", "push", "pull", "fermata", "bass_up", "bass_down"];
    const refinedSections = sections.map(section => ({
      ...section,
      measures: section.measures.map(measure => ({
        chords: measure.chords.map(c => ({
          chord: c.chord || '-',
          beats: Number(c.beats) || 4,
          symbols: Array.isArray(c.symbols) ? c.symbols.filter(s => VALID_SYMBOLS.includes(s)) : []
        })),
        cue: measure.cue || ''
      }))
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