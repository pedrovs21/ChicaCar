import { getConfig } from './config.js';

// Nome dos storages locais
const STORAGE_KEYS = {
    VEHICLES: 'tvcenter_products',
    LEADS: 'tvcenter_leads',
    ANALYTICS: 'tvcenter_analytics'
};

/**
 * Auxiliar para verificar se o Supabase está ativado e configurado.
 */
function getSupabaseConfig() {
    const config = getConfig();
    if (config.supabaseUrl && config.supabaseAnonKey) {
        return {
            url: config.supabaseUrl.replace(/\/$/, ""), // remove barra no final se houver
            key: config.supabaseAnonKey
        };
    }
    return null;
}

/**
 * Helper para requisições directas à REST API do Supabase (PostgREST).
 */
async function supabaseFetch(endpoint, options = {}) {
    const sb = getSupabaseConfig();
    if (!sb) throw new Error("Supabase não configurado.");
    
    const headers = {
        'apikey': sb.key,
        'Authorization': `Bearer ${sb.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers
    };
    
    const response = await fetch(`${sb.url}/rest/v1/${endpoint}`, {
        ...options,
        headers
    });
    
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Erro no Supabase: ${response.statusText}`);
    }
    
    return response.json();
}

/**
 * Inicializa os veículos padrão caso o LocalStorage esteja vazio e o Supabase não esteja ativo.
 */
async function initializeDefaultVehicles() {
    const local = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    if (!local) {
        try {
            const res = await fetch('data/defaultVehicles.json');
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(data));
                return data;
            }
        } catch (e) {
            console.error("Falha ao carregar defaultVehicles.json, iniciando vazio", e);
        }
        localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify([]));
        return [];
    }
    return JSON.parse(local);
}

/* ==========================================================================
   SERVIÇO PRINCIPAL DE VEÍCULOS
   ========================================================================== */
export async function getVehicles() {
    const sb = getSupabaseConfig();
    if (sb) {
        try {
            // Busca todos os veículos ordenados pela data de adição decrescente no Supabase
            return await supabaseFetch('vehicles?select=*&order=dateAdded.desc');
        } catch (e) {
            console.error("Erro ao buscar veículos no Supabase, usando LocalStorage como fallback.", e);
        }
    }
    return await initializeDefaultVehicles();
}

export async function getVehicleById(id) {
    const sb = getSupabaseConfig();
    if (sb) {
        try {
            const data = await supabaseFetch(`vehicles?id=eq.${id}&select=*`);
            return data[0] || null;
        } catch (e) {
            console.error("Erro ao buscar veículo por ID no Supabase", e);
        }
    }
    const list = await getVehicles();
    return list.find(v => v.id === id) || null;
}

export async function saveVehicle(vehicle) {
    const sb = getSupabaseConfig();
    if (sb) {
        try {
            // Verifica se o veículo já existe no Supabase (se sim, atualiza; se não, insere)
            const exists = await getVehicleById(vehicle.id);
            if (exists) {
                const res = await supabaseFetch(`vehicles?id=eq.${vehicle.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(vehicle)
                });
                return res[0];
            } else {
                const res = await supabaseFetch('vehicles', {
                    method: 'POST',
                    body: JSON.stringify(vehicle),
                    headers: { 'Prefer': 'return=representation' }
                });
                return res[0];
            }
        } catch (e) {
            console.error("Erro ao salvar no Supabase, salvando localmente.", e);
        }
    }
    
    // Fallback LocalStorage
    const list = await getVehicles();
    const idx = list.findIndex(v => v.id === vehicle.id);
    if (idx !== -1) {
        list[idx] = vehicle;
    } else {
        list.push(vehicle);
    }
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(list));
    return vehicle;
}

export async function deleteVehicle(id) {
    const sb = getSupabaseConfig();
    if (sb) {
        try {
            await supabaseFetch(`vehicles?id=eq.${id}`, {
                method: 'DELETE'
            });
            return true;
        } catch (e) {
            console.error("Erro ao excluir do Supabase", e);
        }
    }
    
    // Fallback LocalStorage
    const list = await getVehicles();
    const filtered = list.filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(filtered));
    return true;
}

/* ==========================================================================
   SERVIÇO DE LEADS
   ========================================================================== */
export async function getLeads() {
    const sb = getSupabaseConfig();
    if (sb) {
        try {
            return await supabaseFetch('leads?select=*&order=created_at.desc');
        } catch (e) {
            console.error("Erro ao carregar leads do Supabase", e);
        }
    }
    const local = localStorage.getItem(STORAGE_KEYS.LEADS);
    return local ? JSON.parse(local) : [];
}

export async function saveLead(lead) {
    const newLead = {
        id: lead.id || 'lead_' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        ...lead
    };
    
    const sb = getSupabaseConfig();
    if (sb) {
        try {
            const res = await supabaseFetch('leads', {
                method: 'POST',
                body: JSON.stringify(newLead)
            });
            return res[0];
        } catch (e) {
            console.error("Erro ao salvar lead no Supabase", e);
        }
    }
    
    const leads = await getLeads();
    leads.unshift(newLead); // Adiciona no início
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
    return newLead;
}

export async function deleteLead(id) {
    const sb = getSupabaseConfig();
    if (sb) {
        try {
            await supabaseFetch(`leads?id=eq.${id}`, {
                method: 'DELETE'
            });
            return true;
        } catch (e) {
            console.error("Erro ao deletar lead no Supabase", e);
        }
    }
    const leads = await getLeads();
    const filtered = leads.filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(filtered));
    return true;
}

/* ==========================================================================
   IMPORTAÇÃO E EXPORTAÇÃO COMPLETA (BACKUP JSON)
   ========================================================================== */
export async function exportDatabase() {
    const vehicles = await getVehicles();
    const leads = await getLeads();
    const settings = getConfig();
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        vehicles,
        leads,
        settings
    }, null, 2));
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `catalogo_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

export async function importDatabase(jsonData) {
    try {
        const parsed = JSON.parse(jsonData);
        if (parsed.vehicles) {
            // Salva os veículos no storage ativo
            const sb = getSupabaseConfig();
            if (sb) {
                for (const v of parsed.vehicles) {
                    await saveVehicle(v);
                }
            } else {
                localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(parsed.vehicles));
            }
        }
        if (parsed.leads && !sb) {
            localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(parsed.leads));
        }
        if (parsed.settings) {
            localStorage.setItem('catalog_settings', JSON.stringify(parsed.settings));
        }
        return true;
    } catch (e) {
        console.error("Erro na importação de banco", e);
        throw new Error("Formato de arquivo de backup inválido.");
    }
}
