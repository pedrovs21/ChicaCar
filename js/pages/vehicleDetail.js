import { getVehicleById, saveLead } from '../storage.js';
import { getConfig } from '../config.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { renderFooter } from '../components/footer.js';
import { renderImageGallery, initGalleryEvents } from '../components/imageGallery.js';
import { renderFinanceSimulator, initFinanceSimulatorEvents } from '../components/financeSimulator.js';
import { trackVehicleView, trackWhatsappClick, trackPhoneClick } from '../analytics.js';

export async function renderVehicleDetail(container, vehicleId) {
    // Busca o veículo
    const car = await getVehicleById(vehicleId);
    
    if (!car) {
        container.innerHTML = `
        <header>${renderHeader()}</header>
        <main class="main-container" style="text-align:center; padding: 5rem 1.5rem;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: #ef4444; margin-bottom: 1.5rem;"></i>
            <h2>Veículo Não Encontrado</h2>
            <p style="color:var(--text-muted); margin-top:0.5rem; margin-bottom: 2rem;">O veículo solicitado pode ter sido vendido ou removido do estoque.</p>
            <a href="#/" class="btn btn-primary">Voltar para o Estoque</a>
        </main>
        <footer>${renderFooter()}</footer>
        `;
        initHeaderEvents();
        return;
    }

    // Registra visualização para estatísticas
    trackVehicleView(car.id);

    const config = getConfig();
    const favorites = JSON.parse(localStorage.getItem('catalog_favorites') || '[]');
    const isFav = favorites.includes(car.id);

    // Formatação de valores
    const formattedPrice = car.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formattedPromoPrice = car.promoPrice ? car.promoPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null;
    const formattedKm = car.km === 0 ? 'Zero Km' : `${car.km.toLocaleString('pt-BR')} km`;
    const shareUrl = window.location.href;

    // Mensagem dinâmica WhatsApp
    let waMsg = config.whatsappTemplate
        .replace(/{brand}/g, car.brand)
        .replace(/{model}/g, car.model)
        .replace(/{version}/g, car.version)
        .replace(/{yearMfg}/g, car.yearMfg)
        .replace(/{yearModel}/g, car.yearModel)
        .replace(/{price}/g, (car.promoPrice || car.price).toLocaleString('pt-BR'));
    
    const waLink = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(waMsg)}`;

    container.innerHTML = `
    <!-- HEADER -->
    <header>${renderHeader('detail', favorites.length)}</header>

    <main class="main-container">
        <!-- Caminho de Navegação (Breadcrumbs) -->
        <nav style="font-size: 0.85rem; color:var(--text-muted); margin-bottom: 1.5rem; display:flex; gap:0.5rem;">
            <a href="#/" style="color:var(--primary-color);">Estoque</a>
            <span>/</span>
            <a href="#/?brand=${car.brand}" style="color:var(--primary-color);">${car.brand}</a>
            <span>/</span>
            <span style="font-weight:600;">${car.model}</span>
        </nav>

        <!-- Estrutura Principal de Detalhes -->
        <div class="detail-layout">
            
            <!-- Coluna Principal (Galeria, Descrição, Ficha, Opcionais) -->
            <div class="detail-main">
                
                <!-- Galeria -->
                ${renderImageGallery(car.photos)}
                
                <!-- Ficha Técnica Resumida -->
                <div class="detail-card">
                    <h3 style="font-size:1.3rem; margin-bottom:1.2rem;">Ficha Técnica</h3>
                    <div class="technical-grid">
                        <div class="tech-item">
                            <span class="tech-label">Ano Modelo</span>
                            <span class="tech-val">${car.yearMfg}/${car.yearModel}</span>
                        </div>
                        <div class="tech-item">
                            <span class="tech-label">Quilometragem</span>
                            <span class="tech-val">${formattedKm}</span>
                        </div>
                        <div class="tech-item">
                            <span class="tech-label">Câmbio</span>
                            <span class="tech-val">${car.transmission}</span>
                        </div>
                        <div class="tech-item">
                            <span class="tech-label">Combustível</span>
                            <span class="tech-val">${car.fuel}</span>
                        </div>
                        <div class="tech-item">
                            <span class="tech-label">Cor Exterior</span>
                            <span class="tech-val">${car.color}</span>
                        </div>
                        <div class="tech-item">
                            <span class="tech-label">Motorização</span>
                            <span class="tech-val">${car.engine || '-'}</span>
                        </div>
                        <div class="tech-item">
                            <span class="tech-label">Potência</span>
                            <span class="tech-val">${car.power || '-'}</span>
                        </div>
                        <div class="tech-item">
                            <span class="tech-label">Carroceria</span>
                            <span class="tech-val">${car.bodyType}</span>
                        </div>
                    </div>
                </div>

                <!-- Opcionais (Checkbox list) -->
                ${(car.options && car.options.length > 0) ? `
                    <div class="detail-card">
                        <h3 style="font-size:1.3rem; margin-bottom:1.2rem;">Equipamentos e Opcionais</h3>
                        <div class="options-grid">
                            ${car.options.map(opt => `
                                <div class="option-item">
                                    <i class="fa-solid fa-circle-check"></i>
                                    <span>${opt}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Descrição Comercial -->
                <div class="detail-card">
                    <h3 style="font-size:1.3rem; margin-bottom:1.2rem;">Descrição do Veículo</h3>
                    <p style="color:var(--text-color); font-size: 1.05rem; line-height: 1.7; white-space: pre-wrap;">${car.description}</p>
                    
                    ${car.notes ? `
                        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                            <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase; color: var(--text-muted);">Observações</h4>
                            <p style="color: var(--text-muted); font-size: 0.95rem; line-height:1.5;">${car.notes}</p>
                        </div>
                    ` : ''}
                </div>

                <!-- Simulador de Financiamento -->
                <div id="finance-simulator-target">
                    ${renderFinanceSimulator(car.promoPrice || car.price)}
                </div>

            </div>

            <!-- Coluna de Contato / Conversão (Sidebar) -->
            <div class="detail-sidebar">
                
                <div class="detail-card" style="position: sticky; top: 90px;">
                    <div class="detail-header-info">
                        <div class="detail-badges">
                            ${car.status === 'sold' ? '<span class="badge badge-sold">Vendido</span>' : ''}
                            ${car.status === 'reserved' ? '<span class="badge badge-reserved">Reservado</span>' : ''}
                            ${car.featured ? '<span class="badge badge-featured">Destaque</span>' : ''}
                            ${car.promoPrice ? '<span class="badge badge-new">Oferta</span>' : ''}
                        </div>
                        <h2 class="detail-title" style="font-size: 1.8rem; margin-top:0.8rem;">${car.brand} ${car.model}</h2>
                        <p class="detail-version" style="font-size:0.9rem;">${car.version}</p>
                    </div>

                    <div class="detail-price-box">
                        ${formattedPromoPrice ? `
                            <span class="detail-promo-tag">Preço Especial</span>
                            <span class="detail-old-price" style="display:block;">${formattedPrice}</span>
                            <span class="detail-price" style="color: #ef4444; font-size:2.2rem;">${formattedPromoPrice}</span>
                        ` : `
                            <span class="detail-price" style="font-size:2.2rem;">${formattedPrice}</span>
                        `}
                    </div>

                    <div class="sidebar-actions">
                        <a href="${waLink}" target="_blank" class="btn btn-whatsapp" id="btn-wa-contact" style="padding:0.8rem; font-size:1rem; width:100%;">
                            <i class="fa-brands fa-whatsapp" style="font-size:1.3rem;"></i> Negociar via WhatsApp
                        </a>
                        
                        <a href="tel:${config.phone.replace(/\D/g, '')}" class="btn btn-secondary" id="btn-tel-contact" style="padding:0.8rem; font-size:1rem; width:100%;">
                            <i class="fa-solid fa-phone"></i> Ligar agora
                        </a>

                        <button class="btn btn-primary" id="btn-lead-interest" style="padding:0.8rem; font-size:1rem; width:100%;">
                            <i class="fa-regular fa-envelope"></i> Tenho Interesse
                        </button>
                        
                        <hr style="border:0; border-top: 1px solid var(--border-color); margin: 0.5rem 0;">

                        <!-- Compartilhamento & Acessórios adicionais -->
                        <div style="display:flex; justify-content:space-between; gap:0.5rem;">
                            <button class="btn btn-secondary btn-icon" id="btn-share" title="Compartilhar Link" style="flex:1;">
                                <i class="fa-solid fa-share-nodes"></i> Compartilhar
                            </button>
                            <button class="btn btn-secondary btn-icon" id="btn-qrcode" title="Gerar QR Code" style="flex:1;">
                                <i class="fa-solid fa-qrcode"></i> QR Code
                            </button>
                            <button class="btn btn-secondary btn-icon" id="btn-print" title="Imprimir Ficha Técnica" style="flex:1;">
                                <i class="fa-solid fa-print"></i> PDF/Imprimir
                            </button>
                            <button class="btn btn-secondary btn-icon ${isFav ? 'active' : ''}" id="btn-fav-detail" title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" style="flex:1; color:${isFav ? '#ef4444' : 'inherit'}">
                                <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                            </button>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    </main>

    <!-- BARRA FIXA DE CONTATO MOBILE -->
    <div class="mobile-whatsapp-bar">
        <a href="${waLink}" target="_blank" class="btn btn-whatsapp" id="btn-wa-contact-mob" style="flex: 2; padding:0.8rem;">
            <i class="fa-brands fa-whatsapp"></i> Negociar WhatsApp
        </a>
        <a href="tel:${config.phone.replace(/\D/g, '')}" class="btn btn-secondary btn-icon" id="btn-tel-contact-mob" style="flex: 0.5; padding:0.8rem;">
            <i class="fa-solid fa-phone"></i>
        </a>
    </div>

    <!-- MODAL DE INTERESSE (LEAD FORM) -->
    <div class="modal-overlay" id="lead-modal">
        <div class="modal-box">
            <div class="modal-header">
                <h3 style="font-size:1.2rem;">Tenho Interesse no Veículo</h3>
                <button class="modal-close" id="lead-modal-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:1.5rem;">Preencha os campos abaixo e nosso consultor entrará em contato em menos de 1 hora.</p>
                <form id="lead-interest-form">
                    <div class="form-group">
                        <label for="l-name">Seu Nome Completo *</label>
                        <input type="text" class="form-input" id="l-name" placeholder="Ex: João da Silva" required>
                    </div>
                    <div class="form-group">
                        <label for="l-phone">Seu WhatsApp / Telefone *</label>
                        <input type="tel" class="form-input" id="l-phone" placeholder="Ex: (11) 98765-4321" required>
                    </div>
                    <div class="form-group">
                        <label for="l-proposal">Mensagem / Proposta</label>
                        <textarea class="form-input" id="l-proposal" rows="3" placeholder="Olá, gostaria de saber se aceitam carro de menor valor na troca."></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%; padding:0.8rem; margin-top:1rem;">
                        Enviar Proposta
                    </button>
                </form>
            </div>
        </div>
    </div>

    <!-- MODAL DE QR CODE -->
    <div class="modal-overlay" id="qrcode-modal">
        <div class="modal-box" style="max-width: 320px; text-align:center;">
            <div class="modal-header">
                <h3 style="font-size:1.1rem;">Scan QR Code</h3>
                <button class="modal-close" id="qrcode-modal-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body" style="display:flex; flex-direction:column; align-items:center; gap:1rem;">
                <p style="font-size:0.8rem; color:var(--text-muted);">Aponte a câmera do seu celular para abrir esta oferta instantaneamente.</p>
                <div style="padding:10px; background:#fff; border-radius:8px; border: 1px solid var(--border-color);">
                    <!-- API Gratuita de QR Code externa segura e leve -->
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}" alt="QR Code do veículo" style="display:block;">
                </div>
                <span style="font-size:0.85rem; font-weight:700; color:var(--primary-color); word-break:break-all;">${car.brand} ${car.model}</span>
            </div>
        </div>
    </div>

    <!-- FOOTER -->
    <footer>${renderFooter()}</footer>
    `;

    // Configura SEO de forma dinâmica
    document.title = `${car.brand} ${car.model} ${car.version} ${car.yearModel} - ${config.companyName}`;
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.setAttribute("content", `Compre seu ${car.brand} ${car.model} ${car.yearModel} ${car.color} na ${config.companyName}. ${formattedKm}, preço especial: ${formattedPromoPrice || formattedPrice}.`);
    }

    // Injeta dados estruturados do Schema.org para o robô de busca
    const schemaScript = document.getElementById('structured-data-car');
    if (schemaScript) {
        const schemaData = {
            "@context": "https://schema.org",
            "@type": "Car",
            "name": `${car.brand} ${car.model} ${car.version}`,
            "image": car.photos || [],
            "description": car.description,
            "modelDate": car.yearModel,
            "mileageFromOdometer": {
                "@type": "QuantitativeValue",
                "value": car.km,
                "unitCode": "KMT"
            },
            "vehicleTransmission": car.transmission,
            "fuelType": car.fuel,
            "offers": {
                "@type": "Offer",
                "price": car.promoPrice || car.price,
                "priceCurrency": "BRL",
                "availability": car.status === 'available' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "itemCondition": "https://schema.org/UsedCondition"
            }
        };
        schemaScript.textContent = JSON.stringify(schemaData);
    }

    // Inicialização de Eventos
    initHeaderEvents();
    initGalleryEvents(car.photos);

    // Envio de contato via formulário de interesse
    initFinanceSimulatorEvents(car.promoPrice || car.price, async (downVal, months, instVal) => {
        const proposalText = `Proposta de financiamento simulada: Entrada de R$ ${downVal.toLocaleString('pt-BR')} + ${instVal}.`;
        
        // Abre o modal de lead preenchendo o texto
        const modal = document.getElementById('lead-modal');
        const proposalTextArea = document.getElementById('l-proposal');
        if (modal && proposalTextArea) {
            proposalTextArea.value = proposalText;
            modal.classList.add('active');
        }
    });

    // Controladores de cliques nos botões de conversão e rastreadores
    const waBtn = document.getElementById('btn-wa-contact');
    const waBtnMob = document.getElementById('btn-wa-contact-mob');
    const telBtn = document.getElementById('btn-tel-contact');
    const telBtnMob = document.getElementById('btn-tel-contact-mob');

    const handleWaTrack = () => trackWhatsappClick(car.id);
    const handleTelTrack = () => trackPhoneClick();

    if (waBtn) waBtn.addEventListener('click', handleWaTrack);
    if (waBtnMob) waBtnMob.addEventListener('click', handleWaTrack);
    if (telBtn) telBtn.addEventListener('click', handleTelTrack);
    if (telBtnMob) telBtnMob.addEventListener('click', handleTelTrack);

    // Modal de Interesse (Lead)
    const leadModal = document.getElementById('lead-modal');
    const openLeadBtn = document.getElementById('btn-lead-interest');
    const closeLeadBtn = document.getElementById('lead-modal-close');
    const leadForm = document.getElementById('lead-interest-form');

    if (openLeadBtn && leadModal && closeLeadBtn) {
        openLeadBtn.addEventListener('click', () => leadModal.classList.add('active'));
        closeLeadBtn.addEventListener('click', () => leadModal.classList.remove('active'));
        
        // Fecha clicando no fundo
        leadModal.addEventListener('click', (e) => {
            if (e.target === leadModal) leadModal.classList.remove('active');
        });
    }

    if (leadForm) {
        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('l-name').value;
            const phone = document.getElementById('l-phone').value;
            const message = document.getElementById('l-proposal').value;

            await saveLead({
                name,
                phone,
                message,
                origin: `Interesse no Veículo: ${car.brand} ${car.model}`,
                vehicleId: car.id
            });

            alert("Proposta recebida com sucesso! Consultor de plantão responderá no seu WhatsApp em instantes.");
            leadModal.classList.remove('active');
            leadForm.reset();
        });
    }

    // Modal QR Code
    const qrcodeModal = document.getElementById('qrcode-modal');
    const openQrBtn = document.getElementById('btn-qrcode');
    const closeQrBtn = document.getElementById('qrcode-modal-close');

    if (openQrBtn && qrcodeModal && closeQrBtn) {
        openQrBtn.addEventListener('click', () => qrcodeModal.classList.add('active'));
        closeQrBtn.addEventListener('click', () => qrcodeModal.classList.remove('active'));
        
        qrcodeModal.addEventListener('click', (e) => {
            if (e.target === qrcodeModal) qrcodeModal.classList.remove('active');
        });
    }

    // Ação de Compartilhar
    const shareBtn = document.getElementById('btn-share');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `${car.brand} ${car.model} - ${config.companyName}`,
                        text: `Olha só esse ${car.brand} ${car.model} ${car.version} no catálogo da ${config.companyName}!`,
                        url: shareUrl
                    });
                } catch (e) {
                    console.log("Compartilhamento cancelado.");
                }
            } else {
                // Fallback: copia link para o clipboard
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    alert("Link do veículo copiado para a área de transferência!");
                } catch (e) {
                    alert("Falha ao copiar link automaticamente. Copie a URL do seu navegador.");
                }
            }
        });
    }

    // Imprimir Ficha Técnica
    const printBtn = document.getElementById('btn-print');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Ação de Favoritar
    const favBtn = document.getElementById('btn-fav-detail');
    if (favBtn) {
        favBtn.addEventListener('click', () => {
            let favs = JSON.parse(localStorage.getItem('catalog_favorites') || '[]');
            
            if (favs.includes(car.id)) {
                favs = favs.filter(fid => fid !== car.id);
                favBtn.querySelector('i').className = 'fa-regular fa-heart';
                favBtn.style.color = 'inherit';
                favBtn.title = 'Adicionar aos favoritos';
            } else {
                favs.push(car.id);
                favBtn.querySelector('i').className = 'fa-solid fa-heart';
                favBtn.style.color = '#ef4444';
                favBtn.title = 'Remover dos favoritos';
            }
            
            localStorage.setItem('catalog_favorites', JSON.stringify(favs));
            
            // Atualiza badge do Header
            const badges = document.querySelectorAll('.nav-fav-badge');
            badges.forEach(b => b.innerText = favs.length);
        });
    }
}
