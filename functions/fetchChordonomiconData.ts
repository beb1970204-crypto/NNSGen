import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import parquet from 'npm:parquetjs@0.11.2';

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
    // Fetch the Parquet file list from Hugging Face
    const refsUrl = 'https://huggingface.co/api/datasets/ailsntua/Chordonomicon/parquet/default/train';
    const refsResponse = await fetch(refsUrl);
    
    if (!refsResponse.ok) {
      throw new Error('Failed to fetch Parquet file list');
    }
    
    const parquetFiles = await refsResponse.json();
    
    // Search through Parquet files
    for (const fileInfo of parquetFiles) {
      const parquetUrl = `https://huggingface.co/datasets/ailsntua/Chordonomicon/resolve/refs%2Fconvert%2Fparquet/default/train/${fileInfo.filename}`;
      
      try {
        // Download Parquet file
        const fileResponse = await fetch(parquetUrl);
        const arrayBuffer = await fileResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Create a temporary file to read with parquetjs
        const tempFilePath = `/tmp/${fileInfo.filename}`;
        await Deno.writeFile(tempFilePath, new Uint8Array(buffer));
        
        // Read the Parquet file
        const reader = await parquet.ParquetReader.openFile(tempFilePath);
        const cursor = reader.getCursor();
        
        // Iterate through rows
        let record = null;
        while (record = await cursor.next()) {
          if (record.spotify_song_id === spotify_song_id) {
            // Check artist ID if provided
            if (!spotify_artist_id || record.spotify_artist_id === spotify_artist_id) {
              // Found the song!
              await reader.close();
              
              // Clean up temp file
              try {
                await Deno.remove(tempFilePath);
              } catch (e) {
                // Ignore cleanup errors
              }
              
              const chordsString = record.chords;
              
              if (!chordsString) {
                return Response.json({ 
                  found: false,
                  message: 'No chord data available for this song'
                });
              }
              
              const sections = parseChordProgressionToSections(chordsString);
              
              return Response.json({
                found: true,
                data: {
                  chart_data: {
                    spotify_song_id: record.spotify_song_id,
                    spotify_artist_id: record.spotify_artist_id,
                    genres: record.genres,
                    release_date: record.release_date,
                    decade: record.decade
                  },
                  sections: sections
                }
              });
            }
          }
        }
        
        await reader.close();
        
        // Clean up temp file
        try {
          await Deno.remove(tempFilePath);
        } catch (e) {
          // Ignore cleanup errors
        }
        
      } catch (fileError) {
        console.log(`Error reading file ${fileInfo.filename}:`, fileError.message);
        continue;
      }
    }
    
    // Song not found in any file
    return Response.json({ 
      found: false,
      message: 'Song not found in Chordonomicon database'
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