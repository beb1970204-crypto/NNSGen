import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

  // Step 1: Search for the song on Spotify
  let spotifyData = null;
  try {
    const spotifyResponse = await base44.asServiceRole.functions.invoke('searchSpotify', {
      song_title: title,
      artist_name: artist
    });

    if (spotifyResponse.data?.found) {
      spotifyData = spotifyResponse.data;
    }
  } catch (error) {
    console.log('Spotify search failed:', error.message);
  }

  // Step 2: Try to fetch from Chordonomicon database using Spotify IDs
  let chartData = null;
  let sectionsData = null;
  let dataSource = 'chordonomicon';

  if (spotifyData) {
    try {
      // Pass 1: Try exact Spotify ID match
      let chordonomiconResponse = await base44.asServiceRole.functions.invoke('fetchChordonomiconData', {
        spotify_song_id: spotifyData.spotify_song_id,
        spotify_artist_id: spotifyData.spotify_artist_id
      });

      // Pass 2: If not found, try title/artist match (catches version mismatches)
      if (!chordonomiconResponse.data?.found) {
        console.log('Spotify ID not found, trying title/artist match...');
        chordonomiconResponse = await base44.asServiceRole.functions.invoke('fetchChordonomiconData', {
          title: title,
          artist: artist
        });
      }

      if (chordonomiconResponse.data?.found) {
        // We found the song in Chordonomicon!
        const chordonomiconData = chordonomiconResponse.data.data;
        
        // Use Chordonomicon data but allow user overrides for key/time_signature
        chartData = {
          title: spotifyData.title,
          artist: spotifyData.artist,
          key: key || 'C', // Default to C if not provided (Chordonomicon doesn't provide key)
          time_signature: time_signature || '4/4', // Default to 4/4
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

  // Step 3: Fallback to LLM generation if not found in Chordonomicon
  if (!chartData || !sectionsData) {
    dataSource = 'llm';
    
    if (!key || !time_signature) {
      return Response.json({ 
        error: 'Song not found in database. Please provide key and time signature to generate chart with AI.' 
      }, { status: 400 });
    }

    try {
      const llmResponse = await base44.asServiceRole.functions.invoke('generateChartWithLLM', {
        title,
        artist,
        key,
        time_signature,
        reference_file_url
      });

      if (!llmResponse.data?.sections) {
        return Response.json({ error: 'Failed to generate chart with LLM' }, { status: 500 });
      }

      chartData = {
        title,
        artist: artist || 'Unknown',
        key,
        time_signature,
        reference_file_url
      };
      
      sectionsData = llmResponse.data.sections;
    } catch (llmError) {
      console.error('LLM generation failed:', llmError);
      console.error('LLM error details:', llmError.response?.data || llmError.message);
      return Response.json({ 
        error: 'Failed to generate chart. Please try again or check your inputs.',
        details: llmError.message
      }, { status: 500 });
    }
  }

  // Step 4: Create Chart entity with data_source field
  chartData.data_source = dataSource;
  const chart = await base44.entities.Chart.create(chartData);

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