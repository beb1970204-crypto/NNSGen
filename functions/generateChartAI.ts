import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';
import { Key, Chord } from 'npm:tonal@6.0.1';

// Helper: Clean title for better Chordonomicon matching
function cleanTitle(title) {
  return title
    .split(' - ')[0]
    .replace(/\s*\(.*?(remaster|mix|live|version|edit|deluxe|feat|ft\.).*?\)/gi, '')
    .replace(/\s*\[.*?\]/g, '')
    .trim();
}

// Helper: Search Spotify, return top 5 tracks
async function searchSpotify(title, artist) {
  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error('Spotify API credentials not configured');
  }

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
    },
    body: 'grant_type=client_credentials'
  });

  if (!tokenResponse.ok) throw new Error('Failed to authenticate with Spotify');

  const { access_token } = await tokenResponse.json();

  const searchQuery = artist ? `track:${title} artist:${artist}` : `track:${title}`;
  const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=5`;

  const searchResponse = await fetch(searchUrl, {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });

  if (!searchResponse.ok) throw new Error('Failed to search Spotify');

  const searchData = await searchResponse.json();

  if (!searchData.tracks?.items?.length) return [];

  return searchData.tracks.items.map(track => ({
    spotify_song_id: track.id,
    spotify_artist_id: track.artists[0]?.id,
    title: track.name,
    artist: track.artists[0]?.name,
    release_date: track.album?.release_date
  }));
}

// Helper: Query Chordonomicon with flexible criteria
async function fetchChordonomiconData(params) {
  const { spotify_song_id, spotify_artist_id, title, artist, titleOnly } = params;
  const hfToken = Deno.env.get("HUGGINGFACE_API_TOKEN");

  let whereClause;

  if (spotify_song_id) {
    whereClause = `"spotify_song_id"='${spotify_song_id.replace(/'/g, "''")}'`;
    if (spotify_artist_id) {
      whereClause += ` AND "spotify_artist_id"='${spotify_artist_id.replace(/'/g, "''")}'`;
    }
  } else if (title && artist && !titleOnly) {
    const cleaned = cleanTitle(title).replace(/'/g, "''");
    whereClause = `"title"='${cleaned}' AND "artist"='${artist.replace(/'/g, "''")}'`;
  } else if (title) {
    const cleaned = cleanTitle(title).replace(/'/g, "''");
    whereClause = `"title"='${cleaned}'`;
  } else {
    return null;
  }

  const filterUrl = `https://datasets-server.huggingface.co/filter?dataset=ailsntua/Chordonomicon&config=default&split=train&where=${encodeURIComponent(whereClause)}&offset=0&length=1`;

  const headers = { 'Accept': 'application/json' };
  if (hfToken) headers['Authorization'] = `Bearer ${hfToken}`;

  const response = await fetch(filterUrl, { headers });

  if (!response.ok) {
    if (response.status === 500 || response.status === 422) return null;
    throw new Error(`Hugging Face API error: ${response.status}`);
  }

  const data = await response.json();
  if (!data.rows?.length) return null;

  const rowData = data.rows[0].row;
  if (!rowData.chords) return null;

  return {
    chart_data: {
      spotify_song_id: rowData.spotify_song_id,
      spotify_artist_id: rowData.spotify_artist_id,
      genres: rowData.genres,
      release_date: rowData.release_date,
      decade: rowData.decade
    },
    sections: parseChordProgressionToSections(rowData.chords)
  };
}

// Normalize LLM key output to a clean enum value
// e.g. "A major" → "A", "F# minor" → "F#m", "Bb" → "Bb"
function normalizeKey(rawKey) {
  if (!rawKey) return 'C';
  let k = rawKey.trim();
  // Replace written-out "minor" / "major"
  k = k.replace(/\s+major$/i, '').replace(/\s+minor$/i, 'm');
  // Collapse spaces (e.g. "F# m" → "F#m")
  k = k.replace(/\s+/g, '');
  // Capitalize root note
  k = k.charAt(0).toUpperCase() + k.slice(1);
  return k;
}

// Helper: Generate chart with LLM — key/time_sig are optional, LLM detects them
async function generateChartWithLLM(base44, title, artist, key, time_signature, reference_file_url) {
  let referenceText = '';
  let fileUrls = [];

  if (reference_file_url) {
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(reference_file_url);
    if (isImage) {
      fileUrls = [reference_file_url];
    } else {
      const fileResponse = await fetch(reference_file_url);
      referenceText = await fileResponse.text();
    }
  }

  const keyNote = key || 'Determine from your knowledge of this song';
  const timeSigNote = time_signature || 'Determine from your knowledge of this song';

  const prompt = `You are a professional music chart transcription assistant.

Task: Create an accurate standard chord chart for the following song.

Song Details:
- Title: ${title}
- Artist: ${artist || 'Unknown'}
- Key: ${keyNote}
- Time Signature: ${timeSigNote}

${referenceText ? `Reference Material (use this as the primary source):\n${referenceText}\n` : `Use your knowledge of the actual song "${title}" by ${artist || 'the artist'} to produce accurate chords.`}

Instructions:
1. Output the correct key and time signature for this song
2. Identify all sections: Intro, Verse, Pre, Chorus, Bridge, Instrumental Solo, Outro
3. Use standard chord notation ONLY — letter names with quality suffixes (e.g., C, Dm7, F/G, Gsus4, Bbmaj7)
4. Do NOT use Roman numerals, Nashville numbers, or any other notation system
5. Each measure should contain the chord(s) that fall in that bar
6. Be faithful to the actual song's chord progression`;

  const response = await base44.integrations.Core.InvokeLLM({
    prompt,
    file_urls: fileUrls.length > 0 ? fileUrls : undefined,
    response_json_schema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Musical key (e.g., G, Am, Bb)" },
        time_signature: { type: "string", description: "Time signature (e.g., 4/4, 3/4)" },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: {
                type: "string",
                enum: ["Intro", "Verse", "Pre", "Chorus", "Bridge", "Instrumental Solo", "Outro"]
              },
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
                          beats: { type: "number" },
                          symbols: { type: "array", items: { type: "string" } }
                        },
                        required: ["chord", "beats", "symbols"]
                      }
                    },
                    cue: { type: "string" }
                  },
                  required: ["chords"]
                }
              },
              repeat_count: { type: "number" },
              arrangement_cue: { type: "string" }
            },
            required: ["label", "measures"]
          }
        }
      },
      required: ["key", "time_signature", "sections"]
    }
  });

  return response;
}

// Helper: Parse Chordonomicon chord string into sections
function parseChordProgressionToSections(chordsString) {
  const sections = [];
  const sectionPattern = /<([a-zA-Z]+)(?:_(\d+))?>/g;

  const firstTagMatch = sectionPattern.exec(chordsString);
  if (firstTagMatch && firstTagMatch.index > 0) {
    const introChords = chordsString.substring(0, firstTagMatch.index).trim();
    if (introChords) sections.push(createSection('Intro', introChords));
  }

  sectionPattern.lastIndex = 0;
  const parts = chordsString.split(sectionPattern);

  for (let i = 1; i < parts.length; i += 3) {
    const type = parts[i];
    const content = parts[i + 2];
    if (content && content.trim()) {
      sections.push(createSection(mapLabel(type), content));
    }
  }

  if (sections.length === 0 && chordsString.trim()) {
    sections.push(createSection('Verse', chordsString));
  }

  return sections;
}

function mapLabel(type) {
  const labelMap = {
    'intro': 'Intro', 'verse': 'Verse', 'pre': 'Pre', 'prechorus': 'Pre',
    'chorus': 'Chorus', 'bridge': 'Bridge', 'solo': 'Instrumental Solo',
    'instrumental': 'Instrumental Solo', 'interlude': 'Instrumental Solo', 'outro': 'Outro'
  };
  return labelMap[type.toLowerCase()] || 'Verse';
}

function createSection(label, chordsText) {
  const chordArray = chordsText.split(/\s+/).filter(c => c && c.trim());
  const measures = chordArray.map(chord => ({
    chords: [{ chord: normalizeChordName(chord), beats: 4, symbols: [] }],
    cue: ''
  }));
  return { label, measures, repeat_count: 1, arrangement_cue: '' };
}

// Convert Chordonomicon colon-notation to standard chord names
// e.g. C:maj → C, A:min → Am, G:7 → G7, D:min7 → Dm7, B:hdim7 → Bm7b5
function normalizeChordName(chord) {
  if (!chord || chord === '-' || chord === 'N' || chord === 'X') return '-';

  // Remove octave numbers appended (e.g. "C:maj/3" keep root/bass only)
  // Handle slash chords first
  let slashPart = '';
  const slashIdx = chord.indexOf('/');
  if (slashIdx !== -1) {
    slashPart = '/' + chord.slice(slashIdx + 1).replace(/:\w+$/, '');
    chord = chord.slice(0, slashIdx);
  }

  if (!chord.includes(':')) {
    // Already standard notation — just clean up
    return chord.replace(/min(?!or)/, 'm').replace(/no3(?:rd)?/i, '5') + slashPart;
  }

  const [root, quality] = chord.split(':');
  if (!root) return '-';

  const qualityMap = {
    'maj':    '',
    'min':    'm',
    '':       '',
    '5':      '5',
    '7':      '7',
    'maj7':   'maj7',
    'min7':   'm7',
    'minmaj7':'mmaj7',
    'maj6':   'maj6',
    'min6':   'm6',
    '6':      '6',
    '9':      '9',
    'maj9':   'maj9',
    'min9':   'm9',
    '11':     '11',
    'maj11':  'maj11',
    'min11':  'm11',
    '13':     '13',
    'maj13':  'maj13',
    'min13':  'm13',
    'dim':    'dim',
    'dim7':   'dim7',
    'hdim7':  'm7b5',  // half-diminished
    'aug':    'aug',
    'sus2':   'sus2',
    'sus4':   'sus4',
    '7sus4':  '7sus4',
    'add9':   'add9',
  };

  const suffix = qualityMap[quality] !== undefined ? qualityMap[quality] : (quality || '');
  return root + suffix + slashPart;
}

// ─── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, artist, key, time_signature, reference_file_url } = await req.json();

  if (!title) return Response.json({ error: 'Title is required' }, { status: 400 });

  let chordonomiconData = null;
  let spotifyMatch = null;

  // Step 1: Spotify → iterate top 5 results for Chordonomicon match
  try {
    const spotifyTracks = await searchSpotify(title, artist);
    console.log(`Spotify found ${spotifyTracks.length} tracks`);

    for (const track of spotifyTracks) {
      const result = await fetchChordonomiconData({
        spotify_song_id: track.spotify_song_id,
        spotify_artist_id: track.spotify_artist_id
      });
      if (result) {
        chordonomiconData = result;
        spotifyMatch = track;
        console.log(`Chordonomicon match via Spotify ID: ${track.title}`);
        break;
      }
    }
  } catch (error) {
    console.log('Spotify lookup failed:', error.message);
  }

  // Step 2: Fallback — title + artist
  if (!chordonomiconData) {
    try {
      chordonomiconData = await fetchChordonomiconData({ title, artist });
      if (chordonomiconData) console.log('Chordonomicon match via title + artist');
    } catch (e) {
      console.log('Title+artist lookup failed:', e.message);
    }
  }

  // Step 3: Fallback — title only
  if (!chordonomiconData) {
    try {
      chordonomiconData = await fetchChordonomiconData({ title, titleOnly: true });
      if (chordonomiconData) console.log('Chordonomicon match via title only');
    } catch (e) {
      console.log('Title-only lookup failed:', e.message);
    }
  }

  let chartData, sectionsData, dataSource;

  if (chordonomiconData) {
    dataSource = 'chordonomicon';

    // Use LLM chart generation to also get key + time signature (single LLM call instead of two)
    const songTitle = spotifyMatch?.title || title;
    const songArtist = spotifyMatch?.artist || artist;
    let detectedKey = key || 'C';
    let detectedTimeSig = time_signature || '4/4';

    if (!key || !time_signature) {
      try {
        const llmMeta = await generateChartWithLLM(base44, songTitle, songArtist, key, time_signature, null);
        detectedKey = normalizeKey(key || llmMeta.key || 'C');
        detectedTimeSig = time_signature || llmMeta.time_signature || '4/4';
        console.log(`Key/time from LLM: ${detectedKey} / ${detectedTimeSig}`);
      } catch (e) {
        console.log('Key detection via LLM failed, using defaults:', e.message);
      }
    }

    chartData = {
      title: songTitle,
      artist: songArtist || 'Unknown',
      key: detectedKey,
      time_signature: detectedTimeSig,
      reference_file_url,
      ...chordonomiconData.chart_data
    };
    sectionsData = chordonomiconData.sections;
  } else {
    // Step 4: LLM fallback — detects key/time_sig if not provided
    dataSource = 'llm';
    console.log('Falling back to LLM generation');

    const llmResponse = await generateChartWithLLM(base44, title, artist, key, time_signature, reference_file_url);

    if (!llmResponse.sections) {
      return Response.json({ error: 'Failed to generate chart' }, { status: 500 });
    }

    chartData = {
      title,
      artist: artist || 'Unknown',
      key: normalizeKey(key || llmResponse.key || 'C'),
      time_signature: time_signature || llmResponse.time_signature || '4/4',
      reference_file_url
    };
    sectionsData = llmResponse.sections;
  }

  chartData.data_source = dataSource;

  // Sanitize all section data regardless of source — strip any invalid symbol values
  // (Chordonomicon data can contain chord names or other strings in the symbols array)
  const VALID_SYMBOLS = ["diamond", "marcato", "push", "pull", "fermata", "bass_up", "bass_down"];
  sectionsData = sectionsData.map(section => ({
    ...section,
    repeat_count: Number(section.repeat_count) || 1,
    arrangement_cue: section.arrangement_cue || '',
    measures: (section.measures || []).map(measure => ({
      ...measure,
      cue: measure.cue || '',
      chords: (measure.chords || []).map(chordObj => ({
        chord: chordObj.chord || '-',
        beats: Number(chordObj.beats) || 4,
        symbols: Array.isArray(chordObj.symbols)
          ? chordObj.symbols.filter(s => VALID_SYMBOLS.includes(s))
          : []
      }))
    }))
  }));

  // Return the generated data WITHOUT saving — the frontend will save only when user clicks Save
  return Response.json({
    success: true,
    source: dataSource,
    message: dataSource === 'chordonomicon'
      ? 'Chart generated from Chordonomicon database'
      : 'Chart generated using AI',
    chartData,
    sectionsData
  });
  } catch (error) {
    console.error('generateChartAI error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});