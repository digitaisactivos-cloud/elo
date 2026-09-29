-- Acompanha+ — Schema Supabase
-- Executa isto no SQL Editor do Supabase (https://supabase.com/dashboard -> SQL Editor -> New query)

-- 1) Tabelas
create table if not exists public.membros (
  id text primary key,
  nome text not null,
  telefone text not null,
  aniversario text,
  tags text[] not null default '{}',
  status text not null default 'nao_contatado',
  responsavel text,
  notas text,
  ultima_interacao text,
  proximo_contato text,
  criado_em text not null
);
create index if not exists membros_telefone_idx on public.membros (telefone);
create index if not exists membros_status_idx on public.membros (status);

create table if not exists public.templates (
  id text primary key,
  titulo text not null,
  categoria text not null,
  conteudo text not null,
  versiculo_ref text,
  is_padrao boolean not null default false
);

create table if not exists public.envios (
  id text primary key,
  membro_id text not null references public.membros(id) on delete cascade,
  template_id text,
  conteudo_final text not null,
  enviado_em text not null,
  respondido boolean not null default false,
  notas text
);
create index if not exists envios_membro_idx on public.envios (membro_id);

-- Config da igreja: tabela de linha única (id='geral')
create table if not exists public.app_config (
  id text primary key,
  nome_igreja text not null default 'Igreja Evangélica',
  lider_principal text not null default '',
  horario_cultos text not null default '',
  endereco text not null default '',
  atualizado_em text
);

-- 2) Habilitar RLS + policies abertas (app sem auth; restrinja se ativar Auth)
alter table public.membros enable row level security;
alter table public.templates enable row level security;
alter table public.envios enable row level security;
alter table public.app_config enable row level security;

drop policy if exists "publico total membros" on public.membros;
create policy "publico total membros" on public.membros for all using (true) with check (true);

drop policy if exists "publico total templates" on public.templates;
create policy "publico total templates" on public.templates for all using (true) with check (true);

drop policy if exists "publico total envios" on public.envios;
create policy "publico total envios" on public.envios for all using (true) with check (true);

drop policy if exists "publico total config" on public.app_config;
create policy "publico total config" on public.app_config for all using (true) with check (true);
