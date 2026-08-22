export const THEMES = {
    premium: {
        name: "Premium",
        description: "Visual sofisticado, escuro e elegante",
        class: "theme-premium",
        colors: {
            primaryColor: "#d4af37",    // Ouro fosco
            secondaryColor: "#aa8416",  // Dourado escuro
            accentColor: "#10b981",     // Verde esmeralda para disponível
            bgColor: "#0f172a",         // Fundo ardósia escuro
            textColor: "#f8fafc"        // Texto claro
        }
    },
    modern: {
        name: "Moderno",
        description: "Visual branco, minimalista e tecnológico",
        class: "theme-modern",
        colors: {
            primaryColor: "#4f46e5",    // Indigo
            secondaryColor: "#3730a3",  // Indigo Escuro
            accentColor: "#ec4899",     // Rosa para destaque
            bgColor: "#f8fafc",         // Fundo cinza suave
            textColor: "#0f172a"        // Texto quase preto
        }
    },
    sporty: {
        name: "Esportivo",
        description: "Visual mais agressivo e moderno",
        class: "theme-sporty",
        colors: {
            primaryColor: "#ff4500",    // Vermelho/Laranja Esportivo
            secondaryColor: "#cc3700",  // Vermelho queimado
            accentColor: "#eab308",     // Amarelo
            bgColor: "#1e1e1e",         // Fundo grafite escuro
            textColor: "#f3f4f6"        // Texto cinza claro
        }
    },
    executive: {
        name: "Executivo",
        description: "Visual elegante e corporativo",
        class: "theme-executive",
        colors: {
            primaryColor: "#1e3a8a",    // Azul Marinho
            secondaryColor: "#172554",  // Azul quase negro
            accentColor: "#f59e0b",     // Laranja âmbar
            bgColor: "#f8fafc",         // Fundo cinza muito claro
            textColor: "#0f172a"        // Texto escuro
        }
    }
};

/**
 * Aplica as cores e classes do tema atual no elemento HTML documentElement.
 */
export function applyTheme(config) {
    const html = document.documentElement;
    
    // Remove todas as classes de temas conhecidos
    Object.values(THEMES).forEach(t => {
        html.classList.remove(t.class);
    });
    
    // Se for um tema pronto, aplica sua classe
    if (THEMES[config.theme]) {
        html.classList.add(THEMES[config.theme].class);
        
        // Define as variáveis de cor com base nas configurações do tema pronto
        const colors = THEMES[config.theme].colors;
        html.style.setProperty('--primary-color', colors.primaryColor);
        html.style.setProperty('--secondary-color', colors.secondaryColor);
        html.style.setProperty('--accent-color', colors.accentColor);
        html.style.setProperty('--bg-color', colors.bgColor);
        html.style.setProperty('--text-color', colors.textColor);
        
        // Ajusta as cores secundárias do card
        if (config.theme === 'premium' || config.theme === 'sporty') {
            html.style.setProperty('--bg-card', '#1e293b');
            html.style.setProperty('--border-color', '#334155');
            html.style.setProperty('--text-muted', '#94a3b8');
        } else {
            html.style.setProperty('--bg-card', '#ffffff');
            html.style.setProperty('--border-color', '#e2e8f0');
            html.style.setProperty('--text-muted', '#64748b');
        }
    } else {
        // Fallback/Customizado direto
        const colors = config.customColors || THEMES.modern.colors;
        html.style.setProperty('--primary-color', colors.primaryColor);
        html.style.setProperty('--secondary-color', colors.secondaryColor);
        html.style.setProperty('--accent-color', colors.accentColor);
        html.style.setProperty('--bg-color', colors.bgColor);
        html.style.setProperty('--text-color', colors.textColor);
    }
}
