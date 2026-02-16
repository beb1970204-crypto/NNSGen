import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as duckdb from 'npm:duckdb-async@1.1.3';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { spotify_song_id, spotify_artist_id } = await req.json();

  if (!spotify_song_id) {
    return Response.json({ error: 'Spotify song ID is required' }, { status: 400 });
  }

  try {
    // Initialize DuckDB database (in-memory)
    const db = await duckdb.Database.create(':memory:');

    // Construct SQL query with predicate pushdown
    let sqlQuery = `
      SELECT * FROM read_parquet('hf://datasets/ailsntua/Chordonomicon@~parquet/**/*.parquet') 
      WHERE spotify_song_id = ?
    `;
    
    const params = [spotify_song_id];

    // Add artist filter if provided for more precise matching
    if (spotify_artist_id) {
      sqlQuery += ` AND spotify_artist_id = ?`;
      params.push(spotify_artist_id);
    }

    // Execute query
    const queryResult = await db.all(sqlQuery, ...params);

    // Close database
    await db.close();

    // Check if we got any results
    if (!queryResult || queryResult.length === 0) {
      return Response.json({ 
        found: false,
        message: 'Song not found in Chordonomicon database'
      });
    }

    // Get the first (best) match
    const rowData = queryResult[0];

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
    console.error('DuckDB query error:', error);
    return Response.json({ 
      found: false,
      error: 'Failed to query Chordonomicon database with DuckDB',
      details: error.message
    }, { status: 500 });
  }
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
  let normalized = chord
    .replace(/min$/, 'm')      // Amin -> Am
    .replace(/maj/, 'maj')     // Keep maj as is
    .replace(/no3d/, 'sus2');  // no3d -> sus2 approximation
  
  return normalized;
}