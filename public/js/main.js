document.addEventListener('DOMContentLoaded', () => {
    
    // --- Initialisation des icônes Lucide ---
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // --- Tab Navigation Logic ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTabId = button.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            tabContents.forEach(content => {
                content.classList.toggle('active', content.id === targetTabId);
            });
        });
    });

    // --- LOGIQUE DE L'ONGLET COMMERCE ---
    const findRoutesBtn = document.getElementById('find-routes-btn');
    const resultsContainer = document.getElementById('trade-results-container');

    async function fetchTradeData(budget, cargo) {
        const query = `
            query getTradeRoutes($budget: Int, $cargo: Int) {
                trades(budget: $budget, cargo: $cargo) {
                    best {
                        profit
                        item { name }
                        from { name }
                        to { name }
                        buyPrice
                        sellPrice
                        scu
                    }
                }
            }
        `;
        const variables = { budget: parseInt(budget), cargo: parseInt(cargo) };

        try {
            const response = await fetch('https://api.sc-trade.tools/v3/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables }),
            });
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            const json = await response.json();
            
            if (!json.data || !json.data.trades || !json.data.trades.best) {
                throw new Error("Réponse de l'API invalide.");
            }

            return json.data.trades.best.map(route => ({
                profit: route.profit,
                item: { name: route.item.name },
                source: { name: route.from.name },
                destination: { name: route.to.name },
                buy: { price: route.buyPrice },
                sell: { price: route.sellPrice },
                scu: route.scu
            }));
        } catch (error) {
            console.error("Failed to fetch trade data:", error);
            resultsContainer.innerHTML = `<p style="color: var(--color-accent-lime);">Erreur lors de la récupération des données. L'API est peut-être indisponible.</p>`;
            return null;
        }
    }

    function displayTradeResults(routes) {
        if (!routes || routes.length === 0) {
            resultsContainer.innerHTML = `<p>Aucune route profitable trouvée. Essayez d'augmenter le budget.</p>`;
            return;
        }
        
        let html = routes.slice(0, 5).map(route => `
            <div class="trade-result-card">
                <div>
                    <p class="form-label">Produit</p>
                    <p>${route.item.name} (${Math.round(route.scu)} SCU)</p>
                </div>
                <div>
                    <p class="form-label">Achat</p>
                    <p>${route.source.name} @ ${route.buy.price.toFixed(2)}</p>
                </div>
                <div>
                    <p class="form-label">Vente</p>
                    <p>${route.destination.name} @ ${route.sell.price.toFixed(2)}</p>
                </div>
                <div class="profit-display">
                    ${Math.round(route.profit).toLocaleString('fr-FR')} aUEC
                </div>
            </div>
        `).join('');
        resultsContainer.innerHTML = html;
    }

    findRoutesBtn.addEventListener('click', async () => {
        const budget = document.getElementById('budget').value;
        const cargo = document.getElementById('cargo').value;

        if (!budget || !cargo) {
            resultsContainer.innerHTML = `<p>Veuillez entrer un budget et une capacité de soute.</p>`;
            return;
        }
        
        resultsContainer.innerHTML = `<div style="display: flex; justify-content: center; align-items: center; gap: 1rem;"><div class="spinner"></div><p>Recherche en cours...</p></div>`;
        findRoutesBtn.disabled = true;

        const routes = await fetchTradeData(budget, cargo);
        displayTradeResults(routes);
        
        findRoutesBtn.disabled = false;
    });
});
