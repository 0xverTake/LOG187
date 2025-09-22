const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

async function handleRequest(context) {
    const { request, env } = context;

    try {
        switch (request.method) {
            case 'GET':
                const { results } = await env.DB.prepare("SELECT * FROM missions ORDER BY created_at DESC").all();
                return new Response(JSON.stringify(results || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            
            case 'POST':
                const mission = await request.json();
                if (!mission.title || !mission.type || !mission.details) {
                    return new Response(JSON.stringify({ error: "Champs manquants" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
                await env.DB.prepare("INSERT INTO missions (title, type, details) VALUES (?, ?, ?)")
                    .bind(mission.title, mission.type, mission.details)
                    .run();
                return new Response(JSON.stringify({ message: "Mission ajoutée" }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

            case 'DELETE':
                const id = new URL(request.url).searchParams.get('id');
                if (!id) {
                    return new Response(JSON.stringify({ error: "ID manquant" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
                await env.DB.prepare("DELETE FROM missions WHERE id = ?").bind(id).run();
                return new Response(null, { status: 204, headers: corsHeaders });

            case 'OPTIONS':
                return new Response(null, { headers: corsHeaders });

            default:
                return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
        }
    } catch (e) {
        // Capture toutes les erreurs et renvoie une réponse JSON
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}

export const onRequest = handleRequest;
