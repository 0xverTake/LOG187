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
            const response = await fetch('/api/trade', {
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

    // --- Accordion Logic ---
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });

    // --- LOGIQUE DU PLANIFICATEUR (Full-Stack) ---
    const missionForm = document.getElementById('mission-planner-form');
    const missionList = document.getElementById('mission-list');
    const plannerApiUrl = '/functions/api/missions';

    async function fetchAndRenderMissions() {
        missionList.innerHTML = `<div style="display: flex; justify-content: center; align-items: center; gap: 1rem;"><div class="spinner"></div><p>Chargement...</p></div>`;
        try {
            const response = await fetch(plannerApiUrl);
            if (!response.ok) throw new Error('Erreur de chargement');
            const missions = await response.json();

            if (!missions || missions.length === 0) {
                missionList.innerHTML = `<p>Aucune mission planifiée.</p>`;
                return;
            }

            missionList.innerHTML = missions.map(mission => `
                <div class="mission-card" data-id="${mission.id}">
                    <div class="mission-card-content">
                        <h4>${mission.title}</h4>
                        <p>${mission.details}</p>
                        <small>Type: ${mission.type}</small>
                    </div>
                    <button class="delete-mission-btn" data-id="${mission.id}"><i data-lucide="trash-2"></i></button>
                </div>
            `).join('');
            lucide.createIcons();
        } catch (error) {
            missionList.innerHTML = `<p>${error.message}</p>`;
        }
    }

    missionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = missionForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        const missionData = {
            title: document.getElementById('mission-title').value,
            type: document.getElementById('mission-type').value,
            details: document.getElementById('mission-details').value,
        };

        try {
            const response = await fetch(plannerApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(missionData),
            });
            if (!response.ok) throw new Error('Impossible d\'ajouter la mission');
            missionForm.reset();
            await fetchAndRenderMissions();
        } catch (error) {
            alert(error.message);
        } finally {
            submitBtn.disabled = false;
        }
    });

    missionList.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-mission-btn');
        if (deleteBtn) {
            const missionId = deleteBtn.dataset.id;
            if (!confirm(`Supprimer la mission ID: ${missionId} ?`)) return;

            try {
                const response = await fetch(`${plannerApiUrl}?id=${missionId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('La suppression a échoué');
                document.querySelector(`.mission-card[data-id="${missionId}"]`).remove();
            } catch (error) {
                alert(error.message);
            }
        }
    });

    document.querySelector('.tab-button[data-tab="planner"]').addEventListener('click', fetchAndRenderMissions);

    // --- LOGIQUE ASSISTANCE ---
    const assistanceForm = document.getElementById('assistance-form');
    assistanceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = assistanceForm.querySelector('button');
        btn.innerHTML = `<div class="spinner"></div><span>Envoi...</span>`;
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = `<i data-lucide="check-circle"></i><span>Balise Émise!</span>`;
            setTimeout(() => {
                btn.innerHTML = `<i data-lucide="alert-triangle"></i>Émettre la balise`;
                btn.disabled = false;
                assistanceForm.reset();
                lucide.createIcons();
            }, 2500);
        }, 1500);
    });
});
