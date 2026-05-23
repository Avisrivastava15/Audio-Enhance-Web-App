import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed';
  progress: number;
}

const processingSteps: ProcessingStep[] = [
  { id: '1', name: 'Audio Analysis', description: 'Analyzing audio waveform and frequency spectrum', status: 'pending', progress: 0 },
  { id: '2', name: 'Echo Detection', description: 'Identifying echo patterns and reflections', status: 'pending', progress: 0 },
  { id: '3', name: 'Reverb Separation', description: 'Separating reverb from original signal', status: 'pending', progress: 0 },
  { id: '4', name: 'Noise Reduction', description: 'Applying adaptive noise reduction', status: 'pending', progress: 0 },
  { id: '5', name: 'Signal Enhancement', description: 'Enhancing clarity and presence', status: 'pending', progress: 0 },
  { id: '6', name: 'Final Processing', description: 'Applying final optimizations', status: 'pending', progress: 0 },
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // GET /audio-processor - Health check
    if (req.method === 'GET' && path === '/audio-processor') {
      return new Response(
        JSON.stringify({ status: 'ok', message: 'Audio processor is ready' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /audio-processor/analyze - Analyze audio file metadata
    if (req.method === 'POST' && path === '/audio-processor/analyze') {
      const formData = await req.formData();
      const file = formData.get('audio') as File;

      if (!file) {
        return new Response(
          JSON.stringify({ error: 'No audio file provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav'];
      if (!validTypes.includes(file.type)) {
        return new Response(
          JSON.stringify({ error: 'Invalid file type. Only MP3 and WAV files are supported' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        return new Response(
          JSON.stringify({ error: 'File too large. Maximum size is 100MB' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
            format: file.type.includes('wav') ? 'WAV' : 'MP3',
          },
          processingSteps,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /audio-processor/process - Process audio with steps
    if (req.method === 'POST' && path === '/audio-processor/process') {
      const body = await req.json();
      const { userId, stepId, stepIndex } = body;

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));

      return new Response(
        JSON.stringify({
          success: true,
          stepId,
          stepIndex,
          message: `Step ${stepIndex + 1} completed`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /audio-processor/steps - Get processing steps
    if (req.method === 'GET' && path === '/audio-processor/steps') {
      return new Response(
        JSON.stringify({ steps: processingSteps }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
