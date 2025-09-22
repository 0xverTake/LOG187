document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES ET VARIABLES GLOBALES ---
    const API_BASE_URL = '/functions/api';
    const TRADE_API_URL = `${API_BASE_URL}/trade`;
    const MISSIONS_API_URL = `${API_BASE_URL}/missions`;
    const BEACONS_API_URL = `${API_BASE_URL}/beacons`;
    let beaconRefreshInterval;

    // --- INITIALISATION ---
    function init() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        setupEventListeners();
    }

    // --- GESTION DES ÉVÉNEMENTS ---
    function setupEventListeners() {
        // Navigation par onglets
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', handleTabNavigation);
        });

        // Onglet Commerce
        document.getElementById('find-routes-btn').addEventListener('click', handleTradeSearch);

        // Onglet Planificateur
        document.getElementById('mission-planner-form').addEventListener('submit', handleMissionSubmit);
        document.getElementById('mission-list').addEventListener('click', handleMissionDelete);
        document.querySelector('.tab-button[data-tab="planner"]').addEventListener('click', fetchAndRenderMissions);

        // Onglet Assistance
        document.getElementById('assistance-form').addEventListener('submit', handleBeaconSubmit);
        document.getElementById('beacon-list').addEventListener('click', handleBeaconJoin);
        document.querySelector('.tab-button[data-tab="assistance"]').addEventListener('click', startBeaconPolling);
        document.querySelectorAll('.tab-button:not([data-tab="assistance"])').forEach(button => {
            button.addEventListener('click', stopBeaconPolling);
        });
    }

    // --- LOGIQUE DES ONGLETS ---
    function handleTabNavigation(e) {
        const targetTabId = e.currentTarget.dataset.tab;
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === targetTabId);
        });
    }

    // --- LOGIQUE COMMERCE ---
    async function handleTradeSearch() {
        const budget = document.getElementById('budget').value;
        const cargo = document.getElementById('cargo').value;
        const resultsContainer = document.getElementById('trade-results-container');
        const findRoutesBtn = document.getElementById('find-routes-btn');

        if (!budget || !cargo) {
            resultsContainer.innerHTML = `<p>Veuillez entrer un budget et une capacité de soute.</p>`;
            return;
        }

        setLoadingState(findRoutesBtn, true, 'Recherche...');
        resultsContainer.innerHTML = createSpinner('Recherche des meilleures routes...');

        try {
            const response = await fetchAPI(TRADE_API_URL, 'POST', { budget: parseInt(budget), cargo: parseInt(cargo) });
            const routes = response.map(route => ({
                profit: route.profit,
                item: { name: route.item.name },
                source: { name: route.from.name },
                destination: { name: route.to.name },
                buy: { price: route.buy.price },
                sell: { price: route.sell.price },
                scu: route.scu
            }));
            displayTradeResults(routes);
        } catch (error) {
            resultsContainer.innerHTML = createErrorMessage(error.message);
        } finally {
            setLoadingState(findRoutesBtn, false, 'Rechercher');
        }
    }

    function displayTradeResults(routes) {
        const resultsContainer = document.getElementById('trade-results-container');
        if (!routes || routes.length === 0) {
            resultsContainer.innerHTML = `<p>Aucune route profitable trouvée.</p>`;
            return;
        }
        resultsContainer.innerHTML = routes.slice(0, 5).map(route => `
            <div class="trade-result-card">
                <div><p class="form-label">Produit</p><p>${route.item.name} (${Math.round(route.scu)} SCU)</p></div>
                <div><p class="form-label">Achat</p><p>${route.source.name} @ ${route.buy.price.toFixed(2)}</p></div>
                <div><p class="form-label">Vente</p><p>${route.destination.name} @ ${route.sell.price.toFixed(2)}</p></div>
                <div class="profit-display">${Math.round(route.profit).toLocaleString('fr-FR')} aUEC</div>
            </div>
        `).join('');
    }

    // --- LOGIQUE PLANIFICATEUR ---
    async function fetchAndRenderMissions() {
        const missionList = document.getElementById('mission-list');
        missionList.innerHTML = createSpinner('Chargement des missions...');
        try {
            const missions = await fetchAPI(MISSIONS_API_URL);
            if (!missions || missions.length === 0) {
                missionList.innerHTML = `<p>Aucune mission planifiée.</p>`;
                return;
            }
            missionList.innerHTML = missions.map(mission => `
                <div class="mission-card" data-id="${mission.id}">
                    <div class="mission-card-content">
                        <h4>${mission.title}</h4><p>${mission.details}</p><small>Type: ${mission.type}</small>
                    </div>
                    <button class="delete-mission-btn" data-id="${mission.id}"><i data-lucide="trash-2"></i></button>
                </div>
            `).join('');
            lucide.createIcons();
        } catch (error) {
            missionList.innerHTML = createErrorMessage(error.message);
        }
    }

    async function handleMissionSubmit(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const submitBtn = form.querySelector('button[type="submit"]');
        setLoadingState(submitBtn, true);
        try {
            const missionData = {
                title: document.getElementById('mission-title').value,
                type: document.getElementById('mission-type').value,
                details: document.getElementById('mission-details').value,
            };
            await fetchAPI(MISSIONS_API_URL, 'POST', missionData);
            form.reset();
            await fetchAndRenderMissions();
        } catch (error) {
            alert(error.message);
        } finally {
            setLoadingState(submitBtn, false, 'Ajouter');
        }
    }

    async function handleMissionDelete(e) {
        const deleteBtn = e.target.closest('.delete-mission-btn');
        if (deleteBtn) {
            const missionId = deleteBtn.dataset.id;
            if (!confirm(`Supprimer la mission ID: ${missionId} ?`)) return;
            try {
                await fetchAPI(`${MISSIONS_API_URL}?id=${missionId}`, 'DELETE');
                document.querySelector(`.mission-card[data-id="${missionId}"]`).remove();
            } catch (error) {
                alert(error.message);
            }
        }
    }

    // --- LOGIQUE ASSISTANCE ---
    function startBeaconPolling() {
        fetchAndRenderBeacons();
        if (beaconRefreshInterval) clearInterval(beaconRefreshInterval);
        beaconRefreshInterval = setInterval(fetchAndRenderBeacons, 15000);
    }

    function stopBeaconPolling() {
        if (beaconRefreshInterval) clearInterval(beaconRefreshInterval);
    }

    async function fetchAndRenderBeacons() {
        const beaconList = document.getElementById('beacon-list');
        try {
            const beacons = await fetchAPI(BEACONS_API_URL);
            const title = `<h3 class="panel-title" style="font-size: 1.5rem; margin-bottom: 1rem;"><i data-lucide="broadcast"></i>Balises Actives</h3>`;
            if (!beacons || beacons.length === 0) {
                beaconList.innerHTML = title + `<p>Aucune balise de détresse active.</p>`;
            } else {
                beaconList.innerHTML = title + beacons.map(beacon => `
                    <div class="beacon-card" data-id="${beacon.id}">
                        <div class="beacon-card-content"><h4>${beacon.type}</h4><p>${beacon.location}</p></div>
                        <button class="btn join-beacon-btn" data-id="${beacon.id}">Rejoindre</button>
                    </div>
                `).join('');
            }
            lucide.createIcons();
        } catch (error) {
            beaconList.innerHTML = createErrorMessage(error.message);
        }
    }

    async function handleBeaconSubmit(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const submitBtn = form.querySelector('button[type="submit"]');
        setLoadingState(submitBtn, true, 'Envoi...');
        try {
            const beaconData = {
                type: document.getElementById('assistance-type').value,
                location: document.getElementById('assistance-location').value,
            };
            await fetchAPI(BEACONS_API_URL, 'POST', beaconData);
            form.reset();
            await fetchAndRenderBeacons();
        } catch (error) {
            alert(error.message);
        } finally {
            setLoadingState(submitBtn, false, 'Émettre la balise');
        }
    }

    async function handleBeaconJoin(e) {
        const joinBtn = e.target.closest('.join-beacon-btn');
        if (joinBtn) {
            const beaconId = joinBtn.dataset.id;
            if (!confirm(`Rejoindre cette balise ? (Cela la retirera de la liste)`)) return;
            try {
                await fetchAPI(`${BEACONS_API_URL}?id=${beaconId}`, 'DELETE');
                document.querySelector(`.beacon-card[data-id="${beaconId}"]`).remove();
            } catch (error) {
                alert(error.message);
            }
        }
    }

    // --- FONCTIONS UTILITAIRES ---
    async function fetchAPI(url, method = 'GET', body = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Erreur de l'API: ${response.statusText}`);
        }
        // Gérer les réponses vides pour les requêtes DELETE
        if (response.status === 204 || response.headers.get("content-length") === "0") {
            return null;
        }
        return response.json();
    }

    function setLoadingState(button, isLoading, loadingText = '') {
        button.disabled = isLoading;
        if (isLoading) {
            button.innerHTML = createSpinner(loadingText);
        } else {
            // Restaurer le texte original (peut être amélioré en le stockant)
            button.innerHTML = loadingText;
            lucide.createIcons(); // Recréer les icônes si nécessaire
        }
    }

    function createSpinner(text) {
        return `<div style="display: flex; justify-content: center; align-items: center; gap: 1rem;"><div class="spinner"></div><p>${text}</p></div>`;
    }

    function createErrorMessage(message) {
        return `<p style="color: var(--color-accent-lime);">${message}</p>`;
    }

    // --- DÉMARRAGE DE L'APPLICATION ---
    init();
});
