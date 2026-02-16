import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hfToken = Deno.env.get("HUGGINGFACE_API_TOKEN");
    
    // Query for a known song using simpler filter
    const filterUrl = `https://datasets-server.huggingface.co/slice?dataset=ailsntua/Chordonomicon&config=default&split=train&offset=0&length=5`;
    
    const headers = { 'Accept': 'application/json' };
    if (hfToken) {
      headers['Authorization'] = `Bearer ${hfToken}`;
    }

    const response = await fetch(filterUrl, { headers });
    
    if (!response.ok) {
      return Response.json({ 
        error: `HF API Error: ${response.status}`,
        url: filterUrl
      }, { status: response.status });
    }

    const data = await response.json();
    
    if (!data.rows || data.rows.length === 0) {
      return Response.json({ 
        message: 'No data found for Sweet Caroline',
        attempting: 'Alternative search...'
      });
    }

    const song = data.rows[0].row;
    
    return Response.json({
      success: true,
      song_structure: {
        title: song.title,
        artist: song.artist,
        spotify_song_id: song.spotify_song_id,
        spotify_artist_id: song.spotify_artist_id,
        genres: song.genres,
        release_date: song.release_date,
        decade: song.decade,
        chords_raw: song.chords?.substring(0, 500), // First 500 chars
        chords_length: song.chords?.length,
        chord_sample: song.chords?.split(' ').slice(0, 20).join(' ') // First 20 chord tokens
      }
    });

  } catch (error) {
    console.error('Inspection error:', error);
    return Response.json({ 
      error: error.message
    }, { status: 500 });
  }
});