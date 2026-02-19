import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';
import { Key } from 'npm:tonal@6.0.1';

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
  
  // Build multiple query variations for aggressive search
  if (spotify_song_id && spotify_artist_id) {
    queries.push(`"spotify_song_id"='${spotify_song_id.replace(/'/g, "''")}'`);
  }
  
  if (title && artist) {
    const cleanTitle = title.split(' - ')[0].replace(/\s*\(.*?\)/g, '').trim().replace(/'/g, "''");
    const cleanArtist = artist.replace(/'/g, "''");
    // Exact match
    queries.push(`"title"='${cleanTitle}' AND "artist"='${cleanArtist}'`);
    // Case-insensitive partial match
    const titleWords = cleanTitle.split(' ').filter(w => w.length > 2).join('%');
    if (titleWords) {
      queries.push(`"title" LIKE '%${titleWords}%' AND "artist"='${cleanArtist}'`);
    }
    // Try just the first significant word
    const firstWord = cleanTitle.split(' ')[0];
    if (firstWord && firstWord.length > 2) {
      queries.push(`"title" LIKE '${firstWord}%' AND "artist"='${cleanArtist}'`);
    }
  }

  const headers = { 'Accept': 'application/json' };
  if (hfToken) headers['Authorization'] = `Bearer ${hfToken}`;

  // Try each query variation
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

// ─── Chordonomicon chord parsing ──────────────────────────────────────────────

// Convert colon-notation to standard chord names: B:min → Bm, F#:7 → F#7
function normalizeChordName(chord) {
  if (!chord || chord === 'N' || chord === 'X') return '-';

  let slash = '';
  const slashIdx = chord.indexOf('/');
  if (slashIdx !== -1) {
    slash = '/' + chord.slice(slashIdx + 1).replace(/:\w+$/, '');
    chord = chord.slice(0, slashIdx);
  }

  if (!chord.includes(':')) return chord + slash;

  const [root, quality] = chord.split(':');
  const qualityMap = {
    'maj': '', 'min': 'm', '': '', '7': '7', 'maj7': 'maj7', 'min7': 'm7',
    'maj6': 'maj6', 'min6': 'm6', '6': '6', '9': '9', 'maj9': 'maj9', 'min9': 'm9',
    'dim': 'dim', 'dim7': 'dim7', 'hdim7': 'm7b5', 'aug': 'aug',
    'sus2': 'sus2', 'sus4': 'sus4', '7sus4': '7sus4', 'add9': 'add9',
    'minmaj7': 'mmaj7', '5': '5', '11': '11', '13': '13',
  };
  const suffix = qualityMap[quality] !== undefined ? qualityMap[quality] : (quality || '');
  return (root + suffix + slash) || '-';
}

// Infer key from a sample of chord tokens using TonalJS — no LLM needed
function inferKeyFromChords(rawChords) {
  const tokens = rawChords.split(/\s+/).filter(Boolean).slice(0, 40);
  const roots = tokens
    .filter(t => t !== 'N' && t !== 'X' && t !== '-')
    .map(t => {
      const [root, quality] = t.split(':');
      return { root, isMinor: quality && (quality.startsWith('min') || quality === 'hdim7') };
    });

  if (!roots.length) return 'C';

  // Tally root note occurrences
  const counts = {};
  for (const { root } of roots) {
    counts[root] = (counts[root] || 0) + 1;
  }

  // First root is typically the tonic in Chordonomicon ordering
  const firstRoot = roots[0].root;
  const firstIsMinor = roots[0].isMinor;

  // Validate with TonalJS
  if (firstIsMinor) {
    const mk = Key.minorKey(firstRoot);
    return mk.tonic ? mk.tonic + 'm' : firstRoot + 'm';
  } else {
    const mk = Key.majorKey(firstRoot);
    return mk.tonic || firstRoot;
  }
}

const SECTION_LABEL_MAP = {
  'intro': 'Intro', 'verse': 'Verse', 'pre': 'Pre', 'prechorus': 'Pre',
  'chorus': 'Chorus', 'bridge': 'Bridge', 'solo': 'Instrumental Solo',
  'instrumental': 'Instrumental Solo', 'interlude': 'Instrumental Solo', 'outro': 'Outro'
};

function parseChordonomiconSections(rawChords, beatsPerBar) {
  const sections = [];
  const parts = rawChords.split(/(<[^>]+>)/);

  let currentLabel = null;
  let currentChords = [];

  const flush = () => {
    if (currentChords.length > 0) {
      sections.push({
        label: currentLabel || 'Verse',
        measures: currentChords.map(chord => ({
          chords: [{ chord, beats: beatsPerBar, symbols: [] }],
          cue: ''
        })),
        repeat_count: 1,
        arrangement_cue: ''
      });
    }
    currentChords = [];
  };

  for (const part of parts) {
    if (part.startsWith('<')) {
      flush();
      const tag = part.replace(/[<>]/g, '').split('_')[0].toLowerCase();
      currentLabel = SECTION_LABEL_MAP[tag] || 'Verse';
    } else {
      const chords = part.trim().split(/\s+/).filter(Boolean).map(normalizeChordName);
      currentChords.push(...chords);
    }
  }
  flush();

  return sections;
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

  // SINGLE OPTIMIZED PROMPT for consistency — no retry variations
  const prompt = `You are a professional chord transcriber. Transcribe "${title}" by ${artist || 'Unknown'} with COMPLETE song structure.

CRITICAL REQUIREMENTS:
1. Return a COMPLETE chart: Verse + Chorus are MANDATORY. Include Intro/Outro/Bridge as appropriate for the song.
2. Use ONLY these section labels: Intro, Verse, Pre, Chorus, Bridge, Instrumental Solo, Outro
3. Chart the ENTIRE song structure naturally — do not truncate or summarize
4. Measures may contain 1 or more chords; beats must sum to the time signature
5. All chords must be musically coherent and diatonic where possible
6. Return ONLY valid JSON, no explanation

${referenceText ? `REFERENCE MATERIAL PROVIDED:\n${referenceText}\n` : ''}

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

  // Try with internet context first; fall back to without if the search model returns invalid JSON
  let response = null;
  let lastError = null;
  for (const useInternet of [true, false]) {
    try {
      console.log(`LLM attempt with add_context_from_internet=${useInternet}`);
      response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: useInternet,
        file_urls: fileUrls.length > 0 ? fileUrls : undefined,
        response_json_schema: schema
      });
      if (response?.sections?.length) break;
      lastError = new Error('LLM returned no sections');
    } catch (error) {
      console.error(`LLM attempt failed (internet=${useInternet}):`, error.message);
      lastError = error;
      // Only retry on JSON parse errors — other errors are fatal
      if (!error.message?.includes('invalid JSON') && !error.message?.includes('JSON')) break;
    }
  }

  if (!response?.sections?.length) {
    const msg = lastError?.message || 'LLM returned no sections';
    console.error('LLM generation error:', msg);
    throw new Error(`Chart generation failed: ${msg}`);
  }

  // Resolve key with TonalJS
  const tonic = response.key_tonic || 'C';
  const isMinor = response.key_mode === 'minor';
  let key;
  if (isMinor) {
    const mk = Key.minorKey(tonic);
    key = (mk.tonic || tonic) + 'm';
  } else {
    const mk = Key.majorKey(tonic);
    key = mk.tonic || tonic;
  }

  return { key, time_signature: response.time_signature || '4/4', sections: response.sections };
}

// ─── Output Validation ─────────────────────────────────────────────────────────

function validateChartOutput(sections) {
  // Check section count (need at least 1)
  if (!sections || sections.length < 1) {
    console.log(`Validation failed: Only ${sections?.length || 0} sections (need at least 1)`);
    return { valid: false, reason: 'No sections generated' };
  }
  if (sections.length > 10) {
    return { valid: false, reason: 'Too many sections (likely fragmented)' };
  }

  // Check for completeness: must have Verse + Chorus at minimum
  const labels = sections.map(s => s.label);
  const hasVerse = labels.includes('Verse');
  const hasChorus = labels.includes('Chorus');
  
  if (!hasVerse || !hasChorus) {
    return { valid: false, reason: `Incomplete song structure. Found: ${labels.join(', ')}. Need at minimum: Verse + Chorus` };
  }

  // Check chord complexity across all sections
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



  console.log(`Validation: ${sections.length} sections, ${totalMeasures} measures, ${totalChords} chords, ${uniqueChords.size} unique`);

  // Warn but don't reject if unusual: too few chords (possibly valid, like "All Blues")
  if (totalChords < 4) {
    console.log(`Warning: Very few chords (${totalChords}), may be valid but check manually`);
  }

  // Flag hallucination: proportional to song length. Jazz/prog songs legitimately have 15-20+ chords.
  const expectedMaxChords = Math.ceil(totalMeasures / 2) + 10;
  if (uniqueChords.size > expectedMaxChords && uniqueChords.size > 25) {
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

    const { title, artist, key, time_signature, reference_file_url } = await req.json();
    if (!title) return Response.json({ error: 'Title is required' }, { status: 400 });

    // ── Step 1: Try Chordonomicon (via Spotify ID, then title+artist) ──────────
    let chordonomiconData = null;
    let spotifyMatch = null;

    try {
      const tracks = await searchSpotify(title, artist);
      console.log(`Spotify found ${tracks.length} tracks`);
      for (const track of tracks) {
        const result = await fetchChordonomicon({ spotify_song_id: track.spotify_song_id, spotify_artist_id: track.spotify_artist_id });
        if (result) { chordonomiconData = result; spotifyMatch = track; break; }
      }
    } catch (e) {
      console.log('Spotify/Chordonomicon lookup failed:', e.message);
    }

    if (!chordonomiconData) {
      try {
        chordonomiconData = await fetchChordonomicon({ title, artist });
      } catch (e) {
        console.log('Title+artist lookup failed:', e.message);
      }
    }

    // ── Step 2a: Chordonomicon hit — parse chords, infer key, no LLM needed ───
    let chartData, sectionsData, dataSource;

    if (chordonomiconData) {
      dataSource = 'chordonomicon';
      console.log('Using Chordonomicon data');

      let resolvedKey = key || inferKeyFromChords(chordonomiconData.rawChords);
      // Validate key is not a Chordonomicon tag (e.g., <verse_1>)
      if (resolvedKey.startsWith('<') || resolvedKey.endsWith('>')) {
        console.warn(`Invalid key parsed: ${resolvedKey}, falling back to C`);
        resolvedKey = 'C';
      }
      const resolvedTimeSig = time_signature || '4/4';
      const beatsPerBar = parseInt(resolvedTimeSig.split('/')[0]) || 4;

      chartData = {
        title: spotifyMatch?.title || title,
        artist: spotifyMatch?.artist || artist || 'Unknown',
        key: resolvedKey,
        time_signature: resolvedTimeSig,
        reference_file_url,
        ...chordonomiconData.metadata
      };
      sectionsData = parseChordonomiconSections(chordonomiconData.rawChords, beatsPerBar);

    } else {
      // ── Step 2b: LLM fallback with validation ────────────────────────────
      dataSource = 'llm';
      console.log('Falling back to LLM generation');

      const llm = await generateWithLLM(base44, title, artist, reference_file_url);
      if (!llm.sections?.length) return Response.json({ error: 'Failed to generate chart' }, { status: 500 });

      // Validate LLM output
      const validation = validateChartOutput(llm.sections);
      if (!validation.valid) {
        console.log('LLM output validation failed:', validation.reason);
        return Response.json({ error: `Chart validation failed: ${validation.reason}. Please try again or provide a reference.` }, { status: 400 });
      }

      chartData = {
        title,
        artist: artist || 'Unknown',
        key: key || llm.key,
        time_signature: time_signature || llm.time_signature,
        reference_file_url
      };
      sectionsData = llm.sections;
    }

    chartData.data_source = dataSource;

    // ── Step 3: Expand multi-chord measures into separate measures ──────────────
    const VALID_SYMBOLS = ["diamond", "marcato", "push", "pull", "fermata", "bass_up", "bass_down"];
    const beatsPerMeasure = parseInt((chartData.time_signature || '4/4').split('/')[0]) || 4;

    sectionsData = sectionsData.map(section => ({
      ...section,
      repeat_count: Number(section.repeat_count) || 1,
      arrangement_cue: section.arrangement_cue || '',
      measures: (section.measures || []).flatMap(measure => {
        const chords = (measure.chords || []).map(c => ({
          chord: c.chord || '-',
          beats: Number(c.beats) || 4,
          symbols: Array.isArray(c.symbols) ? c.symbols.filter(s => VALID_SYMBOLS.includes(s)) : []
        }));

        // If measure has multiple chords OR chord beats don't match measure size, expand
        if (chords.length === 1 && chords[0].beats === beatsPerMeasure) {
          // Single chord that fills the measure — keep as is
          return [{ chords, cue: measure.cue || '' }];
        } else {
          // Multiple chords or partial measure — split into separate measures (1 chord per measure)
          return chords.map((c, idx) => ({
            chords: [{ ...c, beats: beatsPerMeasure }],
            cue: idx === 0 ? (measure.cue || '') : ''
          }));
        }
      })
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