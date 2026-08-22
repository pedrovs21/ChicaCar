/**
 * Auxiliar para gerar uma descrição usando IA (Gemini 1.5 Flash ou Fallback Local).
 */
export async function generateAIDescription(car, apiKey = "") {
    const prompt = `Você é um redator de anúncios especialista em revenda de veículos. 
Escreva uma descrição altamente vendedora, moderna, com boa legibilidade e persuasiva para o veículo abaixo.
Use bullets (tópicos) para listar os pontos fortes e opcionais de maior valor.
Não exagere nem crie fatos que não estão listados.

Detalhes do Veículo:
- Marca: ${car.brand}
- Modelo: ${car.model}
- Versão: ${car.version}
- Ano Fabricação/Modelo: ${car.yearMfg}/${car.yearModel}
- Quilometragem: ${car.km.toLocaleString('pt-BR')} km
- Câmbio: ${car.transmission}
- Combustível: ${car.fuel}
- Cor: ${car.color}
- Motor: ${car.engine}
- Potência: ${car.power}
- Carroceria: ${car.bodyType}
- Opcionais Selecionados: ${car.options ? car.options.join(', ') : 'Nenhum'}
- Observações: ${car.notes || 'Nenhuma'}

Gere um retorno no formato JSON estruturado contendo exatamente as seguintes chaves (sem formatação markdown extra, retorne apenas o JSON bruto):
{
  "title": "Título comercial do anúncio",
  "description": "Texto da descrição detalhada para o site",
  "whatsappText": "Texto curto para enviar como proposta rápida no WhatsApp",
  "seoMeta": "Meta description curta de até 150 caracteres para SEO"
}`;

    // Se houver uma chave de API fornecida, tenta chamar a API do Gemini 1.5 Flash
    if (apiKey && apiKey.trim() !== "") {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt + "\nRetorne APENAS o JSON bruto válido, sem delimitadores como ```json." }]
                    }]
                })
            });

            if (response.ok) {
                const resData = await response.json();
                const textResponse = resData.candidates[0].content.parts[0].text;
                // Faz o parsing do JSON gerado pela IA
                const cleanJson = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
                return JSON.parse(cleanJson);
            } else {
                console.warn("Chave de API Gemini falhou ou retornou erro. Usando gerador estático local.");
            }
        } catch (e) {
            console.error("Falha ao se conectar com a API Gemini, acionando fallback local.", e);
        }
    }

    // fallback: Gerador Dinâmico Local baseados em templates profissionais
    return generateLocalTemplateDescription(car);
}

/**
 * Motor de templates local para gerar anúncios estruturados sem necessidade de chaves de API externas.
 */
function generateLocalTemplateDescription(car) {
    const kmText = car.km === 0 ? "Zero Km" : `${car.km.toLocaleString('pt-BR')} km rodados`;
    const priceText = car.promoPrice 
        ? `de R$ ${car.price.toLocaleString('pt-BR')} por apenas R$ ${car.promoPrice.toLocaleString('pt-BR')}` 
        : `por apenas R$ ${car.price.toLocaleString('pt-BR')}`;
    
    const optionalHighlights = car.options && car.options.length > 0 
        ? car.options.slice(0, 5).join(', ') + (car.options.length > 5 ? ' e muito mais!' : '')
        : 'Itens de série';

    const title = `${car.brand} ${car.model} ${car.version} ${car.yearModel}`;
    
    const description = `🔥 OPORTUNIDADE ÚNICA: ${car.brand.toUpperCase()} ${car.model.toUpperCase()} ${car.version.toUpperCase()}!

Apresentamos este excelente ${car.model}, ano ${car.yearMfg}/${car.yearModel}, na elegante cor ${car.color}. Equipado com motor ${car.engine} (${car.power}) e câmbio ${car.transmission}, este modelo une perfeitamente economia, excelente desempenho e conforto para você e sua família.

Veículo com apenas ${kmText}, muito bem conservado.

✨ Principais Destaques & Opcionais:
${car.options && car.options.length > 0 
    ? car.options.map(opt => `• ${opt}`).join('\n') 
    : '• Configuração completa de fábrica.'}

${car.notes ? `\n📝 Observações do veículo:\n${car.notes}` : ''}

Aceitamos seu veículo usado na troca com avaliação justa e facilitamos sua entrada no cartão de crédito em até 18x. Fazemos simulação online de financiamento na hora!`;

    const whatsappText = `Olá! Gostaria de mais informações sobre o ${car.brand} ${car.model} ${car.version} ${car.yearModel} (${kmText}) anunciado por R$ ${(car.promoPrice || car.price).toLocaleString('pt-BR')}.`;

    const seoMeta = `Compre seu ${car.brand} ${car.model} ${car.yearModel} ${car.color} ${car.transmission} na ${getConfig().companyName}. ${kmText}, preço imbatível: R$ ${(car.promoPrice || car.price).toLocaleString('pt-BR')}. Confira!`;

    return {
        title,
        description,
        whatsappText,
        seoMeta
    };
}
