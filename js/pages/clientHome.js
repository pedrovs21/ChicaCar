import { getVehicles } from '../storage.js';
import { getConfig } from '../config.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { renderFooter } from '../components/footer.js';
import { renderVehicleCard } from '../components/vehicleCard.js';
import { renderFilterPanel, initFilterEvents } from '../components/filterPanel.js';
import { trackPageView, trackWhatsappClick, trackPhoneClick } from '../analytics.js';

let homeState = {
    filters: {},
    searchQuery: '',
    sort: 'recent' // recent, price_asc, price_desc, year_desc, km_asc
};

export async function renderClientHome(container, initialFilters = {}) {
    trackPageView();
    
    // Mescla os filtros iniciais se houver (ex: quando volta de outra página ou usa URL query)
    homeState.filters = { ...homeState.filters, ...initialFilters };

    const allVehicles = await getVehicles();
    const config = getConfig();
    
    // Filtra apenas veículos ativos no painel
    const activeVehicles = allVehicles.filter(v => v.active !== false);

    // Salva favoritos e comparador do localstorage
    const favorites = JSON.parse(localStorage.getItem('catalog_favorites') || '[]');
    const compared = JSON.parse(localStorage.getItem('catalog_compared_ids') || '[]');

    // Função interna para filtrar e ordenar estoque
    function getFilteredStock() {
        return activeVehicles.filter(car => {
            // Filtro por Texto Geral (Pesquisa do Hero)
            if (homeState.searchQuery) {
                const query = homeState.searchQuery.toLowerCase();
                const matchesText = 
                    car.brand.toLowerCase().includes(query) ||
                    car.model.toLowerCase().includes(query) ||
                    car.version.toLowerCase().includes(query) ||
                    (car.description && car.description.toLowerCase().includes(query)) ||
                    car.bodyType.toLowerCase().includes(query) ||
                    car.fuel.toLowerCase().includes(query);
                if (!matchesText) return false;
            }

            // Filtros da barra lateral
            const f = homeState.filters;
            if (f.brand && car.brand !== f.brand) return false;
            if (f.model && car.model !== f.model) return false;
            
            // Faixa de preço (considera preço promocional se houver)
            const activePrice = car.promoPrice || car.price;
            if (f.priceMin && activePrice < parseFloat(f.priceMin)) return false;
            if (f.priceMax && activePrice > parseFloat(f.priceMax)) return false;
            
            // Faixa de ano
            if (f.yearMin && car.yearModel < parseInt(f.yearMin)) return false;
            if (f.yearMax && car.yearModel > parseInt(f.yearMax)) return false;
            
            // Resolução, sistema, tamanho máximo, tecnologia e cor
            if (f.transmission && car.transmission !== f.transmission) return false;
            if (f.fuel && car.fuel !== f.fuel) return false;
            if (f.kmMax && car.km > parseInt(f.kmMax)) return false;
            if (f.bodyType && car.bodyType !== f.bodyType) return false;
            if (f.color && car.color !== f.color) return false;

            return true;
        }).sort((a, b) => {
            const priceA = a.promoPrice || a.price;
            const priceB = b.promoPrice || b.price;

            switch (homeState.sort) {
                case 'price_asc':
                    return priceA - priceB;
                case 'price_desc':
                    return priceB - priceA;
                case 'year_desc':
                    return b.yearModel - a.yearModel;
                case 'km_asc':
                    return a.km - b.km;
                case 'recent':
                default:
                    // Ordena por data (veículos novos no topo)
                    return new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0);
            }
        });
    }

    const filteredStock = getFilteredStock();

    // Veículos em Destaque (mostrados no início apenas se não houver filtros ativos)
    const featuredVehicles = activeVehicles.filter(v => v.featured && v.status === 'available');

    // Layout principal da Home
    container.innerHTML = `
    <!-- HEADER -->
    <header>${renderHeader('home', favorites.length)}</header>

    <!-- HERO SECTION -->
    <section class="hero" style="--hero-banner-url: url('${config.logoUrl || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"}')">
        <div class="hero-content">
            <h1 class="hero-title">Conserto de TV com quem entende do assunto</h1>
            <p class="hero-subtitle">Diagnóstico, reparo e venda de TVs novas: atendimento rápido, transparente e com garantia.</p>
            <div class="hero-search-wrapper">
                <input type="text" class="hero-search-input" id="hero-search" placeholder="Busque por marca, tamanho ou modelo..." value="${homeState.searchQuery}">
                <button class="btn btn-primary hero-search-btn" id="hero-search-btn">
                    <i class="fa-solid fa-magnifying-glass"></i> Ver TVs à venda
                </button>
            </div>
        </div>
    </section>

    <!-- MAIN BODY -->
    <main class="main-container">
        <section style="margin:3rem 0; padding:2rem; border-radius:var(--border-radius); background:linear-gradient(135deg,var(--primary-color),var(--secondary-color)); color:white; box-shadow:var(--shadow-md);">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:1.5rem; flex-wrap:wrap;">
                <div><span style="font-weight:700; letter-spacing:.08em; text-transform:uppercase; font-size:.8rem; opacity:.85;">Nosso principal serviço</span><h2 style="font-size:clamp(1.5rem,3vw,2.2rem); margin:.35rem 0 .6rem;">Assistência técnica para TVs</h2><p style="max-width:650px; line-height:1.6; opacity:.95;">Reparamos TVs LED, LCD, OLED e Smart TVs. Avaliamos defeitos de imagem, som, placa, tela e conexão, sempre com orçamento antes do reparo.</p></div>
                <a href="https://wa.me/${config.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de solicitar um orçamento para conserto da minha TV.')}" target="_blank" class="btn" style="background:#fff;color:var(--primary-color);white-space:nowrap;"><i class="fa-brands fa-whatsapp"></i> Solicitar orçamento</a>
            </div>
        </section>
        <section style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin:-1.5rem 0 3rem;">
            <div class="detail-card" style="padding:1.25rem;"><i class="fa-solid fa-magnifying-glass" style="color:var(--primary-color);font-size:1.3rem;"></i><h3 style="margin:.7rem 0 .4rem;">Diagnóstico preciso</h3><p style="color:var(--text-muted);font-size:.9rem;line-height:1.5;">Analisamos o defeito e explicamos as opções de reparo.</p></div>
            <div class="detail-card" style="padding:1.25rem;"><i class="fa-solid fa-screwdriver-wrench" style="color:var(--primary-color);font-size:1.3rem;"></i><h3 style="margin:.7rem 0 .4rem;">Reparo com garantia</h3><p style="color:var(--text-muted);font-size:.9rem;line-height:1.5;">Serviço técnico cuidadoso e peças compatíveis de qualidade.</p></div>
            <div class="detail-card" style="padding:1.25rem;"><i class="fa-solid fa-tv" style="color:var(--primary-color);font-size:1.3rem;"></i><h3 style="margin:.7rem 0 .4rem;">TVs novas</h3><p style="color:var(--text-muted);font-size:.9rem;line-height:1.5;">Também ajudamos você a escolher a televisão ideal.</p></div>
        </section>
        <!-- Vitrine de Destaques (Apenas se nenhuma pesquisa/filtro estiver ativo) -->
        ${(featuredVehicles.length > 0 && !homeState.searchQuery && Object.keys(homeState.filters).length === 0) ? `
            <div style="margin-bottom: 3rem;">
                <div class="section-header">
                    <h2 class="section-title">TVs em destaque</h2>
                </div>
                <div class="vehicles-grid">
                    ${featuredVehicles.slice(0, 3).map(car => renderVehicleCard(car, favorites.includes(car.id), compared.includes(car.id))).join('')}
                </div>
            </div>
        ` : ''}

        <!-- Listagem Geral com Sidebar de Filtros -->
        <div class="section-header" style="margin-top: 1rem;">
            <h2 class="section-title">TVs novas à venda</h2>
        </div>
        
        <div class="client-layout">
            <!-- Sidebar de Filtros -->
            <aside id="filters-container">
                ${renderFilterPanel(activeVehicles, homeState.filters)}
            </aside>

            <!-- Grid de Veículos e Cabeçalho de Resultados -->
            <div>
                <div class="results-count-container">
                    <span style="font-weight: 600; color:var(--text-muted);" id="results-count-label">
                        ${filteredStock.length} ${filteredStock.length === 1 ? 'TV encontrada' : 'TVs encontradas'}
                    </span>
                    
                    <div class="sort-container">
                        <label for="sort-select">Ordenar por:</label>
                        <select class="filter-control" id="sort-select" style="padding:0.4rem; font-size:0.85rem; width:170px;">
                            <option value="recent" ${homeState.sort === 'recent' ? 'selected' : ''}>Mais Recentes</option>
                            <option value="price_asc" ${homeState.sort === 'price_asc' ? 'selected' : ''}>Menor Preço</option>
                            <option value="price_desc" ${homeState.sort === 'price_desc' ? 'selected' : ''}>Maior Preço</option>
                            <option value="year_desc" ${homeState.sort === 'year_desc' ? 'selected' : ''}>Mais Recentes</option>
                            <option value="km_asc" ${homeState.sort === 'km_asc' ? 'selected' : ''}>Menor Tamanho</option>
                        </select>
                    </div>
                </div>

                <div class="vehicles-grid" id="stock-grid">
                    ${filteredStock.length > 0 
                        ? filteredStock.map(car => renderVehicleCard(car, favorites.includes(car.id), compared.includes(car.id))).join('')
                        : `<div style="grid-column: 1/-1; text-align:center; padding:4rem; color:var(--text-muted);">
                             <i class="fa-solid fa-tv" style="font-size:3rem; margin-bottom:1.5rem;"></i>
                             <p>Nenhuma TV encontrada com os filtros selecionados.</p>
                           </div>`
                    }
                </div>
            </div>
        </div>
    </main>

    <!-- SEÇÃO SOBRE A LOJA -->
    <section id="sobre" style="background-color: var(--bg-card); border-top:1px solid var(--border-color); border-bottom:1px solid var(--border-color); padding: 4rem 1.5rem;">
        <div class="main-container" style="margin:0 auto; display:grid; grid-template-columns: 1fr 1fr; gap:3rem; align-items:center;">
            <div>
                <h2 class="section-title" style="margin-bottom: 1.5rem;">${config.aboutTitle}</h2>
                <p style="color:var(--text-muted); line-height:1.7; font-size:1.05rem; margin-bottom:1.5rem;">${config.aboutText}</p>
                <div style="display:flex; gap:2rem;">
                    <div style="text-align:center;">
                        <span style="font-size:2.5rem; font-weight:800; color:var(--primary-color); display:block;">${config.statsVehiclesSold}</span>
                        <span style="font-size:0.85rem; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Atendimentos</span>
                    </div>
                    <div style="text-align:center;">
                        <span style="font-size:2.5rem; font-weight:800; color:var(--primary-color); display:block;">${config.statsYearsInMarket}</span>
                        <span style="font-size:0.85rem; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Anos de História</span>
                    </div>
                    <div style="text-align:center;">
                        <span style="font-size:2.5rem; font-weight:800; color:var(--primary-color); display:block;">${config.statsCustomerSatisfaction}</span>
                        <span style="font-size:0.85rem; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Satisfação</span>
                    </div>
                </div>
            </div>
            <div style="border-radius:var(--border-radius); overflow:hidden; box-shadow:var(--shadow-lg); height:350px; background-color:#e2e8f0;">
                <img src="https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80" alt="Televisor em ambiente residencial" style="width:100%; height:100%; object-fit:cover;">
            </div>
        </div>
    </section>

    <!-- SEÇÃO CONTATO -->
    <section id="contato" class="main-container" style="margin:4rem auto; display:grid; grid-template-columns: 1fr 1.5fr; gap:3rem;">
        <div>
            <h2 class="section-title" style="margin-bottom: 1.5rem;">Fale Conosco</h2>
            <p style="color:var(--text-muted); margin-bottom:2rem; line-height:1.5;">Sua TV não liga, está sem imagem ou com linhas na tela? Fale conosco para solicitar um orçamento ou encontrar sua nova TV.</p>
            
            <ul class="contact-info-list" style="font-size:1rem; gap:1.2rem;">
                <li>
                    <i class="fa-solid fa-location-dot" style="font-size:1.2rem;"></i>
                    <div>
                        <strong style="color:var(--text-color); display:block;">Endereço:</strong>
                        <span>${config.address}</span>
                    </div>
                </li>
                <li>
                    <i class="fa-solid fa-phone" style="font-size:1.2rem;"></i>
                    <div>
                        <strong style="color:var(--text-color); display:block;">Telefone:</strong>
                        <span><a href="tel:${config.phone.replace(/\D/g, '')}">${config.phone}</a></span>
                    </div>
                </li>
                <li>
                    <i class="fa-brands fa-whatsapp" style="font-size:1.2rem; color:#25d366;"></i>
                    <div>
                        <strong style="color:var(--text-color); display:block;">WhatsApp:</strong>
                        <span><a href="https://wa.me/${config.whatsapp}" target="_blank">${config.whatsapp}</a></span>
                    </div>
                </li>
                <li>
                    <i class="fa-solid fa-envelope" style="font-size:1.2rem;"></i>
                    <div>
                        <strong style="color:var(--text-color); display:block;">E-mail:</strong>
                        <span><a href="mailto:${config.email}">${config.email}</a></span>
                    </div>
                </li>
                <li>
                    <i class="fa-solid fa-clock" style="font-size:1.2rem;"></i>
                    <div>
                        <strong style="color:var(--text-color); display:block;">Horários de Funcionamento:</strong>
                        <span>${config.hours}</span>
                    </div>
                </li>
            </ul>
        </div>
        
        <!-- Formulário de Mensagem Direta -->
        <div class="detail-card">
            <h3 style="margin-bottom:1.5rem; font-size:1.3rem;"><i class="fa-solid fa-paper-plane" style="color:var(--primary-color);"></i> Envie uma Mensagem Direta</h3>
            <form id="home-contact-form">
                <div class="admin-form-row">
                    <div class="form-group">
                        <label for="c-name">Seu Nome *</label>
                        <input type="text" class="form-input" id="c-name" placeholder="Ex: João Silva" required>
                    </div>
                    <div class="form-group">
                        <label for="c-phone">Seu Telefone *</label>
                        <input type="tel" class="form-input" id="c-phone" placeholder="Ex: (11) 98888-7777" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="c-message">Mensagem / Dúvida *</label>
                    <textarea class="form-input" id="c-message" rows="4" placeholder="Ex.: Minha TV liga, mas está sem imagem. Gostaria de solicitar um orçamento." required style="resize:vertical;"></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%; padding:0.8rem;">
                    Enviar Contato
                </button>
            </form>
        </div>
    </section>

    <!-- FOOTER -->
    <footer>${renderFooter()}</footer>
    `;

    // Inicialização dos eventos do Header
    initHeaderEvents();

    // Inicialização dos Filtros da Sidebar
    initFilterEvents(
        (updatedFilters) => {
            homeState.filters = updatedFilters;
            refreshStockGrid(favorites, compared, getFilteredStock());
        },
        () => {
            // Limpar Filtros
            homeState.filters = {};
            homeState.searchQuery = '';
            const searchInput = document.getElementById('hero-search');
            if (searchInput) searchInput.value = '';
            
            // Recarrega o painel de filtros e a grid
            renderClientHome(container);
        }
    );

    // Eventos de Busca no Hero Banner
    const searchInput = document.getElementById('hero-search');
    const searchBtn = document.getElementById('hero-search-btn');

    if (searchBtn && searchInput) {
        const triggerSearch = () => {
            homeState.searchQuery = searchInput.value;
            refreshStockGrid(favorites, compared, getFilteredStock());
        };
        searchBtn.addEventListener('click', triggerSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') triggerSearch();
        });
    }

    // Evento de Ordenação
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            homeState.sort = e.target.value;
            refreshStockGrid(favorites, compared, getFilteredStock());
        });
    }

    // Eventos na Grid de Veículos: Favoritos, Comparador, Envio de Formulário
    bindGridEvents(container, favorites, compared);
    bindContactForm();
}

/**
 * Função para atualizar apenas a grid de veículos e contagem de resultados, sem re-renderizar o Header/Hero/Sobre.
 */
function refreshStockGrid(favorites, compared, filteredStock) {
    const stockGrid = document.getElementById('stock-grid');
    const countLabel = document.getElementById('results-count-label');
    
    if (countLabel) {
        countLabel.innerText = `${filteredStock.length} ${filteredStock.length === 1 ? 'TV encontrada' : 'TVs encontradas'}`;
    }

    if (stockGrid) {
        if (filteredStock.length > 0) {
            stockGrid.innerHTML = filteredStock.map(car => renderVehicleCard(car, favorites.includes(car.id), compared.includes(car.id))).join('');
        } else {
            stockGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:4rem; color:var(--text-muted);">
                 <i class="fa-solid fa-tv" style="font-size:3rem; margin-bottom:1.5rem; color:var(--primary-color);"></i>
                 <p>Nenhuma TV encontrada com os filtros selecionados.</p>
            </div>`;
        }
    }
}

/**
 * Binds clicks in the vehicle grid (favorites & comparison checkboxes).
 */
function bindGridEvents(container, favorites, compared) {
    container.addEventListener('click', (e) => {
        // Trata clique do botão de Favoritos
        const favBtn = e.target.closest('.card-fav-btn');
        if (favBtn) {
            e.preventDefault();
            e.stopPropagation();
            const id = favBtn.getAttribute('data-fav-id');
            let favs = JSON.parse(localStorage.getItem('catalog_favorites') || '[]');
            
            if (favs.includes(id)) {
                favs = favs.filter(fid => fid !== id);
                favBtn.classList.remove('active');
                favBtn.querySelector('i').className = 'fa-regular fa-heart';
            } else {
                favs.push(id);
                favBtn.classList.add('active');
                favBtn.querySelector('i').className = 'fa-solid fa-heart';
            }
            
            localStorage.setItem('catalog_favorites', JSON.stringify(favs));
            
            // Atualiza contadores visíveis no Header
            const badges = document.querySelectorAll('.nav-fav-badge');
            badges.forEach(b => b.innerText = favs.length);
        }
    });

    // Trata alteração dos checkboxes de comparação
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

/**
 * Binds direct institutional email/contact form submission
 */
function bindContactForm() {
    const form = document.getElementById('home-contact-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('c-name').value;
            const phone = document.getElementById('c-phone').value;
            const message = document.getElementById('c-message').value;

            // Importa storage para registrar o lead no banco
            const storage = await import('../storage.js');
            await storage.saveLead({
                name,
                phone,
                message,
                origin: "Formulário da Página Inicial",
                vehicleId: null
            });

            trackPhoneClick(); // Conta estatística de interesse geral
            
            alert(`Obrigado pelo contato, ${name}! Entraremos em contato via WhatsApp/Telefone em breve.`);
            form.reset();
        });
    }
}
