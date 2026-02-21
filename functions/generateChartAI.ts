import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

// ─── chord_string → measures parser ──────────────────────────────────────────
// The LLM provides a simple linear chord string per section.
// Format: pipe-separated bars, each bar is space-separated chords with optional beat counts.
//   "G7 | G7 | G7 | G7 | C7 | C7 | G7 | G7 | D7 | C7 | G7 | D7"
//   "D A | G | G"           (two chords sharing a bar, then single chord bars)
//   "D*2 A*2 | G*4 | A*4"  (explicit beat counts via *N suffix)
// One pipe segment = one measure. Beat math is enforced here, not by the LLM.

function chordStringToMeasures(chordString, beatsPerMeasure) {
  const bars = chordString.split('|').map(b => b.trim()).filter(Boolean);

  return bars.map(bar => {
    const tokens = bar.split(/\s+/).filter(Boolean);
    const beatsPerChord = beatsPerMeasure / tokens.length;

    const chords = tokens.map(token => {
      // Support optional explicit beat count via "Chord*N" (e.g. "D*2")
      const starIdx = token.indexOf('*');
      if (starIdx !== -1) {
        return {
          chord: token.slice(0, starIdx),
          beats: parseFloat(token.slice(starIdx + 1)) || beatsPerChord,
          symbols: []
        };
      }
      return { chord: token, beats: beatsPerChord, symbols: [] };
    });

    // Normalize so beats always sum to beatsPerMeasure
    const total = chords.reduce((s, c) => s + c.beats, 0);
    if (total !== beatsPerMeasure) {
      const scale = beatsPerMeasure / total;
      chords.forEach(c => { c.beats = Math.round(c.beats * scale * 100) / 100; });
    }

    return { chords, cue: '' };
  });
}

// ─── LLM chart generation ─────────────────────────────────────────────────────

async function generateWithLLM(base44, title, artist, reference_file_url) {
  let referenceText = '';
  let fileUrls = [];

  if (reference_file_url) {
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(reference_file_url)) {
      fileUrls = [reference_file_url];
    } else {
      referenceText = await fetch(reference_file_url).then(r => r.text());
    }
  }

  const prompt = `You are an expert session musician and music theorist. Your task is to transcribe the complete, accurate chord progression for "${title}" by ${artist || 'Unknown'}.

${referenceText ? `### REFERENCE MATERIAL:\n${referenceText}\n\n` : ''}

### STRICT REQUIREMENTS:
1. **NO TRUNCATION:** You must chart the ENTIRE song from start to finish. Do not summarize or skip repeating sections. Every single bar of the recorded song must be listed sequentially.
2. **ONE BAR PER PIPE SEGMENT:** In the chord_string, each "|"-separated segment represents exactly one bar/measure. If the same chord lasts 4 bars, write it 4 times separated by pipes: "G | G | G | G". Never collapse multiple bars into one segment.
3. **SPLIT BARS:** If two chords share a single bar, put both chords space-separated in that segment: "G F#7" means G and F#7 share one bar equally. Use "G*2 F#7*2" to be explicit about beat counts when unequal.
4. **SECTION LABELS:** Use ONLY these labels: Intro, Verse, Pre, Chorus, Bridge, Instrumental Solo, Outro. You may append numbers if needed (e.g., Verse 1, Verse 2).
5. **ACCURACY:** Do not guess. Research the real progression and rely on the actual studio recording's structure.

### REQUIRED JSON SCHEMA (EXAMPLE ONLY — DO NOT COPY. A 12-bar blues in G):
{
  "_structural_plan": "Intro -> Verse 1 -> Verse 2 -> Outro",
  "key": "G",
  "time_signature": "4/4",
  "sections": [
    {
      "label": "Verse 1",
      "repeat_count": 1,
      "arrangement_cue": "",
      "chord_string": "G7 | G7 | G7 | G7 | C7 | C7 | G7 | G7 | D7 | C7 | G7 | D7"
    },
    {
      "label": "Outro",
      "repeat_count": 1,
      "arrangement_cue": "",
      "chord_string": "G7 | G7 | G7 G7*2 D7*2"
    }
  ]
}

Begin your complete transcription for "${title}" by ${artist || 'Unknown'}:`;

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
    required: ["_structural_plan", "key", "time_signature", "sections"]
  };

  let response;
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`LLM attempt ${attempt}/${maxAttempts}`);
      response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        file_urls: fileUrls.length > 0 ? fileUrls : undefined,
        response_json_schema: schema
      });
      if (response?.sections?.length) break;
      console.warn(`Attempt ${attempt}: LLM returned no sections, retrying...`);
    } catch (error) {
      console.error(`Attempt ${attempt} error: ${error.message}`);
      if (attempt === maxAttempts) throw new Error(`Failed to generate chart after ${maxAttempts} attempts: ${error.message}`);
    }
  }

  if (!response?.sections?.length) {
    throw new Error('Unable to generate a chart for this song after multiple attempts. Please try again, or upload a reference file to improve accuracy.');
  }

  // Convert each section's chord_string → measures array
  const tsMatch = (response.time_signature || '4/4').match(/^(\d+)/);
  const beatsPerMeasure = tsMatch ? parseInt(tsMatch[1], 10) : 4;

  const sections = response.sections.map(section => ({
    label: section.label,
    repeat_count: Number(section.repeat_count) || 1,
    arrangement_cue: section.arrangement_cue || '',
    measures: chordStringToMeasures(section.chord_string || '', beatsPerMeasure)
  }));

  const built = { key: response.key || 'C', time_signature: response.time_signature || '4/4', sections };

  const completenessCheck = validateChartOutput(built);
  if (!completenessCheck.valid) {
    throw new Error(`Chart validation failed: ${completenessCheck.reason}`);
  }

  return built;
}

// ─── Output Validation ─────────────────────────────────────────────────────────

function validateChartOutput(chartData) {
  if (!chartData || typeof chartData !== 'object') {
    return { valid: false, reason: 'Output is not a valid JSON object' };
  }

  const sections = chartData.sections;
  if (!Array.isArray(sections) || sections.length < 1) {
    return { valid: false, reason: 'No sections generated or sections is not an array' };
  }
  
  if (sections.length > 20) {
    return { valid: false, reason: 'Too many sections (likely fragmented or looping)' };
  }

  const tsMatch = (chartData.time_signature || "").match(/^(\d+)\/\d+$/);
  const expectedBeats = tsMatch ? parseInt(tsMatch[1], 10) : null;

  const uniqueChords = new Set();
  let totalMeasures = 0;
  let totalChords = 0;
  
  for (let s = 0; s < sections.length; s++) {
    const section = sections[s];
    const measures = section.measures || [];
    totalMeasures += measures.length;
    
    for (let m = 0; m < measures.length; m++) {
      const measure = measures[m];
      const chords = measure.chords || [];
      let measureBeats = 0;
      
      for (const chordObj of chords) {
        if (chordObj.chord && chordObj.chord !== '-') {
          uniqueChords.add(chordObj.chord);
          totalChords++;
        }
        if (typeof chordObj.beats === 'number') {
          measureBeats += chordObj.beats;
        }
      }

      if (expectedBeats && measureBeats !== expectedBeats) {
        return { 
          valid: false, 
          reason: `Beat math failed in ${section.label || 'Section'} (Measure ${m + 1}). Expected ${expectedBeats} beats, got ${measureBeats}.` 
        };
      }
    }
  }

  console.log(`Validation: ${sections.length} sections, ${totalMeasures} measures, ${totalChords} chords, ${uniqueChords.size} unique`);

  if (totalMeasures < 4) {
    return { valid: false, reason: 'Suspiciously low measure count. Likely truncated.' };
  }
  if (totalChords < 1) {
    return { valid: false, reason: 'No chords generated' };
  }

  const expectedMaxChords = Math.ceil(totalMeasures / 2) + 15;
  if (uniqueChords.size > expectedMaxChords && uniqueChords.size > 50) {
    return { 
      valid: false, 
      reason: `Unusually high chord density (${uniqueChords.size} unique chords), likely hallucination.` 
    };
  }

  return { 
    valid: true, 
    uniqueChords: uniqueChords.size, 
    totalMeasures, 
    totalChords 
  };
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, artist, key, time_signature, reference_file_url } = await req.json();
    if (!title) return Response.json({ error: 'Title is required' }, { status: 400 });

    // ── Generate via LLM ──────────────────────────────────────────────────────
    const llm = await generateWithLLM(base44, title, artist, reference_file_url);
    if (!llm.sections?.length) return Response.json({ error: 'Failed to generate chart' }, { status: 500 });

    const validation = validateChartOutput(llm);
    if (!validation.valid) {
      console.log('LLM output validation failed:', validation.reason);
      return Response.json({ error: `Chart validation failed: ${validation.reason}. Please try again or provide a reference.` }, { status: 400 });
    }

    let chartData = {
      title,
      artist: artist || 'Unknown',
      key: key || llm.key,
      time_signature: time_signature || llm.time_signature,
      reference_file_url,
      data_source: 'llm'
    };
    let sectionsData = llm.sections;

    // ── Step 3: Sanitize symbols only — preserve multi-chord measures as-is ───
    const VALID_SYMBOLS = ["diamond", "marcato", "push", "pull", "fermata", "bass_up", "bass_down"];

    sectionsData = sectionsData.map(section => ({
      ...section,
      repeat_count: Number(section.repeat_count) || 1,
      arrangement_cue: section.arrangement_cue || '',
      measures: (section.measures || []).map(measure => ({
        chords: (measure.chords || []).map(c => ({
          chord: c.chord || '-',
          beats: Number(c.beats) || 4,
          symbols: Array.isArray(c.symbols) ? c.symbols.filter(s => VALID_SYMBOLS.includes(s)) : []
        })),
        cue: measure.cue || ''
      }))
    }));

    return Response.json({
      success: true,
      source: dataSource,
      message: dataSource === 'chordonomicon' ? 'Chart sourced from Chordonomicon' : 'Chart generated using AI',
      chartData,
      sectionsData
    });

  } catch (error) {
    console.error('generateChartAI error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});