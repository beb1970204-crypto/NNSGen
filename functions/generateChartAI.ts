import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

// Helper: Search for song on Spotify
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

  if (!tokenResponse.ok) {
    throw new Error('Failed to authenticate with Spotify');
  }

  const { access_token } = await tokenResponse.json();

  const searchQuery = artist 
    ? `track:${title} artist:${artist}`
    : `track:${title}`;
  
  const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=5`;
  
  const searchResponse = await fetch(searchUrl, {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });

  if (!searchResponse.ok) {
    throw new Error('Failed to search Spotify');
  }

  const searchData = await searchResponse.json();

  if (!searchData.tracks?.items || searchData.tracks.items.length === 0) {
    return null;
  }

  const track = searchData.tracks.items[0];
  return {
    spotify_song_id: track.id,
    spotify_artist_id: track.artists[0]?.id,
    title: track.name,
    artist: track.artists[0]?.name,
    album: track.album?.name,
    release_date: track.album?.release_date
  };
}

// Helper: Fetch data from Chordonomicon
async function fetchChordonomiconData(spotify_song_id, spotify_artist_id, title, artist) {
  const hfToken = Deno.env.get("HUGGINGFACE_API_TOKEN");
  
  let whereClause;
  
  if (spotify_song_id) {
    const sanitizedSongId = spotify_song_id.replace(/'/g, "''");
    const sanitizedArtistId = spotify_artist_id ? spotify_artist_id.replace(/'/g, "''") : null;
    
    whereClause = `"spotify_song_id"='${sanitizedSongId}'`;
    if (sanitizedArtistId) {
      whereClause += ` AND "spotify_artist_id"='${sanitizedArtistId}'`;
    }
  } else if (title && artist) {
    const cleanTitle = title.split(' - ')[0].replace(/\s*\(.*(remaster|mix|live|version|edit|deluxe).*\)/i, '').trim();
    const sanitizedTitle = cleanTitle.replace(/'/g, "''");
    const sanitizedArtist = artist.replace(/'/g, "''");
    
    whereClause = `"title"='${sanitizedTitle}' AND "artist"='${sanitizedArtist}'`;
  } else {
    throw new Error('Insufficient search criteria');
  }

  const filterUrl = `https://datasets-server.huggingface.co/filter?dataset=ailsntua/Chordonomicon&config=default&split=train&where=${encodeURIComponent(whereClause)}&offset=0&length=1`;
  
  const headers = { 'Accept': 'application/json' };
  if (hfToken) {
    headers['Authorization'] = `Bearer ${hfToken}`;
  }

  const response = await fetch(filterUrl, { headers });

  if (!response.ok) {
    if (response.status === 500 || response.status === 422) {
      return null;
    }
    throw new Error(`Hugging Face API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.rows || data.rows.length === 0) {
    return null;
  }

  const rowData = data.rows[0].row;
  const chordsString = rowData.chords;
  
  if (!chordsString) {
    return null;
  }

  const sections = parseChordProgressionToSections(chordsString);

  return {
    chart_data: {
      spotify_song_id: rowData.spotify_song_id,
      spotify_artist_id: rowData.spotify_artist_id,
      genres: rowData.genres,
      release_date: rowData.release_date,
      decade: rowData.decade
    },
    sections: sections
  };
}

// Helper: Generate chart with LLM
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

  const prompt = `You are a professional music chart transcription assistant specializing in Nashville Number System (NNS) charts.

Task: Convert the following song information into a structured chord chart with sections and measures.

Song Details:
- Title: ${title}
- Artist: ${artist || 'Unknown'}
- Key: ${key}
- Time Signature: ${time_signature}

${referenceText ? `Reference Material (chord chart or lyrics with chords):\n${referenceText}\n` : ''}

Instructions:
1. Analyze the song structure and identify sections (Intro, Verse, Pre, Chorus, Bridge, Instrumental Solo, Outro)
2. For each section, create measures with chord progressions
3. Each measure should contain chords that fit the ${time_signature} time signature
4. If no reference material is provided, create a basic structure with common chord progressions in the key of ${key}
5. Use standard chord notation (e.g., C, Dm7, F/G, Gsus4)
6. Keep it simple and playable for musicians

Output Format:
- Return an array of sections
- Each section has: label, measures array, repeat_count (default 1), arrangement_cue (optional)
- Each measure has: chords array with {chord, beats, symbols[]}
- Ensure beats add up to the time signature (e.g., 4 beats for 4/4)

${!referenceText ? `
Since no reference material was provided, create a basic song structure:
- Intro (2-4 measures)
- Verse (4-8 measures) 
- Chorus (4-8 measures)
- Bridge (4 measures)
- Outro (2-4 measures)

Use common chord progressions appropriate for the key of ${key}.
` : ''}`;

  const response = await base44.integrations.Core.InvokeLLM({
    prompt,
    file_urls: fileUrls.length > 0 ? fileUrls : undefined,
    response_json_schema: {
      type: "object",
      properties: {
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
      required: ["sections"]
    }
  });

  if (response.sections) {
    response.sections = response.sections.map(section => ({
      ...section,
      repeat_count: Number(section.repeat_count) || 1,
      arrangement_cue: section.arrangement_cue || '',
      measures: section.measures?.map(measure => ({
        ...measure,
        cue: measure.cue || '',
        chords: measure.chords?.map(chordObj => ({
          ...chordObj,
          beats: Number(chordObj.beats) || 4,
          symbols: Array.isArray(chordObj.symbols) ? chordObj.symbols : []
        }))
      }))
    }));
  }

  return response;
}

// Helper: Parse chord progression to sections
function parseChordProgressionToSections(chordsString) {
  const sections = [];
  const sectionPattern = /<([a-zA-Z]+)(?:_(\d+))?>/g;
  
  const firstTagMatch = sectionPattern.exec(chordsString);
  if (firstTagMatch && firstTagMatch.index > 0) {
    const introChords = chordsString.substring(0, firstTagMatch.index).trim();
    if (introChords) {
      sections.push(createSection('Intro', introChords));
    }
  }
  
  sectionPattern.lastIndex = 0;
  const parts = chordsString.split(sectionPattern);
  
  for (let i = 1; i < parts.length; i += 3) {
    const type = parts[i];
    const content = parts[i + 2];
    
    if (content && content.trim()) {
      const label = mapLabel(type);
      sections.push(createSection(label, content));
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
  const measures = [];
  const chordsPerMeasure = 4;
  
  for (let j = 0; j < chordArray.length; j += chordsPerMeasure) {
    const measureChords = chordArray.slice(j, j + chordsPerMeasure);
    const beatsPerChord = 4 / measureChords.length;
    
    measures.push({
      chords: measureChords.map(chord => ({
        chord: normalizeChordName(chord),
        beats: beatsPerChord,
        symbols: []
      })),
      cue: ''
    });
  }
  
  return { label, measures, repeat_count: 1, arrangement_cue: '' };
}

function normalizeChordName(chord) {
  if (!chord || chord === '-') return '-';
  return chord.replace(/min$/, 'm').replace(/maj/, 'maj').replace(/no3(?:rd)?/i, '5');
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, artist, key, time_signature, reference_file_url } = await req.json();

  if (!title) {
    return Response.json({ error: 'Title is required' }, { status: 400 });
  }

  let spotifyData = null;
  try {
    spotifyData = await searchSpotify(title, artist);
  } catch (error) {
    console.log('Spotify search failed:', error.message);
  }

  let chartData = null;
  let sectionsData = null;
  let dataSource = 'chordonomicon';

  if (spotifyData) {
    try {
      let chordonomiconData = await fetchChordonomiconData(spotifyData.spotify_song_id, spotifyData.spotify_artist_id);

      if (!chordonomiconData) {
        console.log('Spotify ID not found, trying title/artist match...');
        chordonomiconData = await fetchChordonomiconData(null, null, title, artist);
      }

      if (chordonomiconData) {
        chartData = {
          title: spotifyData.title,
          artist: spotifyData.artist,
          key: key || 'C',
          time_signature: time_signature || '4/4',
          reference_file_url: reference_file_url,
          spotify_song_id: chordonomiconData.chart_data.spotify_song_id,
          spotify_artist_id: chordonomiconData.chart_data.spotify_artist_id,
          genres: chordonomiconData.chart_data.genres,
          release_date: chordonomiconData.chart_data.release_date,
          decade: chordonomiconData.chart_data.decade
        };
        
        sectionsData = chordonomiconData.sections;
      }
    } catch (error) {
      console.log('Chordonomicon lookup failed, falling back to LLM:', error.message);
    }
  }

  if (!chartData || !sectionsData) {
    dataSource = 'llm';
    
    if (!key || !time_signature) {
      return Response.json({ 
        error: 'Song not found in database. Please provide key and time signature to generate chart with AI.' 
      }, { status: 400 });
    }

    try {
      const llmResponse = await generateChartWithLLM(base44, title, artist, key, time_signature, reference_file_url);

      if (!llmResponse.sections) {
        return Response.json({ error: 'Failed to generate chart with LLM' }, { status: 500 });
      }

      chartData = {
        title,
        artist: artist || 'Unknown',
        key,
        time_signature,
        reference_file_url
      };
      
      sectionsData = llmResponse.sections;
    } catch (llmError) {
      console.error('LLM generation failed:', llmError);
      return Response.json({ 
        error: 'Failed to generate chart. Please try again or check your inputs.',
        details: llmError.message
      }, { status: 500 });
    }
  }

  // Step 4: Create Chart entity with data_source field and assign to user
  chartData.data_source = dataSource;
  chartData.owner_id = user.id;
  const chart = await base44.asServiceRole.entities.Chart.create(chartData);

  // Step 5: Create Section entities
  const sectionPromises = sectionsData.map((section) =>
    base44.entities.Section.create({
      chart_id: chart.id,
      label: section.label,
      measures: section.measures,
      repeat_count: section.repeat_count || 1,
      arrangement_cue: section.arrangement_cue || ''
    })
  );

  await Promise.all(sectionPromises);

  return Response.json({ 
    success: true,
    chart_id: chart.id,
    source: dataSource,
    message: dataSource === 'chordonomicon' 
      ? 'Chart generated from Chordonomicon database'
      : 'Chart generated using AI'
  });
});