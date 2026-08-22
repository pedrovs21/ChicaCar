export const DEFAULT_CONFIG = {
    // Info Geral
    companyName: "AutoPremium Motores",
    tagline: "Sua melhor escolha em seminovos de luxo e utilitários",
    logoUrl: "", // Url da imagem ou vazio para usar iniciais/texto estilizado
    faviconUrl: "",
    
    // Contato & Localização
    whatsapp: "5511999998888",
    whatsappTemplate: "Olá! Tenho interesse no veículo {brand} {model} {version} {yearMfg}/{yearModel}, anunciado por R$ {price}. Gostaria de mais informações.",
    phone: "(11) 3456-7890",
    email: "contato@autopremium.com.br",
    address: "Avenida Europa, 1200 - Jardim Europa, São Paulo - SP",
    hours: "Segunda a Sexta: 09h às 19h | Sábados: 09h às 16h",
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.0869766948065!2d-46.67756162386561!3d-23.565313961817342!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce574e4c2f6d2f%3A0x7d0a6c62c262145b!2sAv.%20Europa%2C%201200%20-%20Jardim%20Europa%2C%20S%C3%A3o%20Paulo%20-%20SP!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr",
    
    // Redes Sociais
    instagram: "@autopremium.motores",
    facebook: "autopremium.motores",
    
    // Sobre a Revenda
    aboutTitle: "Tradição e Qualidade Desde 2012",
    aboutText: "Fundada com o propósito de oferecer veículos diferenciados e de procedência atestada, a AutoPremium Motores consolidou-se como referência no mercado de seminovos. Nossos veículos passam por rigorosa vistoria cautelar de mais de 150 itens, garantindo segurança jurídica e mecânica absoluta para sua compra. Trabalhamos com as melhores taxas de financiamento do mercado e aceitamos seu veículo usado na troca com avaliação justa.",
    statsVehiclesSold: "5.000+",
    statsYearsInMarket: "14",
    statsCustomerSatisfaction: "99.2%",

    // Configuração Visual & Tema Padrão
    theme: "modern", // premium, modern, sporty, executive
    customColors: {
        primaryColor: "#4f46e5",
        secondaryColor: "#4338ca",
        accentColor: "#f59e0b",
        bgColor: "#f8fafc",
        textColor: "#0f172a"
    },
    
    // Configurações Técnicas Opcionais
    supabaseUrl: "",
    supabaseAnonKey: "",
    adminPasswordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918" // Hash SHA-256 de "admin" por padrão
};

/**
 * Obtém a configuração atual mesclando as configurações personalizadas do banco/local com as padrões.
 */
export function getConfig() {
    const customConfig = localStorage.getItem("catalog_settings");
    if (!customConfig) {
        return { ...DEFAULT_CONFIG };
    }
    try {
        const parsed = JSON.parse(customConfig);
        // Garante que chaves ausentes na customizada herdem as padrão
        return { ...DEFAULT_CONFIG, ...parsed };
    } catch (e) {
        console.error("Erro ao parsear configurações salvas, usando padrão.", e);
        return { ...DEFAULT_CONFIG };
    }
}

/**
 * Salva a nova configuração no localStorage.
 */
export function saveConfig(newConfig) {
    try {
        localStorage.setItem("catalog_settings", JSON.stringify(newConfig));
        // Dispara evento global para que outros módulos possam escutar atualizações de tema
        window.dispatchEvent(new Event("catalog_config_updated"));
        return true;
    } catch (e) {
        console.error("Erro ao salvar configuração.", e);
        return false;
    }
}
