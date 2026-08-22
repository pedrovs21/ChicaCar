/**
 * Renders a single vehicle card.
 * @param {Object} car - Vehicle object
 * @param {Boolean} isFav - Whether this vehicle is in the favorites list
 * @param {Boolean} isCompared - Whether this vehicle is selected for comparison
 */
export function renderVehicleCard(car, isFav = false, isCompared = false) {
    const formattedPrice = car.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formattedPromoPrice = car.promoPrice ? car.promoPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null;
    const formattedKm = car.km === 0 ? 'Zero Km' : `${car.km.toLocaleString('pt-BR')} km`;
    
    // Configura badges de status e destaques
    let badgesHtml = '';
    if (car.status === 'sold') {
        badgesHtml += `<span class="badge badge-sold">Vendido</span>`;
    } else if (car.status === 'reserved') {
        badgesHtml += `<span class="badge badge-reserved">Reservado</span>`;
    } else {
        if (car.featured) {
            badgesHtml += `<span class="badge badge-featured"><i class="fa-solid fa-star"></i> Destaque</span>`;
        }
        if (car.km <= 20000 && car.km > 0) {
            badgesHtml += `<span class="badge badge-km">Baixa KM</span>`;
        }
        if (car.promoPrice) {
            badgesHtml += `<span class="badge badge-new">Oferta</span>`;
        }
    }

    const mainPhoto = car.photos && car.photos.length > 0 
        ? car.photos[0] 
        : 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=400&q=80';

    return `
    <article class="vehicle-card" data-id="${car.id}">
        <div class="card-img-wrapper">
            <a href="#/veiculo/${car.id}">
                <img src="${mainPhoto}" alt="${car.brand} ${car.model}" class="card-img" loading="lazy">
            </a>
            <div class="card-badges">
                ${badgesHtml}
            </div>
            <button class="card-fav-btn ${isFav ? 'active' : ''}" data-fav-id="${car.id}" title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
        </div>

        <div class="card-content">
            <a href="#/veiculo/${car.id}">
                <h3 class="card-brand-model">${car.brand} ${car.model}</h3>
                <p class="card-version">${car.version}</p>
            </a>

            <div class="card-specs">
                <div class="card-spec-item" title="Ano de Fabricação / Modelo">
                    <i class="fa-regular fa-calendar"></i>
                    <span>${car.yearMfg}/${car.yearModel}</span>
                </div>
                <div class="card-spec-item" title="Quilometragem">
                    <i class="fa-solid fa-gauge-simple-high"></i>
                    <span>${formattedKm}</span>
                </div>
                <div class="card-spec-item" title="Transmissão">
                    <i class="fa-solid fa-gears"></i>
                    <span>${car.transmission}</span>
                </div>
                <div class="card-spec-item" title="Combustível">
                    <i class="fa-solid fa-gas-pump"></i>
                    <span>${car.fuel}</span>
                </div>
            </div>

            <div class="card-footer">
                <div class="card-price-container">
                    ${formattedPromoPrice ? `
                        <span class="card-promo-label">Oferta Imperdível</span>
                        <span class="card-old-price">${formattedPrice}</span>
                        <span class="card-price" style="color: #ef4444;">${formattedPromoPrice}</span>
                    ` : `
                        <span class="card-price">${formattedPrice}</span>
                    `}
                </div>
                
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.4rem;">
                    <a href="#/veiculo/${car.id}" class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 6px;">Ver Detalhes</a>
                    <label class="checkbox-label" style="font-size:0.75rem; color:var(--text-muted);">
                        <input type="checkbox" class="compare-checkbox" data-compare-id="${car.id}" ${isCompared ? 'checked' : ''}>
                        Comparar
                    </label>
                </div>
            </div>
        </div>
    </article>
    `;
}
