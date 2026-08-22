import { getConfig } from '../config.js';

export function renderFooter() {
    const config = getConfig();
    const currentYear = new Date().getFullYear();
    const logoHtml = config.logoUrl 
        ? `<img src="${config.logoUrl}" alt="${config.companyName}" style="height:35px; width:auto; object-fit:contain;">`
        : `<i class="fa-solid fa-car-side" style="font-size: 1.5rem; color: var(--primary-color);"></i>`;

    return `
    <div class="footer-container">
        <!-- Brand Block -->
        <div class="footer-brand">
            <div class="footer-logo">
                ${logoHtml}
                <span class="brand-name" style="font-size: 1.2rem; font-weight:800;">${config.companyName}</span>
            </div>
            <p class="footer-tagline">${config.tagline}</p>
            <div class="social-links">
                ${config.instagram ? `
                    <a href="https://instagram.com/${config.instagram.replace('@', '')}" target="_blank" class="social-icon" title="Instagram">
                        <i class="fa-brands fa-instagram"></i>
                    </a>` : ''}
                ${config.facebook ? `
                    <a href="https://facebook.com/${config.facebook}" target="_blank" class="social-icon" title="Facebook">
                        <i class="fa-brands fa-facebook-f"></i>
                    </a>` : ''}
                <a href="https://wa.me/${config.whatsapp}" target="_blank" class="social-icon" title="WhatsApp">
                    <i class="fa-brands fa-whatsapp"></i>
                </a>
            </div>
        </div>

        <!-- Links Quick Access -->
        <div>
            <h4 class="footer-heading">Menu Rápido</h4>
            <ul class="footer-links">
                <li><a href="#/">Estoque Geral</a></li>
                <li><a href="#/#sobre">Quem Somos</a></li>
                <li><a href="#/#contato">Fale Conosco</a></li>
                <li><a href="#/favoritos">Meus Favoritos</a></li>
                <li><a href="#/comparar">Comparador de Veículos</a></li>
                <li><a href="#/admin">Painel Administrativo</a></li>
            </ul>
        </div>

        <!-- Contact details -->
        <div>
            <h4 class="footer-heading">Contato & Horários</h4>
            <ul class="contact-info-list">
                <li>
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${config.address}</span>
                </li>
                <li>
                    <i class="fa-solid fa-phone"></i>
                    <span><a href="tel:${config.phone.replace(/\D/g, '')}">${config.phone}</a></span>
                </li>
                <li>
                    <i class="fa-solid fa-envelope"></i>
                    <span><a href="mailto:${config.email}">${config.email}</a></span>
                </li>
                <li>
                    <i class="fa-solid fa-clock"></i>
                    <span>${config.hours}</span>
                </li>
            </ul>
        </div>

        <!-- Map Embed Block -->
        <div>
            <h4 class="footer-heading">Nossa Localização</h4>
            <div style="border-radius: 8px; overflow: hidden; height: 150px; border: 1px solid var(--border-color);">
                <iframe src="${config.mapEmbedUrl}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            </div>
        </div>
    </div>

    <div class="footer-bottom">
        <p>&copy; ${currentYear} ${config.companyName}. Todos os direitos reservados.</p>
        <p style="font-size:0.75rem;">Desenvolvido com <i class="fa-solid fa-heart" style="color: #ef4444;"></i> para revendas inteligentes.</p>
    </div>
    `;
}
