import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { song_title, artist_name } = await req.json();

  if (!song_title) {
    return Response.json({ error: 'Song title is required' }, { status: 400 });
  }

  // Use /filter endpoint for precise column-based matching
  // Construct SQL-like where clause (column names in double quotes, values in single quotes)
  const whereConditions = [];
  
  // Escape single quotes in input for SQL syntax
  const escapedTitle = song_title.replace(/'/g, "''");
  whereConditions.push(`"song_title"='${escapedTitle}'`);
  
  if (artist_name) {
    const escapedArtist = artist_name.replace(/'/g, "''");
    whereConditions.push(`"artist_name"='${escapedArtist}'`);
  }
  
  const whereClause = whereConditions.join(' AND ');
  const filterUrl = `https://datasets-server.huggingface.co/filter?dataset=ailsntua/Chordonomicon&config=default&split=train&where=${encodeURIComponent(whereClause)}&offset=0&length=1`;

  // Include Authorization header if token is available
  const headers = {};
  const hfToken = Deno.env.get("HUGGINGFACE_API_TOKEN");
  if (hfToken) {
    headers["Authorization"] = `Bearer ${hfToken}`;
  }

  const searchResponse = await fetch(filterUrl, { headers });
  
  if (!searchResponse.ok) {
    return Response.json({ 
      found: false,
      error: 'Failed to search Chordonomicon dataset',
      details: await searchResponse.text()
    });
  }

  const searchData = await searchResponse.json();
  
  // Check if we got any results
  if (!searchData.rows || searchData.rows.length === 0) {
    return Response.json({ 
      found: false,
      message: 'Song not found in Chordonomicon database'
    });
  }

  // Get the first (best) match
  const firstMatch = searchData.rows[0];
  const rowData = firstMatch.row;

  // Parse the chord progression from the chords column
  // Format: <section_label_number> chord1 chord2 ... <next_section_label_number> ...
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
        title: song_title,
        artist: artist_name || 'Unknown',
        // Note: Chordonomicon doesn't provide key/time signature directly
        // These would need to be inferred or provided by user
        spotify_song_id: rowData.spotify_song_id,
        spotify_artist_id: rowData.spotify_artist_id,
        genres: rowData.genres,
        release_date: rowData.release_date,
        decade: rowData.decade
      },
      sections: sections
    }
  });
});

// Parse Chordonomicon's chord string format into sections
function parseChordProgressionToSections(chordsString) {
  const sections = [];
  
  // Split by section markers (e.g., <intro_1>, <verse_1>, <chorus_1>)
  const sectionPattern = /<(\w+)_(\d+)>/g;
  const parts = chordsString.split(sectionPattern);
  
  // Process in groups of 3: [text_before, label, number, chords_text, ...]
  for (let i = 1; i < parts.length; i += 3) {
    const sectionType = parts[i]; // e.g., 'intro', 'verse', 'chorus'
    const sectionNumber = parts[i + 1]; // e.g., '1', '2'
    const chordsText = parts[i + 2]?.trim(); // The actual chords
    
    if (!chordsText) continue;

    // Map Chordonomicon section labels to our Section entity labels
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

    const label = labelMap[sectionType.toLowerCase()] || 'Verse';

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

    sections.push({
      label,
      measures,
      repeat_count: 1,
      arrangement_cue: ''
    });
  }

  return sections;
}

// Normalize chord names from Chordonomicon format to standard notation
function normalizeChordName(chord) {
  if (!chord || chord === '-') return '-';
  
  // Chordonomicon uses formats like 'Amin' instead of 'Am', 'Cmaj7' etc.
  // Convert common patterns
  let normalized = chord
    .replace(/min$/, 'm')      // Amin -> Am
    .replace(/maj/, 'maj')     // Keep maj as is
    .replace(/no3d/, 'sus2');  // no3d -> sus2 approximation
  
  return normalized;
}