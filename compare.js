import { getVehicles } from '../storage.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { renderFooter } from '../components/footer.js';
import { renderCompareGrid, initCompareEvents } from '../components/compareModal.js';

export async function renderComparePage(container) {
    const allVehicles = await getVehicles();
    const favorites = JSON.parse(localStorage.getItem('catalog_favorites') || '[]');
    const comparedIds = JSON.parse(localStorage.getItem('catalog_compared_ids') || '[]');
    
    // Filtra veículos no comparador
    const comparedVehicles = allVehicles.filter(v => comparedIds.includes(v.id));

    container.innerHTML = `
    <header>${renderHeader('compare', favorites.length)}</header>
    
    <main class="main-container" style="min-height: 60vh;">
        <div class="section-header">
            <h2 class="section-title">Comparação de Veículos</h2>
        </div>
        
        <div id="compare-grid-wrapper" style="margin-top: 1.5rem; overflow-x:auto;">
            ${renderCompareGrid(comparedVehicles)}
        </div>
    </main>
    
    <footer>${renderFooter()}</footer>
    `;

    initHeaderEvents();

    initCompareEvents((idToRemove) => {
        let compIds = JSON.parse(localStorage.getItem('catalog_compared_ids') || '[]');
        compIds = compIds.filter(cid => cid !== idToRemove);
        localStorage.setItem('catalog_compared_ids', JSON.stringify(compIds));
        
        // Re-renderiza a página
        renderComparePage(container);
    });
}
