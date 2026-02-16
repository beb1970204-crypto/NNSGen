import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  // Allow both user-initiated and service-to-service calls
  const isAuthenticated = await base44.auth.isAuthenticated();
  if (!isAuthenticated) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, artist, key, time_signature, reference_file_url } = await req.json();

  if (!title || !key || !time_signature) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Extract text from reference file if provided
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

  // Build the prompt for LLM
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
                          symbols: {
                            type: "array",
                            items: { type: "string" }
                          }
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

  // Sanitize LLM response to ensure correct types
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

  return Response.json(response);
});