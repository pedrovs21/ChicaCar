import { getConfig } from './config.js';

const STORAGE_KEY = 'catalog_analytics';

/**
 * Obtém os dados de analytics consolidados do LocalStorage.
 */
export function getAnalyticsData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return {
            pageViews: 0,
            whatsappClicks: 0,
            phoneClicks: 0,
            vehicleViews: {} // { vehicleId: count }
        };
    }
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error("Erro ao ler analytics local", e);
        return { pageViews: 0, whatsappClicks: 0, phoneClicks: 0, vehicleViews: {} };
    }
}

/**
 * Salva os dados de analytics localmente.
 */
function saveAnalyticsLocal(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Registra uma visualização de página genérica.
 */
export function trackPageView() {
    const data = getAnalyticsData();
    data.pageViews = (data.pageViews || 0) + 1;
    saveAnalyticsLocal(data);
    
    // Tenta enviar para o Supabase de forma assíncrona e resiliente se configurado
    syncMetricToSupabase('page_view');
}

/**
 * Registra uma visualização a um veículo específico.
 */
export function trackVehicleView(vehicleId) {
    if (!vehicleId) return;
    const data = getAnalyticsData();
    if (!data.vehicleViews) data.vehicleViews = {};
    data.vehicleViews[vehicleId] = (data.vehicleViews[vehicleId] || 0) + 1;
    saveAnalyticsLocal(data);
    
    syncMetricToSupabase('vehicle_view', vehicleId);
}

/**
 * Registra um clique no botão do WhatsApp.
 */
export function trackWhatsappClick(vehicleId = null) {
    const data = getAnalyticsData();
    data.whatsappClicks = (data.whatsappClicks || 0) + 1;
    saveAnalyticsLocal(data);
    
    syncMetricToSupabase('whatsapp_click', vehicleId);
}

/**
 * Registra um clique em ligar.
 */
export function trackPhoneClick() {
    const data = getAnalyticsData();
    data.phoneClicks = (data.phoneClicks || 0) + 1;
    saveAnalyticsLocal(data);
    
    syncMetricToSupabase('phone_click');
}

/**
 * Helper para tentar sincronizar a métrica no Supabase de forma resiliente.
 */
async function syncMetricToSupabase(eventType, metadata = null) {
    const config = getConfig();
    if (!config.supabaseUrl || !config.supabaseAnonKey) return;
    
    try {
        const url = config.supabaseUrl.replace(/\/$/, "");
        const headers = {
            'apikey': config.supabaseAnonKey,
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json'
        };
        
        // Envia requisição POST silenciosa para a tabela 'analytics_events'
        // Criada na base do Supabase (comportamento "fire-and-forget" para não travar a UI)
        fetch(`${url}/rest/v1/analytics_events`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                event_type: eventType,
                metadata_val: metadata,
                created_at: new Date().toISOString()
            })
        }).catch(() => {
            // Ignora silenciosamente falhas de rede do Supabase
        });
    } catch (e) {
        // Ignora erros
    }
}
