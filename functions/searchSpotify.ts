import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  // Allow both user-initiated and service-to-service calls
  const isAuthenticated = await base44.auth.isAuthenticated();
  if (!isAuthenticated) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { song_title, artist_name } = await req.json();

  if (!song_title) {
    return Response.json({ error: 'Song title is required' }, { status: 400 });
  }

  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    return Response.json({ error: 'Spotify API credentials not configured' }, { status: 500 });
  }

  // Step 1: Get Spotify access token using client credentials flow
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
    },
    body: 'grant_type=client_credentials'
  });

  if (!tokenResponse.ok) {
    return Response.json({ 
      error: 'Failed to authenticate with Spotify',
      details: await tokenResponse.text()
    }, { status: 500 });
  }

  const { access_token } = await tokenResponse.json();

  // Step 2: Search for the track on Spotify
  const searchQuery = artist_name 
    ? `track:${song_title} artist:${artist_name}`
    : `track:${song_title}`;
  
  const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=5`;
  
  const searchResponse = await fetch(searchUrl, {
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  });

  if (!searchResponse.ok) {
    return Response.json({ 
      error: 'Failed to search Spotify',
      details: await searchResponse.text()
    }, { status: 500 });
  }

  const searchData = await searchResponse.json();

  if (!searchData.tracks?.items || searchData.tracks.items.length === 0) {
    return Response.json({ 
      found: false,
      message: 'No tracks found on Spotify'
    });
  }

  // Return the top result
  const track = searchData.tracks.items[0];
  
  return Response.json({
    found: true,
    spotify_song_id: track.id,
    spotify_artist_id: track.artists[0]?.id,
    title: track.name,
    artist: track.artists[0]?.name,
    album: track.album?.name,
    release_date: track.album?.release_date,
    preview_url: track.preview_url
  });
});