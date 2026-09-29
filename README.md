# Acompanha+ 🕊️

PWA para uma igreja gerir o follow-up dos membros via **SMS manual**. Interface totalmente em português (PT-MZ/PT-PT).

## Stack
Next.js 14 (App Router) + TypeScript · Tailwind · Supabase (Postgres — única fonte de dados) · next-pwa · lucide-react · xlsx · PapaParse

## Supabase (obrigatório)
1. Cria o projeto em supabase.com → copia **Project URL** + **anon key** (Settings → API).
2. **SQL Editor → New query** → cola o conteúdo de `supabase-schema.sql` → Run (cria `membros`, `templates`, `envios`, `app_config`).
3. Copia `.env.example` para `.env.local` e preenche as 2 vars. Na Vercel: Settings → Environment Variables.
4. Sem as vars, a app mostra o ecrã de configuração em vez do conteúdo.

## Como correr localmente

```bash
npm install
npm run dev
# abre http://localhost:3000
```

## Build de produção

```bash
npm run build
npm start
```

## Instalar como PWA no telemóvel
1. Publica a app com HTTPS (ex.: Vercel — `vercel deploy`).
2. **Android (Chrome):** abre o URL → ⋮ → «Adicionar ao ecrã principal» / «Instalar app».
3. **iPhone (Safari):** Partilhar → «Adicionar ao Ecrã Principal».
4. A app funciona offline como PWA (shell); os dados vivem todos no Supabase.

## Notas
- O envio de SMS é sempre manual: a app abre `sms:+258…?body=…` na app nativa.
- Sem login na app — o acesso à base é pela anon key com policies públicas (restringe no Supabase se ativares Auth).
- 33 templates pré-carregados em 10 categorias, com variáveis `{Nome}`, `{Nome_Igreja}`, `{Lider}`. Cultos: Domingo 16h · Terça e Quinta 18h.
