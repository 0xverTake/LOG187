const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequest(context) {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (context.request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    try {
        // Récupérer les données envoyées par le client (budget, cargo)
        const { budget, cargo } = await context.request.json();

        // Construire le corps de la requête pour l'API REST externe
        const tradeForm = {
            "budget": budget,
            "ship": {
                "cargo": cargo
            },
            "item": {},
            "from": {},
            "to": {},
            "options": {
                "factionReputation": [],
                "securityLevel": "ANY",
                "avoid": [],
                "limit": 10
            }
        };
        
        const response = await fetch('https://sc-trade.tools/api/tools/trades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tradeForm),
        });

        if (!response.ok) {
            throw new Error(`API externe a retourné une erreur: ${response.statusText}`);
        }

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}
