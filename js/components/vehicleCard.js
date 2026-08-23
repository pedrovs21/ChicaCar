/** Renderiza um card de TV à venda. */
export function renderVehicleCard(tv, isFav = false, isCompared = false) {
    const formattedPrice = tv.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const promoPrice = tv.promoPrice ? tv.promoPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null;
    const photo = tv.photos?.[0] || 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=900&q=80';
    const badges = tv.status === 'sold' ? '<span class="badge badge-sold">Vendido</span>' : `${tv.featured ? '<span class="badge badge-featured"><i class="fa-solid fa-star"></i> Destaque</span>' : ''}${tv.promoPrice ? '<span class="badge badge-new">Oferta</span>' : ''}`;
    return `
    <article class="vehicle-card" data-id="${tv.id}">
      <div class="card-img-wrapper"><a href="#/veiculo/${tv.id}"><img src="${photo}" alt="${tv.brand} ${tv.model}" class="card-img" loading="lazy"></a><div class="card-badges">${badges}</div><button class="card-fav-btn ${isFav ? 'active' : ''}" data-fav-id="${tv.id}" title="Favoritar"><i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i></button></div>
      <div class="card-content"><a href="#/veiculo/${tv.id}"><h3 class="card-brand-model">${tv.brand} ${tv.model}</h3><p class="card-version">${tv.version}</p></a>
        <div class="card-specs"><div class="card-spec-item" title="Tamanho"><i class="fa-solid fa-tv"></i><span>${tv.km}\"</span></div><div class="card-spec-item" title="Resolução"><i class="fa-solid fa-display"></i><span>${tv.transmission}</span></div><div class="card-spec-item" title="Sistema"><i class="fa-solid fa-wifi"></i><span>${tv.fuel}</span></div><div class="card-spec-item" title="Tecnologia"><i class="fa-solid fa-sun"></i><span>${tv.bodyType}</span></div></div>
        <div class="card-footer"><div class="card-price-container">${promoPrice ? `<span class="card-promo-label">Oferta especial</span><span class="card-old-price">${formattedPrice}</span><span class="card-price" style="color:#ef4444;">${promoPrice}</span>` : `<span class="card-price">${formattedPrice}</span>`}</div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:.4rem;"><a href="#/veiculo/${tv.id}" class="btn btn-primary" style="padding:.4rem .8rem;font-size:.8rem;border-radius:6px;">Ver detalhes</a><label class="checkbox-label" style="font-size:.75rem;color:var(--text-muted);"><input type="checkbox" class="compare-checkbox" data-compare-id="${tv.id}" ${isCompared ? 'checked' : ''}> Comparar</label></div></div>
      </div>
    </article>`;
}
