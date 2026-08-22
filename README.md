# 🚗 Sistema de Catálogo Digital Profissional para Revendas de Veículos

Este é um sistema de catálogo digital completo, moderno, responsivo e personalizável para revenda de veículos. Ele foi projetado para operar com **custo de hospedagem R$ 0/mês**, alta performance e zero etapas de compilação (*zero build step*).

Uma revenda pode gerenciar seu estoque localmente no navegador por meio de `LocalStorage` (com exportador de backups) ou sincronizar tudo em tempo real na nuvem utilizando o plano gratuito do **Supabase**.

---

## 📂 Estrutura do Projeto

O projeto é estruturado em arquivos modulares puramente em HTML5, CSS3 Vanilla e JavaScript ES6 (sem dependências como Node.js ou bundlers):

```text
/car-catalog-system
├── index.html               # Entrada única do aplicativo (SPA Router)
├── robots.txt               # Configurações para robôs de busca (SEO)
├── sitemap.xml              # Sitemap estático para indexadores (SEO)
├── favicon.ico              # Ícone da aba do navegador
├── css/
│   └── style.css            # Estilos globais, temas responsivos e otimização de impressão
├── data/
│   └── defaultVehicles.json # Banco de estoque padrão inicial
└── js/
    ├── app.js               # Roteador central SPA e ciclo de vida
    ├── config.js            # Parâmetros e dados institucionais padrões
    ├── themes.js            # Temas pré-configurados (Premium, Moderno, Esportivo, Executivo)
    ├── storage.js           # Ponte de persistência inteligente (LocalStorage/Supabase)
    ├── analytics.js         # Rastreamento de visitas e cliques de contato
    ├── ai.js                # Conectividade Gemini IA para geração de anúncios comerciais
    └── components/          # Elementos reutilizáveis da interface
    │   ├── header.js        # Cabeçalho adaptativo e contador de favoritos
    │   ├── footer.js        # Rodapé corporativo e mapa de localização
    │   ├── vehicleCard.js   # Card de exibição do carro com badges e fav/compare
    │   ├── imageGallery.js  # Carrossel de fotos com miniaturas
    │   ├── financeSimulator.js # Simulador de parcelamento Price
    │   ├── compareModal.js  # Tabela comparativa side-by-side de specs
    │   └── filterPanel.js   # Painel de filtros dinâmicos de busca
    └── pages/               # Controladores de telas principais
        ├── clientHome.js    # Página pública com estoque, buscas, sobre e contato
        ├── vehicleDetail.js # Detalhes do veículo, SEO dinâmico e leads
        ├── favorites.js     # Exibição de carros curtidos pelo cliente
        ├── compare.js       # Visualização de veículos em comparação
        └── adminDashboard.js # Painel Administrativo de controle total
```

---

## ⚡ Como Rodar o Projeto Localmente

Por se tratar de um projeto de arquitetura limpa (sem compilação), você **não precisa instalar Node.js ou npm**:
1. Faça o download ou clone a pasta do projeto.
2. Para que os módulos ES6 do JavaScript funcionem corretamente devido a restrições de segurança do navegador (CORS), o projeto deve ser aberto através de um servidor local simples.
   - **Opção 1**: Abra a pasta no VS Code e clique em **Go Live** (usando a extensão Live Server).
   - **Opção 2 (Python)**: Abra o terminal dentro da pasta e execute `python -m http.server 8000`. Acesse `http://localhost:8000`.
   - **Opção 3**: Use qualquer outro servidor web de sua preferência.

---

## 🚀 Publicação Gratuita (GitHub Pages)

Para colocar o catálogo online com custo zero e domínio gratuito (`suarevenda.github.io`):
1. Crie uma conta gratuita no [GitHub](https://github.com).
2. Crie um repositório chamado `nome-da-revenda` (ou similar) como público.
3. Suba todos os arquivos deste projeto diretamente para a raiz do repositório.
4. Vá em **Settings** (Configurações do Repositório) → **Pages** (no menu lateral).
5. Em *Build and deployment*, escolha **Deploy from a branch** e selecione a branch `main` (ou `master`) e a pasta `/ (root)`. Clique em **Save**.
6. Em poucos minutos, seu site estará online no link fornecido pelo GitHub (ex: `https://seuusuario.github.io/nome-da-revenda/`).

> [!TIP]
> **Configurando Domínio Próprio**
> Se no futuro a revenda comprar um domínio próprio (ex: `www.nomedarevenda.com.br`), basta ir em **Settings** → **Pages** no GitHub, digitar o domínio em **Custom domain** e configurar o DNS no local de registro (como Registro.br ou Cloudflare). Não é necessário fazer nenhuma alteração de código.

---

## 🛠️ Configurando uma Nova Revenda

### Método Rápido (Painel Admin)
1. Acesse o site e navegue até `#/admin`.
2. Digite a senha padrão: `admin`.
3. Vá até a aba **Identidade Visual**.
4. Selecione um dos **Temas Prontos** (Premium, Moderno, Esportivo, Executivo).
5. Altere as cores, nome da revenda, logo, dados de telefone, e-mail, redes sociais e textos de biografia.
6. Clique em **Salvar Identidade Visual** para que tudo seja atualizado em tempo real.

### Método Fixo (Código Fonte)
Abra o arquivo [js/config.js](file:///C:/Users/pedro/.gemini/antigravity-ide/scratch/car-catalog-system/js/config.js) e edite as variáveis no objeto `DEFAULT_CONFIG`. Isso define as informações padrão que aparecem no site caso a pessoa acesse em um novo navegador sem configurações prévias salvas.

---

## 🚙 Gerenciando Veículos e Estoque

### Cadastro Manual e Upload de Imagens
No Painel Administrativo (`#/admin`), vá na aba **Estoque** e clique em **Cadastrar Veículo**:
- O sistema compacta e converte as fotos automaticamente para formato **WebP** usando a GPU do navegador (via Canvas) antes de salvar, permitindo cadastrar fotos em alta resolução sem sobrecarregar a memória do navegador ou banco de dados.
- Você pode reordenar as fotos com um clique, definir qual é a imagem principal e excluir fotos indesejadas.
- Você pode acionar a caixa **Destacar veículo** para colocá-lo no topo da página inicial do site.

### Cadastro em Massa via Planilha CSV
1. No Painel Administrativo, vá na aba **Backup & Cloud**.
2. Clique em **Baixar Modelo CSV**.
3. Abra a planilha em qualquer editor (Excel, Planilhas Google, etc.) e preencha a lista de carros seguindo o formato das colunas. Use o caractere `;` para separar os opcionais do carro.
4. Salve como formato `.csv`.
5. No painel administrativo, clique em **Importar Planilha CSV** e selecione o arquivo. O estoque inteiro será importado instantaneamente!

---

## ☁️ Conexão com Nuvem Gratuita (Supabase)

Para sincronizar o catálogo entre vários dispositivos e permitir que outros usuários vejam os veículos adicionados:
1. Crie uma conta gratuita no [Supabase](https://supabase.com).
2. Crie um novo projeto.
3. No painel do Supabase, vá em **SQL Editor** e execute o seguinte script para criar as tabelas necessárias:

```sql
-- 1. Tabela de Veículos
create table vehicles (
  id text primary key,
  brand text not null,
  model text not null,
  version text,
  "yearMfg" integer,
  "yearModel" integer,
  km integer,
  price numeric,
  "promoPrice" numeric,
  status text,
  transmission text,
  fuel text,
  "bodyType" text,
  color text,
  doors integer,
  "plateEnd" text,
  engine text,
  power text,
  displacement text,
  traction text,
  description text,
  notes text,
  featured boolean,
  active boolean,
  photos jsonb,
  options jsonb,
  "dateAdded" date
);

-- Habilita acesso de leitura pública
alter table vehicles enable row level security;
create policy "Acesso de leitura publica" on vehicles for select using (true);
create policy "Acesso total para anon" on vehicles for all using (true);

-- 2. Tabela de Leads
create table leads (
  id text primary key,
  created_at timestamp with time zone,
  name text,
  phone text,
  message text,
  origin text,
  "vehicleId" text
);

alter table leads enable row level security;
create policy "Leads insercao publica" on leads for insert with check (true);
create policy "Leads controle total anon" on leads for all using (true);

-- 3. Tabela de Eventos de Analytics
create table analytics_events (
  id bigint generated always as identity primary key,
  event_type text,
  metadata_val text,
  created_at timestamp with time zone
);

alter table analytics_events enable row level security;
create policy "Analytics insercao publica" on analytics_events for insert with check (true);
create policy "Analytics controle total anon" on analytics_events for all using (true);
```

4. Vá em **Project Settings** → **API** no Supabase e copie a **Project URL** e a **API Key (anon/public)**.
5. Acesse o painel admin do seu catálogo (`#/admin`), vá na aba **Backup & Cloud**, preencha os campos do Supabase e clique em **Conectar Nuvem**.
6. Pronto! O site passará a gravar e ler tudo em nuvem de forma imediata e transparente.

---

## 🤖 Manutenção e Evolução com IA

Este código foi estruturado especificamente para ser facilmente mantido e modificado por inteligências artificiais:
- **Separação de Preocupações**: Toda a lógica de armazenamento está em [js/storage.js](file:///C:/Users/pedro/.gemini/antigravity-ide/scratch/car-catalog-system/js/storage.js). Modificações no banco de dados só precisam ser feitas lá.
- **Componentização Sem Dependência**: Cada elemento do site é renderizado por um módulo de função pura contido na pasta `js/components/`, facilitando correções cirúrgicas de layout ou inclusão de campos na ficha sem quebrar outras áreas do sistema.
- **CSS Modular Centralizado**: Todas as regras visuais estão centralizadas em [css/style.css](file:///C:/Users/pedro/.gemini/antigravity-ide/scratch/car-catalog-system/css/style.css) usando convenções semânticas tradicionais do mercado de design.
