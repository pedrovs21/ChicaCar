import { getConfig } from '../config.js';

export function renderHeader(activePage = 'home', favoritesCount = 0) {
    const config = getConfig();
    const logoHtml = config.logoUrl 
        ? `<img src="${config.logoUrl}" alt="${config.companyName}" class="logo-img">`
        : `<i class="fa-solid fa-tv" style="font-size: 1.8rem; color: var(--primary-color);"></i>`;

    return `
    <div class="header-container">
        <a href="#/" class="logo-link">
            ${logoHtml}
            <div class="brand-text-wrapper">
                <span class="brand-name">${config.companyName}</span>
                <span class="brand-tagline">${config.tagline}</span>
            </div>
        </a>

        <nav class="nav-menu">
            <a href="#/" class="nav-link ${activePage === 'home' ? 'active' : ''}">TVs à venda</a>
            <a href="#/#sobre" class="nav-link">Sobre</a>
            <a href="#/#contato" class="nav-link">Contato</a>
            <a href="#/favoritos" class="nav-link ${activePage === 'favorites' ? 'active' : ''}">
                Favoritos <span class="nav-fav-badge" id="header-fav-badge">${favoritesCount}</span>
            </a>
            <a href="#/comparar" class="nav-link ${activePage === 'compare' ? 'active' : ''}">Comparar</a>
        </nav>

        <div class="header-actions">
            <a href="tel:${config.phone.replace(/\D/g, '')}" class="btn btn-secondary btn-icon" title="Ligar para a loja">
                <i class="fa-solid fa-phone"></i>
            </a>
            <a href="https://wa.me/${config.whatsapp}" target="_blank" class="btn btn-whatsapp">
                <i class="fa-brands fa-whatsapp"></i> WhatsApp
            </a>
            <button class="mobile-menu-toggle" id="mobile-menu-btn" aria-label="Abrir Menu">
                <i class="fa-solid fa-bars"></i>
            </button>
        </div>
    </div>
    
    <!-- Mobile Drawer -->
    <div class="mobile-drawer" id="mobile-drawer" style="display:none; position:fixed; top:70px; left:0; width:100%; background:var(--bg-card); z-index:99; border-bottom: 1px solid var(--border-color); padding: 1.5rem; flex-direction:column; gap:1rem; box-shadow:var(--shadow-md);">
        <a href="#/" class="nav-link ${activePage === 'home' ? 'active' : ''}" style="font-size:1.1rem; font-weight:600;">TVs à venda</a>
        <a href="#/#sobre" class="nav-link" style="font-size:1.1rem; font-weight:600;">Sobre</a>
        <a href="#/#contato" class="nav-link" style="font-size:1.1rem; font-weight:600;">Contato</a>
        <a href="#/favoritos" class="nav-link ${activePage === 'favorites' ? 'active' : ''}" style="font-size:1.1rem; font-weight:600;">
            Favoritos <span class="nav-fav-badge">${favoritesCount}</span>
        </a>
        <a href="#/comparar" class="nav-link ${activePage === 'compare' ? 'active' : ''}" style="font-size:1.1rem; font-weight:600;">Comparar</a>
        <hr style="border:0; border-top:1px solid var(--border-color); margin: 0.5rem 0;">
        <a href="https://wa.me/${config.whatsapp}" target="_blank" class="btn btn-whatsapp" style="width:100%;">
            <i class="fa-brands fa-whatsapp"></i> Conversar pelo WhatsApp
        </a>
    </div>
    `;
}

export function initHeaderEvents() {
    const toggleBtn = document.getElementById('mobile-menu-btn');
    const drawer = document.getElementById('mobile-drawer');
    if (toggleBtn && drawer) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (drawer.style.display === 'none' || drawer.style.display === '') {
                drawer.style.display = 'flex';
                toggleBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            } else {
                drawer.style.display = 'none';
                toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
            }
        });
        
        // Fecha drawer ao clicar em algum link
        drawer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                drawer.style.display = 'none';
                toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
            });
        });

        // Fecha drawer clicando fora
        document.addEventListener('click', (e) => {
            if (drawer.style.display === 'flex' && !drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
                drawer.style.display = 'none';
                toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
            }
        });
    }
}
