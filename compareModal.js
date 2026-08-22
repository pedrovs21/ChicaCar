/**
 * Renders the comparison table grid for selected vehicles.
 * @param {Array} cars - List of vehicles to compare (max 3)
 */
export function renderCompareGrid(cars = [], onRemove) {
    if (cars.length === 0) {
        return `
        <div style="text-align:center; padding:3rem 1.5rem; color:var(--text-muted);">
            <i class="fa-solid fa-code-compare" style="font-size:3rem; margin-bottom:1rem; color:var(--primary-color);"></i>
            <p>Nenhum veículo selecionado para comparação.</p>
            <p style="font-size:0.85rem; margin-top:0.5rem;">Marque a caixa "Comparar" nos cards de veículos na página inicial.</p>
            <a href="#/" class="btn btn-primary" style="margin-top:1.5rem;">Ir para o Estoque</a>
        </div>
        `;
    }

    // Especificações a comparar
    const specFields = [
        { label: "Preço", key: (car) => car.promoPrice ? `<span style="color:#ef4444; font-weight:700;">R$ ${car.promoPrice.toLocaleString('pt-BR')}</span> <span style="font-size:0.75rem; text-decoration:line-through; color:var(--text-muted);">R$ ${car.price.toLocaleString('pt-BR')}</span>` : `R$ ${car.price.toLocaleString('pt-BR')}` },
        { label: "Ano", key: (car) => `${car.yearMfg}/${car.yearModel}` },
        { label: "Quilometragem", key: (car) => car.km === 0 ? 'Zero Km' : `${car.km.toLocaleString('pt-BR')} km` },
        { label: "Câmbio", key: "transmission" },
        { label: "Combustível", key: "fuel" },
        { label: "Motor", key: "engine" },
        { label: "Potência", key: "power" },
        { label: "Tração", key: "traction" },
        { label: "Carroceria", key: "bodyType" },
        { label: "Cor", key: "color" },
        { label: "Portas", key: "doors" },
        { label: "Placa final", key: "plateEnd" },
        { label: "Opcionais principais", key: (car) => car.options ? car.options.slice(0, 8).join(', ') + (car.options.length > 8 ? '...' : '') : 'Nenhum' }
    ];

    // Monta o cabeçalho com imagens e botões de remoção
    let headerHtml = `<div class="compare-cell compare-row-title">Especificações</div>`;
    cars.forEach(car => {
        const photo = car.photos && car.photos.length > 0 ? car.photos[0] : 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=200&q=80';
        headerHtml += `
        <div class="compare-cell compare-header-cell">
            <img src="${photo}" alt="${car.brand} ${car.model}" style="width:100%; height:80px; object-fit:cover; border-radius:4px; margin-bottom:0.5rem;">
            <div style="font-weight:700; font-size:0.95rem; line-height:1.2;">${car.brand} ${car.model}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.3rem;">${car.version}</div>
            <button class="compare-remove-btn" data-remove-id="${car.id}">
                <i class="fa-solid fa-trash-can"></i> Remover
            </button>
        </div>
        `;
    });

    // Monta as linhas de atributos
    let rowsHtml = '';
    specFields.forEach(field => {
        rowsHtml += `<div class="compare-cell compare-row-title" style="font-weight:600;">${field.label}</div>`;
        cars.forEach(car => {
            let val = '';
            if (typeof field.key === 'function') {
                val = field.key(car);
            } else {
                val = car[field.key] || '-';
            }
            rowsHtml += `<div class="compare-cell">${val}</div>`;
        });
    });

    // Ajusta o número de colunas da grid
    const columnsCount = cars.length + 1;

    return `
    <div class="compare-grid" style="grid-template-columns: 180px repeat(${cars.length}, 1fr);">
        ${headerHtml}
        ${rowsHtml}
    </div>
    `;
}

/**
 * Liga eventos de clique de remoção
 */
export function initCompareEvents(onRemove) {
    document.querySelectorAll('.compare-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-remove-id');
            if (onRemove) onRemove(id);
        });
    });
}
