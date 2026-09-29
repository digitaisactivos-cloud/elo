# Acompanha+ 🕊️

PWA para uma igreja gerir o follow-up dos membros via **SMS manual**. Interface totalmente em português (PT-MZ/PT-PT).

## Stack
Next.js 14 (App Router) + TypeScript · Tailwind · shadcn-style UI · LocalStorage · next-pwa · lucide-react · PapaParse

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
4. A app funciona offline (Service Worker) e os dados ficam no LocalStorage do aparelho.

## Notas
- O envio de SMS é sempre manual: a app abre `sms:+258…?body=…` na app nativa.
- Sem login nem backend. Backup em Configurações → Exportar JSON.
- 33 templates pré-carregados em 10 categorias, com variáveis `{Nome}`, `{Nome_Igreja}`, `{Lider}`.
