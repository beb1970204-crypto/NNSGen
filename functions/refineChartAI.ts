import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

// ─── Spotify ──────────────────────────────────────────────────────────────────

async function searchSpotify(title, artist) {
  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error('Spotify credentials not configured');

  const { access_token } = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
    },
    body: 'grant_type=client_credentials'
  }).then(r => r.json());

  const q = artist ? `track:${title} artist:${artist}` : `track:${title}`;
  const data = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=5`, {
    headers: { 'Authorization': `Bearer ${access_token}` }
  }).then(r => r.json());

  return (data.tracks?.items || []).map(t => ({
    spotify_song_id: t.id,
    spotify_artist_id: t.artists[0]?.id,
    title: t.name,
    artist: t.artists[0]?.name,
    release_date: t.album?.release_date
  }));
}

// ─── Chordonomicon ────────────────────────────────────────────────────────────

async function fetchChordonomicon(params) {
  const { spotify_song_id, spotify_artist_id, title, artist } = params;
  const hfToken = Deno.env.get("HUGGINGFACE_API_TOKEN");

  let queries = [];
  
  if (spotify_song_id && spotify_artist_id) {
    queries.push(`"spotify_song_id"='${spotify_song_id.replace(/'/g, "''")}'`);
  }
  
  if (title && artist) {
    const cleanTitle = title.split(' - ')[0].replace(/\s*\(.*?\)/g, '').trim().replace(/'/g, "''");
    const cleanArtist = artist.replace(/'/g, "''");
    queries.push(`"title"='${cleanTitle}' AND "artist"='${cleanArtist}'`);
    const titleWords = cleanTitle.split(' ').filter(w => w.length > 2).join('%');
    if (titleWords) {
      queries.push(`"title" LIKE '%${titleWords}%' AND "artist"='${cleanArtist}'`);
    }
    const firstWord = cleanTitle.split(' ')[0];
    if (firstWord && firstWord.length > 2) {
      queries.push(`"title" LIKE '${firstWord}%' AND "artist"='${cleanArtist}'`);
    }
  }

  const headers = { 'Accept': 'application/json' };
  if (hfToken) headers['Authorization'] = `Bearer ${hfToken}`;

  for (const where of queries) {
    try {
      const url = `https://datasets-server.huggingface.co/filter?dataset=ailsntua/Chordonomicon&config=default&split=train&where=${encodeURIComponent(where)}&offset=0&length=1`;
      const res = await fetch(url, { headers });
      if (!res.ok) continue;

      const data = await res.json();
      const row = data.rows?.[0]?.row;
      if (!row?.chords) continue;

      console.log('Chordonomicon hit found');
      return {
        rawChords: row.chords,
        metadata: {
          spotify_song_id: row.spotify_song_id,
          spotify_artist_id: row.spotify_artist_id,
          genres: row.genres,
          release_date: row.release_date,
          decade: row.decade
        }
      };
    } catch (e) {
      continue;
    }
  }

  return null;
}

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

    // Build refinement task — include chart context but structure output instructions clearly
    const currentChartJSON = JSON.stringify(currentSections, null, 2);

    // Refinement prompt — clear input/output separation, no internet needed (already have the chart)
    const prompt = `You are a professional chord chart editor. Refine this existing chart based on user feedback.

CURRENT CHART TO REFINE:
${currentChartJSON}

METADATA:
Song Key: ${key}
Time Signature: ${time_signature}

USER FEEDBACK: "${userFeedback}"

TASK: Apply the user's requested changes to the chart structure. Return the COMPLETE refined chart.

RULES:
- Valid section labels only: Intro, Verse, Pre, Chorus, Bridge, Instrumental Solo, Outro
- Preserve chords and measures unless feedback explicitly requests changes
- Return ONLY the JSON object below — no explanation, no markdown

RESPONSE FORMAT (return this exact structure):
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

    // Step 1: Look up actual song structure online
    const songLookupPrompt = `What is the typical song structure for "${title}" by ${artist}? List the sections in order (e.g., Intro, Verse, Chorus, Bridge, Outro). Be concise.`;
    
    let actualSongStructure = '';
    try {
      const songLookup = await base44.integrations.Core.InvokeLLM({
        prompt: songLookupPrompt,
        add_context_from_internet: true
      });
      actualSongStructure = songLookup;
    } catch (e) {
      console.warn('Song lookup failed, proceeding without internet reference:', e.message);
      actualSongStructure = 'Unable to lookup song structure';
    }

    // Step 2: Refine the chart with actual structure knowledge
    const refinementPrompt = `You are a professional chord chart editor. Refine this existing chart based on user feedback and the actual song structure.

ACTUAL SONG STRUCTURE (from research):
${actualSongStructure}

CURRENT CHART TO REFINE:
${currentChartJSON}

METADATA:
Song Key: ${key}
Time Signature: ${time_signature}

USER FEEDBACK: "${userFeedback}"

TASK: Apply the user's requested changes to align the chart with the actual song structure. Return the COMPLETE refined chart.

RULES:
- Valid section labels only: Intro, Verse, Pre, Chorus, Bridge, Instrumental Solo, Outro
- Preserve chords and measures unless feedback or song structure comparison requires changes
- Return ONLY the JSON object below — no explanation, no markdown

RESPONSE FORMAT (return this exact structure):
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

    let response;
    try {
      response = await base44.integrations.Core.InvokeLLM({
        prompt: refinementPrompt,
        add_context_from_internet: false,
        response_json_schema: schema
      });
    } catch (llmError) {
      console.error('LLM refinement call failed:', llmError.message);
      if (llmError.message && llmError.message.includes('LLM returned invalid JSON')) {
        return Response.json({ 
          error: 'LLM response parsing failed. Please try refining with different feedback or shorter requests.'
        }, { status: 400 });
      }
      throw llmError;
    }

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