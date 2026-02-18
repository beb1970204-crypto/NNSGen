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

  let where;
  if (spotify_song_id) {
    where = `"spotify_song_id"='${spotify_song_id.replace(/'/g, "''")}'`;
    if (spotify_artist_id) where += ` AND "spotify_artist_id"='${spotify_artist_id.replace(/'/g, "''")}'`;
  } else if (title && artist) {
    const t = title.split(' - ')[0].replace(/\s*\(.*?\)/g, '').trim().replace(/'/g, "''");
    where = `"title"='${t}' AND "artist"='${artist.replace(/'/g, "''")}'`;
  } else {
    return null;
  }

  const url = `https://datasets-server.huggingface.co/filter?dataset=ailsntua/Chordonomicon&config=default&split=train&where=${encodeURIComponent(where)}&offset=0&length=1`;
  const headers = { 'Accept': 'application/json' };
  if (hfToken) headers['Authorization'] = `Bearer ${hfToken}`;

  const res = await fetch(url, { headers });
  if (!res.ok) return null;

  const data = await res.json();
  const row = data.rows?.[0]?.row;
  if (!row?.chords) return null;

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

  const prompt = `You are a professional musician. Generate an accurate chord chart for:

Song: "${title}" by ${artist || 'Unknown'}
${referenceText ? `\nReference material:\n${referenceText}\n` : ''}

Rules:
- Each measure = one object in the measures array
- All chord beats within one measure must sum to the time signature's top number
- Use standard chord names: Bm, Em7, F#7, Gmaj7, etc.
- key_tonic = root note only (e.g. "G", not "Gm")
- Section labels must be exactly one of: Intro, Verse, Pre, Chorus, Bridge, Instrumental Solo, Outro

Example output:
{
  "key_tonic": "G",
  "key_mode": "major",
  "time_signature": "4/4",
  "sections": [
    {
      "label": "Verse",
      "repeat_count": 1,
      "measures": [
        {"chords": [{"chord": "G", "beats": 4}], "cue": ""},
        {"chords": [{"chord": "C", "beats": 2}, {"chord": "D", "beats": 2}], "cue": ""}
      ]
    }
  ]
}`;

  // Simplified schema — no nested symbols array which can cause JSON parse failures
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

  // Try without internet first (better output capacity), fall back to internet if empty
  let response = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: false,
    file_urls: fileUrls.length > 0 ? fileUrls : undefined,
    response_json_schema: schema
  });

  if (!response?.sections?.length || response.sections.length < 2) {
    console.log('First LLM call returned insufficient sections, retrying with internet context');
    response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      file_urls: fileUrls.length > 0 ? fileUrls : undefined,
      response_json_schema: schema
    });
  }

  if (!response?.sections?.length) {
    throw new Error('LLM returned no sections');
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

      const resolvedKey = key || inferKeyFromChords(chordonomiconData.rawChords);
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
      // ── Step 2b: LLM fallback ─────────────────────────────────────────────
      dataSource = 'llm';
      console.log('Falling back to LLM generation');

      const llm = await generateWithLLM(base44, title, artist, reference_file_url);
      if (!llm.sections?.length) return Response.json({ error: 'Failed to generate chart' }, { status: 500 });

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

    // ── Step 3: Light sanitization — symbols only, no beat manipulation ───────
    const VALID_SYMBOLS = ["diamond", "marcato", "push", "pull", "fermata", "bass_up", "bass_down"];
    sectionsData = sectionsData.map(section => ({
      ...section,
      repeat_count: Number(section.repeat_count) || 1,
      arrangement_cue: section.arrangement_cue || '',
      measures: (section.measures || []).map(measure => ({
        ...measure,
        cue: measure.cue || '',
        chords: (measure.chords || []).map(c => ({
          chord: c.chord || '-',
          beats: Number(c.beats) || 4,
          symbols: Array.isArray(c.symbols) ? c.symbols.filter(s => VALID_SYMBOLS.includes(s)) : []
        }))
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