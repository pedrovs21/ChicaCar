/**
 * Renders the filter panel dynamically extracting options from active stock.
 * @param {Array} allVehicles - List of all vehicles in stock
 * @param {Object} activeFilters - Currently applied filters
 */
export function renderFilterPanel(allVehicles = [], activeFilters = {}) {
    // Extrai valores únicos do estoque para popular os filtros dinamicamente
    const brands = [...new Set(allVehicles.map(v => v.brand))].sort();
    
    // Se houver marca selecionada, filtra os modelos que aparecem no dropdown de modelo!
    const selectedBrand = activeFilters.brand || '';
    const models = [...new Set(
        allVehicles
            .filter(v => !selectedBrand || v.brand === selectedBrand)
            .map(v => v.model)
    )].sort();

    const fuels = [...new Set(allVehicles.map(v => v.fuel))].sort();
    const colors = [...new Set(allVehicles.map(v => v.color))].sort();
    const bodies = [...new Set(allVehicles.map(v => v.bodyType))].sort();

    // Utilitários de seleção
    const isSelected = (val, filterVal) => String(val) === String(filterVal) ? 'selected' : '';

    return `
    <div class="sidebar-filters">
        <h3 style="font-size: 1.2rem; margin-bottom: 1.2rem; display:flex; justify-content:space-between; align-items:center;">
            <span><i class="fa-solid fa-sliders"></i> Filtros</span>
            <button id="btn-clear-filters" class="btn btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.75rem; border-radius:4px;">Limpar</button>
        </h3>

        <!-- Marca -->
        <div class="filter-group">
            <label class="filter-title">Marca</label>
            <select class="filter-control" id="filter-brand">
                <option value="">Todas as Marcas</option>
                ${brands.map(b => `<option value="${b}" ${isSelected(b, activeFilters.brand)}>${b}</option>`).join('')}
            </select>
        </div>

        <!-- Modelo -->
        <div class="filter-group">
            <label class="filter-title">Modelo</label>
            <select class="filter-control" id="filter-model" ${models.length === 0 ? 'disabled' : ''}>
                <option value="">Todos os Modelos</option>
                ${models.map(m => `<option value="${m}" ${isSelected(m, activeFilters.model)}>${m}</option>`).join('')}
            </select>
        </div>

        <!-- Preço Mínimo e Máximo -->
        <div class="filter-group">
            <label class="filter-title">Preço</label>
            <div class="filter-range-inputs">
                <input type="number" class="filter-control" id="filter-price-min" placeholder="Mínimo (R$)" value="${activeFilters.priceMin || ''}">
                <input type="number" class="filter-control" id="filter-price-max" placeholder="Máximo (R$)" value="${activeFilters.priceMax || ''}">
            </div>
        </div>

        <!-- Ano Mínimo e Máximo -->
        <div class="filter-group">
            <label class="filter-title">Ano Modelo</label>
            <div class="filter-range-inputs">
                <input type="number" class="filter-control" id="filter-year-min" placeholder="De" value="${activeFilters.yearMin || ''}">
                <input type="number" class="filter-control" id="filter-year-max" placeholder="Até" value="${activeFilters.yearMax || ''}">
            </div>
        </div>

        <!-- Câmbio -->
        <div class="filter-group">
            <label class="filter-title">Câmbio</label>
            <select class="filter-control" id="filter-transmission">
                <option value="">Todos</option>
                <option value="Manual" ${isSelected('Manual', activeFilters.transmission)}>Manual</option>
                <option value="Automático" ${isSelected('Automático', activeFilters.transmission)}>Automático</option>
            </select>
        </div>

        <!-- Combustível -->
        <div class="filter-group">
            <label class="filter-title">Combustível</label>
            <select class="filter-control" id="filter-fuel">
                <option value="">Todos</option>
                ${fuels.map(f => `<option value="${f}" ${isSelected(f, activeFilters.fuel)}>${f}</option>`).join('')}
            </select>
        </div>

        <!-- KM Máximo -->
        <div class="filter-group">
            <label class="filter-title">Quilometragem Máxima</label>
            <input type="number" class="filter-control" id="filter-km-max" placeholder="Até (km)" value="${activeFilters.kmMax || ''}">
        </div>

        <!-- Carroceria -->
        <div class="filter-group">
            <label class="filter-title">Carroceria</label>
            <select class="filter-control" id="filter-body-type">
                <option value="">Todas</option>
                ${bodies.map(b => `<option value="${b}" ${isSelected(b, activeFilters.bodyType)}>${b}</option>`).join('')}
            </select>
        </div>

        <!-- Cor -->
        <div class="filter-group">
            <label class="filter-title">Cor</label>
            <select class="filter-control" id="filter-color">
                <option value="">Todas</option>
                ${colors.map(c => `<option value="${c}" ${isSelected(c, activeFilters.color)}>${c}</option>`).join('')}
            </select>
        </div>
    </div>
    `;
}

/**
 * Binds change events on filters and fires a callback.
 */
export function initFilterEvents(onFilterChange, onClearFilters) {
    const fields = [
        'filter-brand', 'filter-model', 'filter-price-min', 'filter-price-max',
        'filter-year-min', 'filter-year-max', 'filter-transmission',
        'filter-fuel', 'filter-km-max', 'filter-body-type', 'filter-color'
    ];

    function handleFilterChange() {
        const filters = {
            brand: document.getElementById('filter-brand').value,
            model: document.getElementById('filter-model').value,
            priceMin: document.getElementById('filter-price-min').value,
            priceMax: document.getElementById('filter-price-max').value,
            yearMin: document.getElementById('filter-year-min').value,
            yearMax: document.getElementById('filter-year-max').value,
            transmission: document.getElementById('filter-transmission').value,
            fuel: document.getElementById('filter-fuel').value,
            kmMax: document.getElementById('filter-km-max').value,
            bodyType: document.getElementById('filter-body-type').value,
            color: document.getElementById('filter-color').value
        };
        onFilterChange(filters);
    }

    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Dropdowns
            if (el.tagName === 'SELECT') {
                el.addEventListener('change', handleFilterChange);
            } else {
                // Inputs numéricos (debounce leve ou dispara ao sair/apertar Enter)
                el.addEventListener('blur', handleFilterChange);
                el.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') handleFilterChange();
                });
            }
        }
    });

    const clearBtn = document.getElementById('btn-clear-filters');
    if (clearBtn && onClearFilters) {
        clearBtn.addEventListener('click', onClearFilters);
    }
}
