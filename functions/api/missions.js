// Headers pour autoriser les requêtes cross-origin (CORS)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Gère les requêtes OPTIONS pour le pre-flight CORS
export async function onRequestOptions(context) {
  return new Response(null, { headers: corsHeaders });
}

// Gère les requêtes GET pour récupérer toutes les missions
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare("SELECT * FROM missions ORDER BY created_at DESC").all();
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Gère les requêtes POST pour ajouter une nouvelle mission
export async function onRequestPost({ request, env }) {
  try {
    const mission = await request.json();
    if (!mission.title || !mission.type || !mission.details) {
      return new Response(JSON.stringify({ error: "Champs manquants" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { results } = await env.DB.prepare("INSERT INTO missions (title, type, details) VALUES (?, ?, ?) RETURNING *")
      .bind(mission.title, mission.type, mission.details)
      .run();
      
    return new Response(JSON.stringify(results), {
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

// Gère les requêtes DELETE pour supprimer une mission
export async function onRequestDelete({ request, env }) {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return new Response(JSON.stringify({ error: "ID de mission manquant" }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        await env.DB.prepare("DELETE FROM missions WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ message: "Mission supprimée avec succès" }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}
