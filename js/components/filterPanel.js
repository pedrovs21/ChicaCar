export function renderFilterPanel(tvs = [], filters = {}) {
    const values = key => [...new Set(tvs.map(tv => tv[key]).filter(Boolean))].sort();
    const selected = (value, current) => String(value) === String(current) ? 'selected' : '';
    const brands = values('brand');
    const models = [...new Set(tvs.filter(tv => !filters.brand || tv.brand === filters.brand).map(tv => tv.model))].sort();
    const resolutions = values('transmission');
    const systems = values('fuel');
    const technologies = values('bodyType');
    return `<div class="sidebar-filters"><h3 style="font-size:1.2rem;margin-bottom:1.2rem;display:flex;justify-content:space-between;align-items:center;"><span><i class="fa-solid fa-sliders"></i> Filtros</span><button id="btn-clear-filters" class="btn btn-secondary" style="padding:.3rem .6rem;font-size:.75rem;border-radius:4px;">Limpar</button></h3>
      <div class="filter-group"><label class="filter-title">Marca</label><select class="filter-control" id="filter-brand"><option value="">Todas as marcas</option>${brands.map(v => `<option value="${v}" ${selected(v, filters.brand)}>${v}</option>`).join('')}</select></div>
      <div class="filter-group"><label class="filter-title">Modelo</label><select class="filter-control" id="filter-model"><option value="">Todos os modelos</option>${models.map(v => `<option value="${v}" ${selected(v, filters.model)}>${v}</option>`).join('')}</select></div>
      <div class="filter-group"><label class="filter-title">Preço</label><div class="filter-range-inputs"><input type="number" class="filter-control" id="filter-price-min" placeholder="Mínimo (R$)" value="${filters.priceMin || ''}"><input type="number" class="filter-control" id="filter-price-max" placeholder="Máximo (R$)" value="${filters.priceMax || ''}"></div></div>
      <div class="filter-group"><label class="filter-title">Resolução</label><select class="filter-control" id="filter-transmission"><option value="">Todas</option>${resolutions.map(v => `<option value="${v}" ${selected(v, filters.transmission)}>${v}</option>`).join('')}</select></div>
      <div class="filter-group"><label class="filter-title">Sistema</label><select class="filter-control" id="filter-fuel"><option value="">Todos</option>${systems.map(v => `<option value="${v}" ${selected(v, filters.fuel)}>${v}</option>`).join('')}</select></div>
      <div class="filter-group"><label class="filter-title">Tamanho máximo</label><input type="number" class="filter-control" id="filter-km-max" placeholder="Até (polegadas)" value="${filters.kmMax || ''}"></div>
      <div class="filter-group"><label class="filter-title">Tecnologia</label><select class="filter-control" id="filter-body-type"><option value="">Todas</option>${technologies.map(v => `<option value="${v}" ${selected(v, filters.bodyType)}>${v}</option>`).join('')}</select></div>
      <div class="filter-group"><label class="filter-title">Cor</label><select class="filter-control" id="filter-color"><option value="">Todas</option>${values('color').map(v => `<option value="${v}" ${selected(v, filters.color)}>${v}</option>`).join('')}</select></div>
    </div>`;
}

export function initFilterEvents(onChange, onClear) {
    const ids = ['filter-brand','filter-model','filter-price-min','filter-price-max','filter-transmission','filter-fuel','filter-km-max','filter-body-type','filter-color'];
    const collect = () => onChange({ brand: document.getElementById('filter-brand').value, model: document.getElementById('filter-model').value, priceMin: document.getElementById('filter-price-min').value, priceMax: document.getElementById('filter-price-max').value, transmission: document.getElementById('filter-transmission').value, fuel: document.getElementById('filter-fuel').value, kmMax: document.getElementById('filter-km-max').value, bodyType: document.getElementById('filter-body-type').value, color: document.getElementById('filter-color').value });
    ids.forEach(id => { const element = document.getElementById(id); if (element) element.addEventListener(element.tagName === 'SELECT' ? 'change' : 'blur', collect); });
    document.getElementById('btn-clear-filters')?.addEventListener('click', onClear);
}
