// ── Worker Cloudflare — Blind Test Famille ──────────────────────────
// Secret attendu (Cloudflare → Worker → Settings → Variables) :
//   ANTHROPIC_API_KEY
//
// Route :
//   POST /  → proxy vers l'API Anthropic (Xav, le présentateur IA)
//
// Cette version garantit les headers CORS sur TOUTES les réponses,
// y compris en cas d'erreur inattendue (try/catch global), pour éviter
// le symptôme "Response to preflight request doesn't pass access
// control check: No 'Access-Control-Allow-Origin' header".

const ALLOWED_ORIGIN = 'https://xavierpiza2-a11y.github.io';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    // Toujours répondre au préflight, peu importe le reste
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    try {
      if (request.method !== 'POST') {
        return new Response('Not found', { status: 404, headers: corsHeaders() });
      }

      if (!env.ANTHROPIC_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'ANTHROPIC_API_KEY manquant dans les variables du Worker' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        );
      }

      const body = await request.text();

      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body,
      });

      const data = await upstream.text();

      return new Response(data, {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    } catch (e) {
      // Filet de sécurité : même en cas de plantage, on renvoie les headers CORS
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
  },
};
