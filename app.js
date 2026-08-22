import { getConfig } from './config.js';
import { applyTheme } from './themes.js';
import { renderClientHome } from './pages/clientHome.js';
import { renderVehicleDetail } from './pages/vehicleDetail.js';
import { renderFavorites } from './pages/favorites.js';
import { renderComparePage } from './pages/compare.js';
import { renderAdminDashboard } from './pages/adminDashboard.js';

/**
 * Roteador Simples Baseado em Hash para Single Page Application (SPA)
 */
async function router() {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    // Obtém o hash da URL atual (ex: "#/veiculo/chevrolet-onix")
    const hash = window.location.hash || '#/';
    
    // Mostra tela de carregamento suave
    appContainer.innerHTML = `
    <div class="initial-loader">
        <div class="loader-spinner"></div>
        <p>Carregando página...</p>
    </div>`;

    // Roteamento
    try {
        if (hash === '#/' || hash === '') {
            // Home page do cliente
            // Analisa se há parâmetros passados de filtros (ex: ao clicar em marca no breadcrumb)
            const params = getHashParams();
            await renderClientHome(appContainer, params);
        } 
        else if (hash.startsWith('#/veiculo/')) {
            // Página de detalhes do veículo
            const parts = hash.split('/');
            const vehicleId = parts[2];
            await renderVehicleDetail(appContainer, vehicleId);
        } 
        else if (hash === '#/favoritos') {
            // Meus favoritos
            await renderFavorites(appContainer);
        } 
        else if (hash === '#/comparar') {
            // Comparador
            await renderComparePage(appContainer);
        } 
        else if (hash === '#/admin') {
            // Painel administrativo
            await renderAdminDashboard(appContainer);
        } 
        else {
            // Rota não identificada -> redireciona para Home
            window.location.hash = '#/';
        }
    } catch (e) {
        console.error("Erro no roteamento:", e);
        appContainer.innerHTML = `
        <div style="text-align:center; padding:5rem 1.5rem;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem; color:#ef4444; margin-bottom:1.5rem;"></i>
            <h2>Erro Interno na Aplicação</h2>
            <p style="color:var(--text-muted); margin-top:0.5rem; margin-bottom:2rem;">Ocorreu uma falha inesperada ao tentar renderizar a página.</p>
            <button class="btn btn-primary" onclick="window.location.reload()"><i class="fa-solid fa-rotate"></i> Recarregar Página</button>
        </div>`;
    }
}

/**
 * Utilitário para parsear parâmetros passados após o hash de forma simples (ex: "#/?brand=Chevrolet")
 */
function getHashParams() {
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex === -1) return {};
    
    const query = hash.slice(qIndex + 1);
    const pairs = query.split('&');
    const params = {};
    
    pairs.forEach(pair => {
        const [key, val] = pair.split('=');
        if (key) {
            params[decodeURIComponent(key)] = decodeURIComponent(val || '');
        }
    });
    
    return params;
}

/**
 * Inicialização do Ciclo de Vida da Aplicação
 */
function initApp() {
    // 1. Aplica o Tema Ativo Inicial
    const currentConfig = getConfig();
    applyTheme(currentConfig);
    
    // 2. Escuta mudanças globais de customização para re-aplicar o tema dinamicamente
    window.addEventListener("catalog_config_updated", () => {
        const updatedConfig = getConfig();
        applyTheme(updatedConfig);
    });

    // 3. Registra eventos de rota
    window.addEventListener('hashchange', router);
    window.addEventListener('load', router);
}

// Inicializa a aplicação
initApp();
