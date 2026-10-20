const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Authentication is required.' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: 'Supabase authentication is not configured.' }, 500);
  }

  const userResponse = await fetch(
    `${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`,
    {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: authorization,
      },
    }
  );
  if (!userResponse.ok) {
    return jsonResponse({ error: 'Authentication is required.' }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'A valid JSON body is required.' }, 400);
  }
  if (typeof body !== 'object' || body === null) {
    return jsonResponse({ error: 'A valid JSON body is required.' }, 400);
  }

  const resourceType = (body as Record<string, unknown>).resourceType;
  if (resourceType !== 'image' && resourceType !== 'video') {
    return jsonResponse({ error: 'Unsupported Cloudinary resource type.' }, 400);
  }

  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
  const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
  const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
  if (!cloudName || !apiKey || !apiSecret) {
    return jsonResponse({ error: 'Cloudinary signing is not configured.' }, 500);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const message = new TextEncoder().encode(`timestamp=${timestamp}${apiSecret}`);
  const digest = await crypto.subtle.digest('SHA-1', message);
  const signature = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return jsonResponse({ timestamp, signature, apiKey, cloudName });
});
