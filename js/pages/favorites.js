import { getVehicles } from '../storage.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { renderFooter } from '../components/footer.js';
import { renderVehicleCard } from '../components/vehicleCard.js';

export async function renderFavorites(container) {
    const allVehicles = await getVehicles();
    const favorites = JSON.parse(localStorage.getItem('catalog_favorites') || '[]');
    const compared = JSON.parse(localStorage.getItem('catalog_compared_ids') || '[]');
    
    // Filtra veículos favorited
    const favVehicles = allVehicles.filter(v => favorites.includes(v.id) && v.active !== false);

    container.innerHTML = `
    <header>${renderHeader('favorites', favorites.length)}</header>
    
    <main class="main-container" style="min-height: 60vh;">
        <div class="section-header">
            <h2 class="section-title">Minhas TVs favoritas</h2>
        </div>
        
        ${favVehicles.length > 0 ? `
            <div class="vehicles-grid">
                ${favVehicles.map(car => renderVehicleCard(car, true, compared.includes(car.id))).join('')}
            </div>
        ` : `
            <div style="text-align:center; padding: 4rem 1.5rem; color:var(--text-muted);">
                <i class="fa-regular fa-heart" style="font-size:3.5rem; margin-bottom:1.5rem; color:var(--primary-color);"></i>
                <p>Você ainda não favoritou nenhuma TV.</p>
                <p style="font-size:0.9rem; margin-top:0.5rem;">Clique no coração de uma TV para adicioná-la aqui.</p>
                <a href="#/" class="btn btn-primary" style="margin-top:2rem;">Ver TVs à venda</a>
            </div>
        `}
    </main>
    
    <footer>${renderFooter()}</footer>
    `;

    initHeaderEvents();

    // Adiciona cliques para remover favoritos dinamicamente
    container.addEventListener('click', (e) => {
        const favBtn = e.target.closest('.card-fav-btn');
        if (favBtn) {
            e.preventDefault();
            e.stopPropagation();
            const id = favBtn.getAttribute('data-fav-id');
            let favs = JSON.parse(localStorage.getItem('catalog_favorites') || '[]');
            
            favs = favs.filter(fid => fid !== id);
            localStorage.setItem('catalog_favorites', JSON.stringify(favs));
            
            // Re-renderiza a página inteira de favoritos
            renderFavorites(container);
        }
    });

    // Trata checkboxes de comparação
    container.addEventListener('change', (e) => {
        const compareCb = e.target.closest('.compare-checkbox');
        if (compareCb) {
            const id = compareCb.getAttribute('data-compare-id');
            let compIds = JSON.parse(localStorage.getItem('catalog_compared_ids') || '[]');
            
            if (compareCb.checked) {
                if (compIds.length >= 3) {
                    alert("Você pode comparar no máximo 3 TVs simultaneamente.");
                    compareCb.checked = false;
                } else if (!compIds.includes(id)) {
                    compIds.push(id);
                }
            } else {
                compIds = compIds.filter(cid => cid !== id);
            }
            
            localStorage.setItem('catalog_compared_ids', JSON.stringify(compIds));
        }
    });
}
