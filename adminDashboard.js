import { getVehicles, saveVehicle, deleteVehicle, getLeads, deleteLead, exportDatabase, importDatabase } from '../storage.js';
import { getConfig, saveConfig, DEFAULT_CONFIG } from '../config.js';
import { THEMES, applyTheme } from '../themes.js';
import { getAnalyticsData } from '../analytics.js';
import { generateAIDescription } from '../ai.js';

let adminState = {
    isLoggedIn: false,
    activeTab: 'analytics', // analytics, stock, leads, custom, data
    editingCar: null, // Veículo em edição no formulário, ou {} para cadastrar novo
    uploadedPhotos: [], // Array de base64 fotos do veículo em edição
    tempApiKey: localStorage.getItem('gemini_api_key') || ''
};

// Opcionais pré-configurados
const PRESET_OPTIONS = [
    "Ar-condicionado", "Direção elétrica", "Direção hidráulica", "Vidros elétricos",
    "Travas elétricas", "Alarme", "Multimídia", "Bluetooth", "Apple CarPlay",
    "Android Auto", "Câmera de ré", "Sensor de estacionamento", "Controle de estabilidade",
    "Controle de tração", "ABS", "Airbags", "Bancos de couro", "Teto solar",
    "Rodas de liga leve", "Piloto automático", "Chave presencial", "Partida por botão",
    "Faróis de LED"
];

// SHA-256 utilitário para checagem de senha
async function hashSHA256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Função de renderização principal do Painel Administrativo.
 */
export async function renderAdminDashboard(container) {
    const config = getConfig();

    // 1. Tela de Login se não logado
    if (!adminState.isLoggedIn) {
        renderLoginScreen(container, config);
        return;
    }

    // Carrega dados de stock e leads
    const vehicles = await getVehicles();
    const leads = await getLeads();
    const analytics = getAnalyticsData();

    // 2. Tela Principal do Painel
    container.innerHTML = `
    <!-- HEADER SIMPLIFICADO -->
    <header style="background:var(--bg-card); border-bottom:1px solid var(--border-color); padding: 0.8rem 1.5rem; position: sticky; top:0; z-index:100;">
        <div style="max-width:1200px; margin:0 auto; display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="brand-name" style="font-size:1.2rem;">Painel Admin</span>
                <span style="font-size:0.75rem; background:var(--primary-color); color:#fff; padding:0.2rem 0.5rem; border-radius:10px;">${config.companyName}</span>
            </div>
            <div style="display:flex; align-items:center; gap:1rem;">
                <a href="#/" class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.8rem;"><i class="fa-solid fa-eye"></i> Ver Site</a>
                <button class="btn btn-primary" id="btn-admin-logout" style="padding:0.4rem 0.8rem; font-size:0.8rem; background:#ef4444;"><i class="fa-solid fa-power-off"></i> Sair</button>
            </div>
        </div>
    </header>

    <main class="main-container" style="margin-top:2rem;">
        <div class="admin-layout">
            <!-- Sidebar Menu -->
            <aside class="admin-sidebar">
                <ul class="admin-menu">
                    <li><button class="admin-menu-btn ${adminState.activeTab === 'analytics' ? 'active' : ''}" data-tab="analytics"><i class="fa-solid fa-chart-line"></i> Dashboard</button></li>
                    <li><button class="admin-menu-btn ${adminState.activeTab === 'stock' ? 'active' : ''}" data-tab="stock"><i class="fa-solid fa-car"></i> Estoque (${vehicles.length})</button></li>
                    <li><button class="admin-menu-btn ${adminState.activeTab === 'leads' ? 'active' : ''}" data-tab="leads"><i class="fa-regular fa-envelope"></i> Leads (${leads.length})</button></li>
                    <li><button class="admin-menu-btn ${adminState.activeTab === 'custom' ? 'active' : ''}" data-tab="custom"><i class="fa-solid fa-wand-magic-sparkles"></i> Identidade Visual</button></li>
                    <li><button class="admin-menu-btn ${adminState.activeTab === 'data' ? 'active' : ''}" data-tab="data"><i class="fa-solid fa-database"></i> Backup & Cloud</button></li>
                </ul>
            </aside>

            <!-- Painel de Conteúdo Dinâmico -->
            <section class="admin-content" id="admin-content-box">
                <!-- Conteúdo da aba ativa injetado aqui -->
            </section>
        </div>
    </main>

    <footer style="margin-top:5rem; text-align:center; padding:1.5rem; border-top:1px solid var(--border-color); font-size:0.8rem; color:var(--text-muted);">
        Painel de Controle do Catálogo • IA Automação Ativa
    </footer>
    `;

    // Liga evento de Logout
    document.getElementById('btn-admin-logout').addEventListener('click', () => {
        adminState.isLoggedIn = false;
        renderAdminDashboard(container);
    });

    // Evento de troca de Abas
    container.querySelectorAll('.admin-menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            adminState.activeTab = e.currentTarget.getAttribute('data-tab');
            adminState.editingCar = null; // reseta formulários
            renderAdminDashboard(container);
        });
    });

    // Injeta conteúdo específico da aba ativa
    injectTabContent(vehicles, leads, analytics, config);
}

/**
     * Tela de login administrativa.
     */
function renderLoginScreen(container, config) {
    container.innerHTML = `
    <main style="min-height: 100vh; display:flex; align-items:center; justify-content:center; padding:1.5rem; background-color:var(--bg-color);">
        <div class="detail-card" style="width:100%; max-width:400px; box-shadow:var(--shadow-lg);">
            <div style="text-align:center; margin-bottom:2rem;">
                <i class="fa-solid fa-shield-halved" style="font-size:3rem; color:var(--primary-color); margin-bottom:1rem;"></i>
                <h2>Acesso Restrito</h2>
                <p style="color:var(--text-muted); font-size:0.9rem; margin-top:0.4rem;">Painel Administrativo da Revenda</p>
            </div>
            
            <form id="admin-login-form">
                <div class="form-group">
                    <label for="admin-pwd">Senha do Proprietário</label>
                    <input type="password" class="form-input" id="admin-pwd" placeholder="Senha cadastrada" required style="width:100%;" autofocus>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%; padding:0.8rem; margin-top:1rem;">
                    <i class="fa-solid fa-lock-open"></i> Acessar Painel
                </button>
            </form>
            
            <div style="text-align:center; margin-top:1.5rem;">
                <a href="#/" style="font-size:0.85rem; color:var(--text-muted); text-decoration:underline;">Voltar para o site</a>
            </div>
        </div>
    </main>
    `;

    document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputPwd = document.getElementById('admin-pwd').value;
        const hashedInput = await hashSHA256(inputPwd);
        
        if (hashedInput === config.adminPasswordHash) {
            adminState.isLoggedIn = true;
            renderAdminDashboard(container);
        } else {
            alert("Senha incorreta! Dica: a senha padrão inicial é 'admin'.");
        }
    });
}

/**
 * Injeta o conteúdo HTML específico da aba selecionada no painel.
 */
function injectTabContent(vehicles, leads, analytics, config) {
    const box = document.getElementById('admin-content-box');
    if (!box) return;

    if (adminState.activeTab === 'analytics') {
        // --- ABA DASHBOARD / ANALYTICS ---
        
        // Calcula veículos mais visitados
        const sortedViews = Object.entries(analytics.vehicleViews || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const popularCarsHtml = sortedViews.map(([id, count]) => {
            const car = vehicles.find(v => v.id === id);
            const carName = car ? `${car.brand} ${car.model}` : id;
            return `
            <tr>
                <td><strong>${carName}</strong></td>
                <td><span style="font-weight:700; color:var(--primary-color);">${count} visualizações</span></td>
            </tr>`;
        }).join('') || '<tr><td colspan="2" style="text-align:center; color:var(--text-muted);">Nenhum dado registrado.</td></tr>';

        box.innerHTML = `
        <h2 style="margin-bottom:1.5rem;"><i class="fa-solid fa-chart-line"></i> Resumo de Acessos</h2>
        
        <div class="admin-stats-grid">
            <div class="stat-card">
                <span class="stat-title">Visualizações do Site</span>
                <span class="stat-value"><i class="fa-regular fa-eye"></i> ${analytics.pageViews || 0}</span>
            </div>
            <div class="stat-card">
                <span class="stat-title">Cliques WhatsApp</span>
                <span class="stat-value" style="color:#25d366;"><i class="fa-brands fa-whatsapp"></i> ${analytics.whatsappClicks || 0}</span>
            </div>
            <div class="stat-card">
                <span class="stat-title">Cliques Ligações</span>
                <span class="stat-value" style="color:#3b82f6;"><i class="fa-solid fa-phone"></i> ${analytics.phoneClicks || 0}</span>
            </div>
            <div class="stat-card">
                <span class="stat-title">Novos Leads</span>
                <span class="stat-value" style="color:var(--accent-color);"><i class="fa-regular fa-envelope"></i> ${leads.length}</span>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:2rem; margin-top:2rem;">
            <div>
                <h3 style="font-size:1.15rem; margin-bottom:1rem;">Carros Mais Procurados</h3>
                <div class="admin-table-wrapper" style="margin-top:0;">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Veículo</th>
                                <th>Visualizações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${popularCarsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="detail-card" style="padding:1.5rem; background-color:var(--bg-color);">
                <h3 style="font-size:1.1rem; margin-bottom:0.8rem;"><i class="fa-solid fa-circle-question"></i> Dica de IA</h3>
                <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.6;">O carro mais acessado no momento é o seu principal destaque. Considere criar uma campanha promocional (preço de oferta) para acelerar a venda deste estoque!</p>
            </div>
        </div>
        `;
    } 
    else if (adminState.activeTab === 'stock') {
        // --- ABA ESTOQUE (CRUD) ---
        if (adminState.editingCar !== null) {
            renderVehicleForm(box, vehicles);
            return;
        }

        const rowsHtml = vehicles.map((car, index) => {
            const priceText = car.promoPrice 
                ? `<span style="color:#ef4444; font-weight:700;">R$ ${car.promoPrice.toLocaleString('pt-BR')}</span>` 
                : `R$ ${car.price.toLocaleString('pt-BR')}`;
            
            let statusBadge = '';
            if (car.status === 'sold') {
                statusBadge = '<span class="badge badge-sold" style="font-size:0.65rem;">Vendido</span>';
            } else if (car.status === 'reserved') {
                statusBadge = '<span class="badge badge-reserved" style="font-size:0.65rem;">Reservado</span>';
            } else {
                statusBadge = '<span class="badge badge-km" style="font-size:0.65rem; background:#10b981;">Disponível</span>';
            }

            return `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:0.8rem;">
                        <img src="${car.photos[0] || 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=100&q=80'}" style="width:48px; height:36px; object-fit:cover; border-radius:4px;">
                        <div>
                            <strong>${car.brand} ${car.model}</strong>
                            <div style="font-size:0.75rem; color:var(--text-muted);">${car.version}</div>
                        </div>
                    </div>
                </td>
                <td>${car.yearMfg}/${car.yearModel}</td>
                <td>${priceText}</td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display:flex; gap:0.4rem;">
                        <button class="btn btn-secondary btn-edit-car" data-idx="${index}" style="padding:0.3rem 0.6rem; font-size:0.75rem;"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-primary btn-delete-car" data-id="${car.id}" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:#ef4444;"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('') || '<tr><td colspan="5" style="text-align:center; padding:3rem; color:var(--text-muted);">Nenhum veículo em estoque.</td></tr>';

        box.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <h2><i class="fa-solid fa-car"></i> Gerenciamento de Estoque</h2>
            <button class="btn btn-primary" id="btn-add-car"><i class="fa-solid fa-plus"></i> Cadastrar Veículo</button>
        </div>

        <div class="admin-table-wrapper">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Veículo</th>
                        <th>Ano</th>
                        <th>Preço</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>
        `;

        // Liga botões CRUD
        document.getElementById('btn-add-car').addEventListener('click', () => {
            adminState.editingCar = {}; // Novo
            adminState.uploadedPhotos = [];
            renderAdminDashboard(box.closest('.main-container').parentNode);
        });

        box.querySelectorAll('.btn-edit-car').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
                adminState.editingCar = { ...vehicles[idx] }; // Clone
                adminState.uploadedPhotos = [...(vehicles[idx].photos || [])];
                renderAdminDashboard(box.closest('.main-container').parentNode);
            });
        });

        box.querySelectorAll('.btn-delete-car').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm("Tem certeza que deseja remover este veículo permanentemente do estoque?")) {
                    const id = e.currentTarget.getAttribute('data-id');
                    await deleteVehicle(id);
                    renderAdminDashboard(box.closest('.main-container').parentNode);
                }
            });
        });
    } 
    else if (adminState.activeTab === 'leads') {
        // --- ABA LEADS ---
        const leadsHtml = leads.map(l => {
            const time = new Date(l.created_at).toLocaleString('pt-BR');
            return `
            <div class="lead-row">
                <div class="lead-header">
                    <span>${l.name}</span>
                    <span style="font-size:0.75rem; color:var(--text-muted); font-weight:400;">${time}</span>
                </div>
                <div style="font-size:0.9rem; margin-bottom:0.5rem; display:flex; gap:0.5rem; align-items:center;">
                    <i class="fa-brands fa-whatsapp" style="color:#25d366; font-size:1.1rem;"></i>
                    <a href="https://wa.me/${l.phone.replace(/\D/g, '')}" target="_blank" style="font-weight:600; text-decoration:underline;">${l.phone}</a>
                </div>
                <div style="font-size:0.85rem; background:var(--bg-card); padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); color:var(--text-muted);">
                    <strong>Mensagem:</strong> "${l.message}"
                </div>
                <div style="margin-top:0.6rem; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.75rem; background:rgba(0,0,0,0.05); padding:0.2rem 0.4rem; border-radius:4px;">Origem: ${l.origin}</span>
                    <button class="compare-remove-btn btn-delete-lead" data-id="${l.id}"><i class="fa-solid fa-trash-can"></i> Excluir</button>
                </div>
            </div>`;
        }).join('') || '<div style="text-align:center; padding:4rem; color:var(--text-muted);"><i class="fa-regular fa-envelope" style="font-size:3rem; margin-bottom:1.5rem;"></i><p>Nenhum lead ou proposta recebida.</p></div>';

        box.innerHTML = `
        <h2 style="margin-bottom:1.5rem;"><i class="fa-regular fa-envelope"></i> Leads de Clientes</h2>
        <div style="display:flex; flex-direction:column; gap:1rem;">
            ${leadsHtml}
        </div>
        `;

        box.querySelectorAll('.btn-delete-lead').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm("Deseja apagar este lead da lista?")) {
                    const id = e.currentTarget.getAttribute('data-id');
                    await deleteLead(id);
                    renderAdminDashboard(box.closest('.main-container').parentNode);
                }
            });
        });
    } 
    else if (adminState.activeTab === 'custom') {
        // --- ABA PERSONALIZAÇÃO ---
        renderCustomizationForm(box, config);
    } 
    else if (adminState.activeTab === 'data') {
        // --- ABA DADOS (EXCEL / CSV / SUPABASE) ---
        renderDataManagement(box, config);
    }
}

/**
 * Renderiza o formulário de Cadastrar/Editar Veículo.
 */
function renderVehicleForm(box, vehicles) {
    const car = adminState.editingCar;
    const isNew = !car.id;
    
    box.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
        <h2><i class="fa-solid fa-car"></i> ${isNew ? 'Cadastrar Novo Veículo' : `Editar Veículo: ${car.brand} ${car.model}`}</h2>
        <button class="btn btn-secondary" id="btn-cancel-form"><i class="fa-solid fa-xmark"></i> Cancelar</button>
    </div>

    <!-- IA ANÚNCIO GERADOR ASSISTENTE -->
    <div class="ai-helper-box">
        <div class="ai-helper-header">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Assistente de Escrita Comercial (IA)
        </div>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">Preencha a Marca, Modelo, Versão e Ano, e deixe a IA gerar uma descrição otimizada para SEO de forma instantânea.</p>
        <div style="display:flex; gap:0.8rem; align-items:center;">
            <input type="text" class="form-input" id="ai-api-key" placeholder="Insira sua Chave de API Gemini (Opcional)" value="${adminState.tempApiKey}" style="flex:1; font-size:0.8rem;">
            <button class="btn btn-primary" id="btn-generate-ai" style="padding:0.6rem 1rem; font-size:0.85rem;"><i class="fa-solid fa-robot"></i> Gerar Descrição</button>
        </div>
        <small style="font-size:0.75rem; color:var(--text-muted); display:block; margin-top:0.4rem;">Se não tiver chave, usaremos um gerador estático estruturado baseado em templates de alta performance.</small>
    </div>

    <form id="vehicle-crud-form">
        <h3 style="font-size:1.1rem; margin-bottom:1rem; color:var(--primary-color);">1. Informações Básicas</h3>
        <div class="admin-form-row">
            <div class="form-group">
                <label for="f-brand">Marca *</label>
                <input type="text" class="form-input" id="f-brand" placeholder="Ex: Chevrolet" value="${car.brand || ''}" required>
            </div>
            <div class="form-group">
                <label for="f-model">Modelo *</label>
                <input type="text" class="form-input" id="f-model" placeholder="Ex: Onix" value="${car.model || ''}" required>
            </div>
            <div class="form-group">
                <label for="f-version">Versão *</label>
                <input type="text" class="form-input" id="f-version" placeholder="Ex: 1.0 LTZ Turbo" value="${car.version || ''}" required>
            </div>
        </div>

        <div class="admin-form-row">
            <div class="form-group">
                <label for="f-yearMfg">Ano Fabricação *</label>
                <input type="number" class="form-input" id="f-yearMfg" placeholder="Ex: 2019" value="${car.yearMfg || ''}" required>
            </div>
            <div class="form-group">
                <label for="f-yearModel">Ano Modelo *</label>
                <input type="number" class="form-input" id="f-yearModel" placeholder="Ex: 2020" value="${car.yearModel || ''}" required>
            </div>
            <div class="form-group">
                <label for="f-km">Quilometragem *</label>
                <input type="number" class="form-input" id="f-km" placeholder="Ex: 45000 (0 para Zero KM)" value="${car.km !== undefined ? car.km : ''}" required>
            </div>
        </div>

        <div class="admin-form-row">
            <div class="form-group">
                <label for="f-price">Preço Padrão (R$) *</label>
                <input type="number" class="form-input" id="f-price" placeholder="Ex: 72900" value="${car.price || ''}" required>
            </div>
            <div class="form-group">
                <label for="f-promoPrice">Preço Promocional (R$, opcional)</label>
                <input type="number" class="form-input" id="f-promoPrice" placeholder="Ex: 69900" value="${car.promoPrice || ''}">
            </div>
            <div class="form-group">
                <label for="f-status">Status *</label>
                <select class="filter-control" id="f-status">
                    <option value="available" ${car.status === 'available' ? 'selected' : ''}>Disponível</option>
                    <option value="reserved" ${car.status === 'reserved' ? 'selected' : ''}>Reservado</option>
                    <option value="sold" ${car.status === 'sold' ? 'selected' : ''}>Vendido</option>
                </select>
            </div>
        </div>

        <h3 style="font-size:1.1rem; margin-top:2rem; margin-bottom:1rem; color:var(--primary-color);">2. Especificações Técnicas</h3>
        <div class="admin-form-row">
            <div class="form-group">
                <label for="f-transmission">Câmbio *</label>
                <select class="filter-control" id="f-transmission">
                    <option value="Automático" ${car.transmission === 'Automático' ? 'selected' : ''}>Automático</option>
                    <option value="Manual" ${car.transmission === 'Manual' ? 'selected' : ''}>Manual</option>
                </select>
            </div>
            <div class="form-group">
                <label for="f-fuel">Combustível *</label>
                <select class="filter-control" id="f-fuel">
                    <option value="Flex" ${car.fuel === 'Flex' ? 'selected' : ''}>Flex</option>
                    <option value="Gasolina" ${car.fuel === 'Gasolina' ? 'selected' : ''}>Gasolina</option>
                    <option value="Etanol" ${car.fuel === 'Etanol' ? 'selected' : ''}>Etanol</option>
                    <option value="Diesel" ${car.fuel === 'Diesel' ? 'selected' : ''}>Diesel</option>
                    <option value="Híbrido" ${car.fuel === 'Híbrido' ? 'selected' : ''}>Híbrido</option>
                    <option value="Elétrico" ${car.fuel === 'Elétrico' ? 'selected' : ''}>Elétrico</option>
                </select>
            </div>
            <div class="form-group">
                <label for="f-bodyType">Carroceria *</label>
                <select class="filter-control" id="f-bodyType">
                    <option value="Hatch" ${car.bodyType === 'Hatch' ? 'selected' : ''}>Hatch</option>
                    <option value="Sedan" ${car.bodyType === 'Sedan' ? 'selected' : ''}>Sedan</option>
                    <option value="SUV" ${car.bodyType === 'SUV' ? 'selected' : ''}>SUV</option>
                    <option value="Picape" ${car.bodyType === 'Picape' ? 'selected' : ''}>Picape</option>
                    <option value="Cupê" ${car.bodyType === 'Cupê' ? 'selected' : ''}>Cupê</option>
                    <option value="Perua" ${car.bodyType === 'Perua' ? 'selected' : ''}>Perua</option>
                    <option value="Minivan" ${car.bodyType === 'Minivan' ? 'selected' : ''}>Minivan</option>
                </select>
            </div>
        </div>

        <div class="admin-form-row">
            <div class="form-group">
                <label for="f-color">Cor Exterior</label>
                <input type="text" class="form-input" id="f-color" placeholder="Ex: Prata Metálico" value="${car.color || ''}">
            </div>
            <div class="form-group">
                <label for="f-doors">Portas</label>
                <input type="number" class="form-input" id="f-doors" placeholder="Ex: 4" value="${car.doors || 4}">
            </div>
            <div class="form-group">
                <label for="f-plateEnd">Final de Placa (Opcional)</label>
                <input type="text" class="form-input" id="f-plateEnd" placeholder="Ex: 8" value="${car.plateEnd || ''}">
            </div>
        </div>

        <div class="admin-form-row">
            <div class="form-group">
                <label for="f-engine">Motor</label>
                <input type="text" class="form-input" id="f-engine" placeholder="Ex: 1.0 Turbo" value="${car.engine || ''}">
            </div>
            <div class="form-group">
                <label for="f-power">Potência</label>
                <input type="text" class="form-input" id="f-power" placeholder="Ex: 116 cv" value="${car.power || ''}">
            </div>
            <div class="form-group">
                <label for="f-displacement">Cilindradas</label>
                <input type="text" class="form-input" id="f-displacement" placeholder="Ex: 999 cc" value="${car.displacement || ''}">
            </div>
            <div class="form-group">
                <label for="f-traction">Tração</label>
                <input type="text" class="form-input" id="f-traction" placeholder="Ex: Dianteira" value="${car.traction || 'Dianteira'}">
            </div>
        </div>

        <div class="form-group">
            <label for="f-description">Descrição Comercial *</label>
            <textarea class="form-input" id="f-description" rows="5" required placeholder="Texto persuasivo para o catálogo...">${car.description || ''}</textarea>
        </div>

        <div class="form-group">
            <label for="f-notes">Observações do Estoque</label>
            <textarea class="form-input" id="f-notes" rows="2" placeholder="Ex: IPVA pago, pneus novos, único dono...">${car.notes || ''}</textarea>
        </div>

        <h3 style="font-size:1.1rem; margin-top:2rem; margin-bottom:1rem; color:var(--primary-color);">3. Fotos do Veículo</h3>
        
        <!-- Upload Drag & Drop -->
        <div class="upload-zone" id="drag-drop-zone">
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <p style="font-weight:600;">Arraste fotos aqui ou clique para fazer upload</p>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.3rem;">Aceita JPG, PNG e WebP. Compressão e conversão automática ativas.</p>
            <input type="file" id="file-uploader" multiple accept="image/*" style="display:none;">
        </div>

        <!-- Grid de Fotos Carregadas -->
        <div class="uploaded-photos-grid" id="uploaded-photos-container">
            <!-- Fotos em base64 renderizadas dinamicamente -->
        </div>

        <h3 style="font-size:1.1rem; margin-top:2rem; margin-bottom:0.5rem; color:var(--primary-color);">4. Opcionais do Veículo</h3>
        <div class="checkbox-group">
            ${PRESET_OPTIONS.map(opt => {
                const checked = car.options && car.options.includes(opt) ? 'checked' : '';
                return `
                <label class="checkbox-label">
                    <input type="checkbox" class="preset-option-cb" value="${opt}" ${checked}>
                    ${opt}
                </label>`;
            }).join('')}
        </div>

        <div style="margin-top:2rem; padding-top:1.5rem; border-top:1px solid var(--border-color); display:flex; gap:1rem;">
            <label class="checkbox-label" style="font-weight:700;">
                <input type="checkbox" id="f-featured" ${car.featured ? 'checked' : ''}>
                Destacar veículo na Página Inicial
            </label>
            <label class="checkbox-label" style="font-weight:700;">
                <input type="checkbox" id="f-active" ${car.active !== false ? 'checked' : ''}>
                Ativar anúncio (visível ao público)
            </label>
        </div>

        <div style="margin-top:3rem; display:flex; gap:1rem;">
            <button type="submit" class="btn btn-primary" style="padding:1rem 2rem;"><i class="fa-solid fa-cloud-arrow-up"></i> Salvar Veículo</button>
            <button type="button" class="btn btn-secondary" id="btn-cancel-bottom" style="padding:1rem 2rem;">Cancelar</button>
        </div>
    </form>
    `;

    // Atualiza a visualização das fotos já carregadas
    refreshUploadedPhotos();

    // Evento de Cancelar
    const cancelAction = () => {
        adminState.editingCar = null;
        adminState.uploadedPhotos = [];
        renderAdminDashboard(box.closest('.main-container').parentNode);
    };
    document.getElementById('btn-cancel-form').addEventListener('click', cancelAction);
    document.getElementById('btn-cancel-bottom').addEventListener('click', cancelAction);

    // Evento IA - Gerar Descrição
    document.getElementById('btn-generate-ai').addEventListener('click', async (e) => {
        e.preventDefault();
        const apiKey = document.getElementById('ai-api-key').value;
        localStorage.setItem('gemini_api_key', apiKey);
        adminState.tempApiKey = apiKey;

        const partialCar = {
            brand: document.getElementById('f-brand').value,
            model: document.getElementById('f-model').value,
            version: document.getElementById('f-version').value,
            yearMfg: parseInt(document.getElementById('f-yearMfg').value || 0),
            yearModel: parseInt(document.getElementById('f-yearModel').value || 0),
            km: parseInt(document.getElementById('f-km').value || 0),
            price: parseFloat(document.getElementById('f-price').value || 0),
            promoPrice: parseFloat(document.getElementById('f-promoPrice').value || 0) || null,
            transmission: document.getElementById('f-transmission').value,
            fuel: document.getElementById('f-fuel').value,
            color: document.getElementById('f-color').value,
            engine: document.getElementById('f-engine').value,
            power: document.getElementById('f-power').value,
            bodyType: document.getElementById('f-bodyType').value,
            notes: document.getElementById('f-notes').value,
            options: Array.from(document.querySelectorAll('.preset-option-cb:checked')).map(cb => cb.value)
        };

        if (!partialCar.brand || !partialCar.model) {
            alert("Preencha ao menos a Marca e o Modelo antes de gerar com IA.");
            return;
        }

        const aiBtn = document.getElementById('btn-generate-ai');
        aiBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Escrevendo anúncio...';
        aiBtn.disabled = true;

        try {
            const aiResult = await generateAIDescription(partialCar, apiKey);
            document.getElementById('f-description').value = aiResult.description;
            alert("Descrição comercial gerada com sucesso pela IA!");
        } catch (e) {
            alert("Erro ao rodar gerador de descrição.");
        } finally {
            aiBtn.innerHTML = '<i class="fa-solid fa-robot"></i> Gerar Descrição';
            aiBtn.disabled = false;
        }
    });

    // Upload de Fotos - Eventos do input de arquivos e Drag & Drop
    const fileUploader = document.getElementById('file-uploader');
    const dragDropZone = document.getElementById('drag-drop-zone');

    dragDropZone.addEventListener('click', () => fileUploader.click());
    dragDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dragDropZone.style.borderColor = 'var(--primary-color)';
    });
    dragDropZone.addEventListener('dragleave', () => {
        dragDropZone.style.borderColor = 'var(--border-color)';
    });
    dragDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dragDropZone.style.borderColor = 'var(--border-color)';
        if (e.dataTransfer.files.length > 0) {
            handleUploadedFiles(e.dataTransfer.files);
        }
    });

    fileUploader.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleUploadedFiles(e.target.files);
        }
    });

    // Submissão do Formulário de Salvar
    document.getElementById('vehicle-crud-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const brand = document.getElementById('f-brand').value;
        const model = document.getElementById('f-model').value;
        const yearMfg = parseInt(document.getElementById('f-yearMfg').value);
        const yearModel = parseInt(document.getElementById('f-yearModel').value);

        // Cria ID amigável de rota para o veículo se for novo
        const finalId = car.id || `${brand.toLowerCase()}-${model.toLowerCase()}-${yearModel}-${Math.random().toString(36).substr(2, 5)}`.replace(/\s+/g, '-');

        const savedCar = {
            id: finalId,
            brand,
            model,
            version: document.getElementById('f-version').value,
            yearMfg,
            yearModel,
            km: parseInt(document.getElementById('f-km').value),
            price: parseFloat(document.getElementById('f-price').value),
            promoPrice: parseFloat(document.getElementById('f-promoPrice').value) || null,
            status: document.getElementById('f-status').value,
            transmission: document.getElementById('f-transmission').value,
            fuel: document.getElementById('f-fuel').value,
            bodyType: document.getElementById('f-bodyType').value,
            color: document.getElementById('f-color').value,
            doors: parseInt(document.getElementById('f-doors').value || 4),
            plateEnd: document.getElementById('f-plateEnd').value,
            engine: document.getElementById('f-engine').value,
            power: document.getElementById('f-power').value,
            displacement: document.getElementById('f-displacement').value,
            traction: document.getElementById('f-traction').value,
            description: document.getElementById('f-description').value,
            notes: document.getElementById('f-notes').value,
            featured: document.getElementById('f-featured').checked,
            active: document.getElementById('f-active').checked,
            photos: adminState.uploadedPhotos,
            options: Array.from(document.querySelectorAll('.preset-option-cb:checked')).map(cb => cb.value),
            dateAdded: car.dateAdded || new Date().toISOString().split('T')[0]
        };

        await saveVehicle(savedCar);
        alert("Veículo cadastrado no estoque!");
        cancelAction();
    });
}

/**
 * Renders the custom visual settings editor page (Theme / Cores).
 */
function renderCustomizationForm(box, config) {
    box.innerHTML = `
    <h2 style="margin-bottom:1.5rem;"><i class="fa-solid fa-wand-magic-sparkles"></i> Identidade Visual & Temas</h2>
    
    <form id="custom-branding-form">
        <h3 style="font-size:1.1rem; margin-bottom:1rem; color:var(--primary-color);">A. Selecione um Tema Pronto</h3>
        <div class="theme-picker-grid">
            ${Object.entries(THEMES).map(([key, t]) => {
                const active = config.theme === key ? 'active' : '';
                return `
                <div class="theme-card ${active}" data-theme-key="${key}">
                    <div style="font-weight:700; font-size:0.9rem;">${t.name}</div>
                    <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.2rem;">${t.description}</div>
                    <div class="theme-preview-colors">
                        <div class="theme-dot" style="background:${t.colors.primaryColor}"></div>
                        <div class="theme-dot" style="background:${t.colors.bgColor}"></div>
                        <div class="theme-dot" style="background:${t.colors.textColor}"></div>
                    </div>
                </div>`;
            }).join('')}
        </div>

        <h3 style="font-size:1.1rem; margin-top:2rem; margin-bottom:1rem; color:var(--primary-color);">B. Ajuste Fino das Cores (Customizado)</h3>
        <div class="admin-form-row">
            <div class="form-group">
                <label>Cor Primária (Botoes/Links)</label>
                <div class="color-input-wrapper">
                    <input type="color" class="color-picker" id="c-primary" value="${config.customColors.primaryColor}">
                    <input type="text" class="form-input" id="c-primary-text" value="${config.customColors.primaryColor}" style="width:100px; padding:0.4rem;">
                </div>
            </div>
            <div class="form-group">
                <label>Cor Secundária</label>
                <div class="color-input-wrapper">
                    <input type="color" class="color-picker" id="c-secondary" value="${config.customColors.secondaryColor}">
                    <input type="text" class="form-input" id="c-secondary-text" value="${config.customColors.secondaryColor}" style="width:100px; padding:0.4rem;">
                </div>
            </div>
            <div class="form-group">
                <label>Cor de Destaque</label>
                <div class="color-input-wrapper">
                    <input type="color" class="color-picker" id="c-accent" value="${config.customColors.accentColor}">
                    <input type="text" class="form-input" id="c-accent-text" value="${config.customColors.accentColor}" style="width:100px; padding:0.4rem;">
                </div>
            </div>
        </div>

        <h3 style="font-size:1.1rem; margin-top:2rem; margin-bottom:1rem; color:var(--primary-color);">C. Informações da Revenda</h3>
        <div class="admin-form-row">
            <div class="form-group">
                <label for="cfg-comp">Nome Comercial *</label>
                <input type="text" class="form-input" id="cfg-comp" value="${config.companyName}" required>
            </div>
            <div class="form-group">
                <label for="cfg-tag">Tagline (Slogan)</label>
                <input type="text" class="form-input" id="cfg-tag" value="${config.tagline}">
            </div>
        </div>

        <div class="admin-form-row">
            <div class="form-group">
                <label for="cfg-logo">Link da Imagem da Logo (URL)</label>
                <input type="text" class="form-input" id="cfg-logo" value="${config.logoUrl}" placeholder="Deixe em branco para usar iniciais estilizadas">
            </div>
            <div class="form-group">
                <label for="cfg-phone">Telefone de Contato</label>
                <input type="text" class="form-input" id="cfg-phone" value="${config.phone}">
            </div>
            <div class="form-group">
                <label for="cfg-wa">WhatsApp (Apenas Números com DDD) *</label>
                <input type="text" class="form-input" id="cfg-wa" value="${config.whatsapp}" placeholder="Ex: 5511999998888" required>
            </div>
        </div>

        <div class="form-group">
            <label for="cfg-wa-template">Mensagem Padrão do WhatsApp (Use as chaves {brand}, {model}, {version}, {price})</label>
            <input type="text" class="form-input" id="cfg-wa-template" value="${config.whatsappTemplate}">
        </div>

        <div class="admin-form-row">
            <div class="form-group">
                <label for="cfg-email">E-mail Comercial</label>
                <input type="email" class="form-input" id="cfg-email" value="${config.email}">
            </div>
            <div class="form-group">
                <label for="cfg-hours">Horário de Funcionamento</label>
                <input type="text" class="form-input" id="cfg-hours" value="${config.hours}">
            </div>
        </div>

        <div class="form-group">
            <label for="cfg-address">Endereço Completo</label>
            <input type="text" class="form-input" id="cfg-address" value="${config.address}">
        </div>

        <div class="form-group">
            <label for="cfg-map">URL do Embed de Google Maps (Iframe Src)</label>
            <input type="text" class="form-input" id="cfg-map" value="${config.mapEmbedUrl}" placeholder="https://google.com/maps/embed...">
        </div>

        <div class="admin-form-row">
            <div class="form-group">
                <label for="cfg-ig">Instagram (com @)</label>
                <input type="text" class="form-input" id="cfg-ig" value="${config.instagram}">
            </div>
            <div class="form-group">
                <label for="cfg-fb">Facebook (nome de usuário)</label>
                <input type="text" class="form-input" id="cfg-fb" value="${config.facebook}">
            </div>
        </div>

        <h3 style="font-size:1.1rem; margin-top:2rem; margin-bottom:1rem; color:var(--primary-color);">D. Seção Quem Somos (Sobre a Loja)</h3>
        <div class="form-group">
            <label for="cfg-about-title">Título da Seção Sobre</label>
            <input type="text" class="form-input" id="cfg-about-title" value="${config.aboutTitle}">
        </div>
        <div class="form-group">
            <label for="cfg-about-text">Histórico / Descrição Institucional</label>
            <textarea class="form-input" id="cfg-about-text" rows="4">${config.aboutText}</textarea>
        </div>

        <div class="admin-form-row">
            <div class="form-group">
                <label for="cfg-stat-sold">Contador de Carros Vendidos</label>
                <input type="text" class="form-input" id="cfg-stat-sold" value="${config.statsVehiclesSold}">
            </div>
            <div class="form-group">
                <label for="cfg-stat-years">Anos no Mercado</label>
                <input type="text" class="form-input" id="cfg-stat-years" value="${config.statsYearsInMarket}">
            </div>
            <div class="form-group">
                <label for="cfg-stat-sat">Índice de Satisfação</label>
                <input type="text" class="form-input" id="cfg-stat-sat" value="${config.statsCustomerSatisfaction}">
            </div>
        </div>

        <div style="margin-top:2.5rem; display:flex; gap:1rem;">
            <button type="submit" class="btn btn-primary" style="padding:1rem 2rem;"><i class="fa-solid fa-floppy-disk"></i> Salvar Identidade Visual</button>
            <button type="button" class="btn btn-secondary" id="btn-reset-custom" style="padding:1rem 2rem; background:#ef4444; color:#fff;">Restaurar Padrão</button>
        </div>
    </form>
    `;

    // Sincroniza Color Pickers com Inputs de Texto
    const syncColor = (pickerId, textId) => {
        const p = document.getElementById(pickerId);
        const t = document.getElementById(textId);
        p.addEventListener('input', (e) => t.value = e.target.value);
        t.addEventListener('input', (e) => p.value = e.target.value);
    };
    syncColor('c-primary', 'c-primary-text');
    syncColor('c-secondary', 'c-secondary-text');
    syncColor('c-accent', 'c-accent-text');

    // Troca de Tema Dinâmico
    let selectedTheme = config.theme;
    box.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', (e) => {
            box.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedTheme = card.getAttribute('data-theme-key');
            
            // Aplica as cores padrão do tema selecionado para facilitar visualização
            const tColors = THEMES[selectedTheme].colors;
            document.getElementById('c-primary').value = tColors.primaryColor;
            document.getElementById('c-primary-text').value = tColors.primaryColor;
            document.getElementById('c-secondary').value = tColors.secondaryColor;
            document.getElementById('c-secondary-text').value = tColors.secondaryColor;
            document.getElementById('c-accent').value = tColors.accentColor;
            document.getElementById('c-accent-text').value = tColors.accentColor;
        });
    });

    // Salvar Configurações
    document.getElementById('custom-branding-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newCfg = {
            ...config,
            theme: selectedTheme,
            customColors: {
                primaryColor: document.getElementById('c-primary-text').value,
                secondaryColor: document.getElementById('c-secondary-text').value,
                accentColor: document.getElementById('c-accent-text').value,
                bgColor: config.customColors.bgColor, // Preserva fundo
                textColor: config.customColors.textColor // Preserva cor texto
            },
            companyName: document.getElementById('cfg-comp').value,
            tagline: document.getElementById('cfg-tag').value,
            logoUrl: document.getElementById('cfg-logo').value,
            phone: document.getElementById('cfg-phone').value,
            whatsapp: document.getElementById('cfg-wa').value,
            whatsappTemplate: document.getElementById('cfg-wa-template').value,
            email: document.getElementById('cfg-email').value,
            hours: document.getElementById('cfg-hours').value,
            address: document.getElementById('cfg-address').value,
            mapEmbedUrl: document.getElementById('cfg-map').value,
            instagram: document.getElementById('cfg-ig').value,
            facebook: document.getElementById('cfg-fb').value,
            aboutTitle: document.getElementById('cfg-about-title').value,
            aboutText: document.getElementById('cfg-about-text').value,
            statsVehiclesSold: document.getElementById('cfg-stat-sold').value,
            statsYearsInMarket: document.getElementById('cfg-stat-years').value,
            statsCustomerSatisfaction: document.getElementById('cfg-stat-sat').value
        };

        saveConfig(newCfg);
        applyTheme(newCfg);
        alert("Configurações salvas com sucesso! A aparência foi atualizada.");
        renderAdminDashboard(box.closest('.main-container').parentNode);
    });

    // Resetar para as Configurações Originais
    document.getElementById('btn-reset-custom').addEventListener('click', () => {
        if (confirm("Deseja apagar todas as customizações de cores, logo e contato e restaurar os padrões originais?")) {
            saveConfig(DEFAULT_CONFIG);
            applyTheme(DEFAULT_CONFIG);
            alert("Configurações redefinidas com sucesso.");
            renderAdminDashboard(box.closest('.main-container').parentNode);
        }
    });
}

/**
 * Renders database migration / Supabase integration options.
 */
function renderDataManagement(box, config) {
    box.innerHTML = `
    <h2 style="margin-bottom:1.5rem;"><i class="fa-solid fa-database"></i> Backup & Conectividade Nuvem</h2>
    
    <div style="display:flex; flex-direction:column; gap:2rem;">
        
        <!-- Bloco Backup -->
        <div class="detail-card">
            <h3 style="font-size:1.1rem; margin-bottom:0.8rem;"><i class="fa-solid fa-file-export"></i> Importação e Exportação de Banco</h3>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.2rem; line-height:1.5;">O catálogo salva tudo localmente por padrão. Baixe um backup com frequência para segurança. Use para migrar de computador ou alimentar outro site.</p>
            <div style="display:flex; gap:1rem;">
                <button class="btn btn-primary" id="btn-export-json"><i class="fa-solid fa-download"></i> Baixar Banco de Dados JSON</button>
                
                <button class="btn btn-secondary" id="btn-trigger-import"><i class="fa-solid fa-upload"></i> Subir Backup JSON</button>
                <input type="file" id="import-json-uploader" accept=".json" style="display:none;">
            </div>
        </div>

        <!-- Bloco Planilhas CSV -->
        <div class="detail-card">
            <h3 style="font-size:1.1rem; margin-bottom:0.8rem;"><i class="fa-solid fa-file-csv"></i> Cadastro em Massa via Planilha (CSV)</h3>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.2rem; line-height:1.5;">Cadastre dezenas de veículos de uma vez. Baixe nosso modelo padrão de planilha e envie preenchido.</p>
            <div style="display:flex; gap:1rem; flex-wrap:wrap;">
                <button class="btn btn-secondary" id="btn-download-csv-tpl"><i class="fa-solid fa-file-arrow-down"></i> Baixar Modelo CSV</button>
                
                <button class="btn btn-primary" id="btn-trigger-csv-import" style="background:#06b6d4;"><i class="fa-solid fa-file-import"></i> Importar Planilha CSV</button>
                <input type="file" id="import-csv-uploader" accept=".csv" style="display:none;">
            </div>
        </div>

        <!-- Bloco Supabase (Nuvem Gratuita) -->
        <div class="detail-card" style="border: 1px solid rgba(79, 70, 229, 0.3); background-color: rgba(79, 70, 229, 0.01);">
            <h3 style="font-size:1.1rem; margin-bottom:0.8rem; color:var(--primary-color);"><i class="fa-solid fa-cloud"></i> Integração Supabase Cloud (Opcional - R$ 0 Custos)</h3>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.2rem; line-height:1.5;">Transforme seu catálogo em multi-dispositivo! Insira as credenciais do seu projeto gratuito Supabase. Se configurado, o site lerá/gravará tudo na nuvem instantaneamente.</p>
            
            <form id="supabase-config-form">
                <div class="form-group">
                    <label for="cfg-sb-url">Supabase Project URL</label>
                    <input type="text" class="form-input" id="cfg-sb-url" value="${config.supabaseUrl || ''}" placeholder="Ex: https://xyz.supabase.co">
                </div>
                <div class="form-group">
                    <label for="cfg-sb-key">Supabase Anon Key (API Key pública)</label>
                    <input type="password" class="form-input" id="cfg-sb-key" value="${config.supabaseAnonKey || ''}" placeholder="Chave Anon JWT">
                </div>
                
                <div style="margin-top:1.5rem; display:flex; gap:1rem;">
                    <button type="submit" class="btn btn-primary"><i class="fa-solid fa-cloud-arrow-up"></i> Conectar Nuvem</button>
                    ${(config.supabaseUrl) ? `<button type="button" class="btn btn-secondary" id="btn-disconnect-cloud" style="background:#ef4444; color:#fff;">Desconectar Nuvem</button>` : ''}
                </div>
            </form>
        </div>

    </div>
    `;

    // Exportação JSON
    document.getElementById('btn-export-json').addEventListener('click', () => exportDatabase());

    // Importação JSON
    const jsonTrigger = document.getElementById('btn-trigger-import');
    const jsonInput = document.getElementById('import-json-uploader');
    if (jsonTrigger && jsonInput) {
        jsonTrigger.addEventListener('click', () => jsonInput.click());
        jsonInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const r = new FileReader();
            r.onload = async (event) => {
                try {
                    await importDatabase(event.target.result);
                    alert("Backup importado com sucesso! Recarregando...");
                    renderAdminDashboard(box.closest('.main-container').parentNode);
                } catch (err) {
                    alert(err.message);
                }
            };
            r.readAsText(file);
        });
    }

    // Download CSV Template
    document.getElementById('btn-download-csv-tpl').addEventListener('click', () => {
        const csvContent = "data:text/csv;charset=utf-8,Marca,Modelo,Versao,AnoFabricacao,AnoModelo,KM,Preco,Cambio,Combustivel,Cor,Portas,Carroceria,Descricao,Opcionais\n" +
            "Chevrolet,Onix,1.4 LTZ Automatico,2019,2019,48000,68900,Automático,Flex,Preto,4,Hatch,Onix em excelente conservação.,Ar-condicionado;Direção elétrica;ABS\n" +
            "Jeep,Compass,2.0 Longitude,2020,2021,35000,119900,Automático,Flex,Branco,4,SUV,Lindo Compass longitude.,Ar-condicionado;Multimídia;Bancos de couro";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "modelo_importacao_veiculos.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
    });

    // Importação Planilha CSV
    const csvTrigger = document.getElementById('btn-trigger-csv-import');
    const csvInput = document.getElementById('import-csv-uploader');
    if (csvTrigger && csvInput) {
        csvTrigger.addEventListener('click', () => csvInput.click());
        csvInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const r = new FileReader();
            r.onload = async (event) => {
                try {
                    const text = event.target.result;
                    const lines = text.split('\n');
                    const headers = lines[0].split(',');
                    
                    let importedCount = 0;
                    for (let i = 1; i < lines.length; i++) {
                        if (!lines[i].trim()) continue;
                        
                        // Parse de linha simples por vírgula (sem lidar com aspas complexas, assume aspas simples nos campos)
                        const cols = lines[i].split(',');
                        if (cols.length < 8) continue;

                        const brand = cols[0];
                        const model = cols[1];
                        const yearModel = parseInt(cols[4] || 2020);
                        const finalId = `${brand.toLowerCase()}-${model.toLowerCase()}-${yearModel}-${Math.random().toString(36).substr(2, 5)}`.replace(/\s+/g, '-');

                        const carObj = {
                            id: finalId,
                            brand: cols[0],
                            model: cols[1],
                            version: cols[2],
                            yearMfg: parseInt(cols[3] || 2020),
                            yearModel: yearModel,
                            km: parseInt(cols[5] || 0),
                            price: parseFloat(cols[6] || 0),
                            transmission: cols[7],
                            fuel: cols[8] || 'Flex',
                            color: cols[9] || 'Cinza',
                            doors: parseInt(cols[10] || 4),
                            bodyType: cols[11] || 'Hatch',
                            description: cols[12] || '',
                            options: cols[13] ? cols[13].split(';').map(o => o.trim()) : [],
                            status: 'available',
                            photos: [],
                            featured: false,
                            active: true,
                            dateAdded: new Date().toISOString().split('T')[0]
                        };

                        await saveVehicle(carObj);
                        importedCount++;
                    }

                    alert(`Importação concluída! ${importedCount} veículos cadastrados com sucesso.`);
                    renderAdminDashboard(box.closest('.main-container').parentNode);
                } catch (err) {
                    alert("Falha ao analisar a planilha CSV. Certifique-se de que o arquivo segue o modelo exato.");
                }
            };
            r.readAsText(file);
        });
    }

    // Configuração Supabase
    document.getElementById('supabase-config-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const url = document.getElementById('cfg-sb-url').value;
        const key = document.getElementById('cfg-sb-key').value;

        const newCfg = {
            ...config,
            supabaseUrl: url,
            supabaseAnonKey: key
        };

        saveConfig(newCfg);
        alert("Credenciais do Supabase salvas. O catálogo tentará ler/escrever na nuvem na próxima atualização!");
        renderAdminDashboard(box.closest('.main-container').parentNode);
    });

    const discCloud = document.getElementById('btn-disconnect-cloud');
    if (discCloud) {
        discCloud.addEventListener('click', () => {
            if (confirm("Deseja desligar a sincronização nuvem e voltar ao modo LocalStorage? (Os dados remotos continuarão salvos no seu banco Supabase)")) {
                const newCfg = {
                    ...config,
                    supabaseUrl: "",
                    supabaseAnonKey: ""
                };
                saveConfig(newCfg);
                alert("Nuvem desconectada. Modo LocalStorage ativo.");
                renderAdminDashboard(box.closest('.main-container').parentNode);
            }
        });
    }
}

/* ==========================================================================
   FUNÇÕES AUXILIARES DE TRATAMENTO DE IMAGEM & MINIATURAS
   ========================================================================== */
function handleUploadedFiles(files) {
    const promises = Array.from(files).map(file => {
        return compressImage(file, 800, 600, 0.7);
    });

    Promise.all(promises).then(compressedBase64Images => {
        adminState.uploadedPhotos = [...adminState.uploadedPhotos, ...compressedBase64Images];
        refreshUploadedPhotos();
    }).catch(err => {
        console.error(err);
        alert("Falha ao comprimir uma ou mais fotos selecionadas.");
    });
}

function refreshUploadedPhotos() {
    const container = document.getElementById('uploaded-photos-container');
    if (!container) return;

    if (adminState.uploadedPhotos.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; font-size:0.85rem; color:var(--text-muted); text-align:center; padding:1rem 0;">Nenhuma foto cadastrada.</p>`;
        return;
    }

    container.innerHTML = adminState.uploadedPhotos.map((base64, index) => `
    <div class="uploaded-photo-card">
        <img src="${base64}" alt="Foto ${index + 1}">
        ${index === 0 ? `<span class="photo-badge-main">Principal</span>` : ''}
        <div class="photo-actions">
            ${index !== 0 ? `<button type="button" class="photo-action-btn btn-make-main" data-index="${index}" title="Tornar Principal"><i class="fa-solid fa-star"></i></button>` : ''}
            <button type="button" class="photo-action-btn btn-del-photo" data-index="${index}" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
        </div>
    </div>`).join('');

    // Liga cliques das fotos
    container.querySelectorAll('.btn-make-main').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.getAttribute('data-index'));
            const photos = adminState.uploadedPhotos;
            // Move item para a primeira posição (principal)
            const [item] = photos.splice(idx, 1);
            photos.unshift(item);
            adminState.uploadedPhotos = photos;
            refreshUploadedPhotos();
        });
    });

    container.querySelectorAll('.btn-del-photo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.getAttribute('data-index'));
            adminState.uploadedPhotos.splice(idx, 1);
            refreshUploadedPhotos();
        });
    });
}

/**
 * Canvas Image Compressor Helper.
 * Redimensiona a foto proporcionalmente, converte para WebP e reduz o tamanho do arquivo.
 */
function compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Conversão nativa WebP se disponível, fallback JPEG
                let dataUrl = '';
                try {
                    dataUrl = canvas.toDataURL('image/webp', quality);
                } catch(e) {
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }
                resolve(dataUrl);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}
