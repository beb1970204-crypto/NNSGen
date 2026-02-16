import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { spotify_song_id, spotify_artist_id, title, artist } = await req.json();

  if (!spotify_song_id && !title) {
    return Response.json({ error: 'Either spotify_song_id or title is required' }, { status: 400 });
  }

  try {
    const hfToken = Deno.env.get("HUGGINGFACE_API_TOKEN");
    
    let whereClause;
    
    // Strategy 1: Search by Spotify IDs (most precise)
    if (spotify_song_id) {
      const sanitizedSongId = spotify_song_id.replace(/'/g, "''");
      const sanitizedArtistId = spotify_artist_id ? spotify_artist_id.replace(/'/g, "''") : null;
      
      whereClause = `"spotify_song_id"='${sanitizedSongId}'`;
      if (sanitizedArtistId) {
        whereClause += ` AND "spotify_artist_id"='${sanitizedArtistId}'`;
      }
    } 
    // Strategy 2: Search by title and artist (fallback for version mismatches)
    else if (title && artist) {
      const sanitizedTitle = title.replace(/'/g, "''");
      const sanitizedArtist = artist.replace(/'/g, "''");
      
      // Note: Hugging Face /filter doesn't support LOWER() function
      // So we search with exact case matching
      whereClause = `"title"='${sanitizedTitle}' AND "artist"='${sanitizedArtist}'`;
    } else {
      return Response.json({ error: 'Insufficient search criteria' }, { status: 400 });
    }

    // Use the /filter endpoint with correct SQL-like syntax
    const filterUrl = `https://datasets-server.huggingface.co/filter?dataset=ailsntua/Chordonomicon&config=default&split=train&where=${encodeURIComponent(whereClause)}&limit=1`;
    
    const headers = {
      'Accept': 'application/json'
    };
    
    if (hfToken) {
      headers['Authorization'] = `Bearer ${hfToken}`;
    }

    const response = await fetch(filterUrl, { headers });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check if we got any results
    if (!data.rows || data.rows.length === 0) {
      return Response.json({ 
        found: false,
        message: 'Song not found in Chordonomicon database'
      });
    }

    // Extract row data from the response structure
    const rowData = data.rows[0].row;

    // Parse the chord progression from the chords column
    const chordsString = rowData.chords;
    
    if (!chordsString) {
      return Response.json({ 
        found: false,
        message: 'No chord data available for this song'
      });
    }

    // Parse sections from the chords string
    const sections = parseChordProgressionToSections(chordsString);

    // Return structured data ready for Chart and Section entity creation
    return Response.json({
      found: true,
      data: {
        chart_data: {
          spotify_song_id: rowData.spotify_song_id,
          spotify_artist_id: rowData.spotify_artist_id,
          genres: rowData.genres,
          release_date: rowData.release_date,
          decade: rowData.decade
        },
        sections: sections
      }
    });

  } catch (error) {
    console.error('Chordonomicon query error:', error);
    return Response.json({ 
      found: false,
      error: 'Failed to query Chordonomicon database',
      details: error.message
    }, { status: 500 });
  }
});

// Parse Chordonomicon's chord string format into sections
function parseChordProgressionToSections(chordsString) {
  const sections = [];
  
  // Relaxed regex that handles <tag_1>, <tag>, and case insensitivity
  // Matches: <(word)(optional: _number)>
  const sectionPattern = /<([a-zA-Z]+)(?:_(\d+))?>/g;
  
  // Check if the song starts with chords BEFORE the first tag (Implicit Intro)
  const firstTagMatch = sectionPattern.exec(chordsString);
  if (firstTagMatch && firstTagMatch.index > 0) {
    const introChords = chordsString.substring(0, firstTagMatch.index).trim();
    if (introChords) {
      sections.push(createSection('Intro', introChords));
    }
  }
  
  // Reset regex
  sectionPattern.lastIndex = 0;
  
  // Use standard split behavior
  const parts = chordsString.split(sectionPattern);
  // split with capturing groups returns: [text, capture1, capture2, text, capture1, capture2...]
  // If regex is /<([a-zA-Z]+)(?:_(\d+))?>/, we get 3 parts per split (text, label, number)
  
  for (let i = 1; i < parts.length; i += 3) {
    const type = parts[i]; // e.g. "verse"
    const number = parts[i + 1] || '1'; // e.g. "1" or undefined -> default to '1'
    const content = parts[i + 2]; // The chords
    
    if (content && content.trim()) {
      const label = mapLabel(type);
      sections.push(createSection(label, content));
    }
  }
  
  // Fallback: If no sections found (no tags), treat whole string as a generic Verse
  if (sections.length === 0 && chordsString.trim()) {
    sections.push(createSection('Verse', chordsString));
  }
  
  return sections;
}

// Helper to map Chordonomicon section labels to our Section entity labels
function mapLabel(type) {
  const labelMap = {
    'intro': 'Intro',
    'verse': 'Verse',
    'pre': 'Pre',
    'prechorus': 'Pre',
    'chorus': 'Chorus',
    'bridge': 'Bridge',
    'solo': 'Instrumental Solo',
    'instrumental': 'Instrumental Solo',
    'interlude': 'Instrumental Solo',
    'outro': 'Outro'
  };
  
  return labelMap[type.toLowerCase()] || 'Verse';
}

// Helper to create a section from chord content
function createSection(label, chordsText) {
  // Split chords by whitespace
  const chordArray = chordsText.split(/\s+/).filter(c => c && c.trim());
  
  // Group chords into measures (assume 4 chords per measure for 4/4 time)
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
  
  return {
    label,
    measures,
    repeat_count: 1,
    arrangement_cue: ''
  };
}

// Normalize chord names from Chordonomicon format to standard notation
function normalizeChordName(chord) {
  if (!chord || chord === '-') return '-';
  
  // Chordonomicon uses formats like 'Amin' instead of 'Am', 'Cmaj7' etc.
  let normalized = chord
    .replace(/min$/, 'm')      // Amin -> Am
    .replace(/maj/, 'maj')     // Keep maj as is
    .replace(/no3(?:rd)?/i, '5');  // no3/no3rd -> 5 (power chord)
  
  return normalized;
}