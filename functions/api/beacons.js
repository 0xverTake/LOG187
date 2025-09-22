const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Gère les requêtes GET pour récupérer toutes les balises
async function handleGet({ env }) {
    try {
        // Je suppose qu'une table 'beacons' existe.
        const { results } = await env.DB.prepare("SELECT * FROM beacons ORDER BY created_at DESC").all();
        return new Response(JSON.stringify(results), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (e) {
        // Si la table n'existe pas, retourner un tableau vide pour ne pas bloquer le client.
        if (e.message.includes('no such table')) {
            return new Response(JSON.stringify([]), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}

// Gère les requêtes POST pour créer une balise
async function handlePost({ request, env }) {
    try {
        const beacon = await request.json();
        if (!beacon.type || !beacon.location) {
            return new Response(JSON.stringify({ error: "Champs manquants" }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        await env.DB.prepare("INSERT INTO beacons (type, location) VALUES (?, ?)")
            .bind(beacon.type, beacon.location)
            .run();
            
        return new Response(JSON.stringify({ message: "Balise créée" }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}

// Gère les requêtes DELETE pour rejoindre/supprimer une balise
async function handleDelete({ request, env }) {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
        return new Response(JSON.stringify({ error: "ID manquant" }), { status: 400, headers: corsHeaders });
    }
    try {
        await env.DB.prepare("DELETE FROM beacons WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ message: "Balise rejointe" }), { status: 200, headers: corsHeaders });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
    }
}

// Routeur principal
export async function onRequest(context) {
    switch (context.request.method) {
        case 'GET':
            return await handleGet(context);
        case 'POST':
            return await handlePost(context);
        case 'DELETE':
            return await handleDelete(context);
        case 'OPTIONS':
            return new Response(null, { headers: corsHeaders });
        default:
            return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }
}
