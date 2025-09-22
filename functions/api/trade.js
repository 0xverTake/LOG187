const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

async function handlePost(context) {
    try {
        const { query, variables } = await context.request.json();
        
        const response = await fetch('https://sc-trade.tools/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
            throw new Error(`Erreur de l'API externe: ${response.statusText}`);
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

function handleOptions() {
    return new Response(null, { headers: corsHeaders });
}

export async function onRequest(context) {
    switch (context.request.method) {
        case 'POST':
            return await handlePost(context);
        case 'OPTIONS':
            return handleOptions();
        default:
            return new Response('Method Not Allowed', {
                status: 405,
                headers: corsHeaders,
            });
    }
}
