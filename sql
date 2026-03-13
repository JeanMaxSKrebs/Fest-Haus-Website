-- =====================================
--  TABELA USUARIOS
-- =====================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100),
    senha VARCHAR(255) NOT NULL,
    endereco TEXT
);

-- Inserir dois usuários de teste
INSERT INTO usuarios (id, nome, senha, telefone, email, endereco)
VALUES
    (1, 'admin', 'admin123', NULL, NULL, NULL), -- admin
    (2, 'user', 'user123', '51999999999', 'user@test.com', 'Rua Exemplo, 123'); -- usuário normal


-- =====================================
--  TABELA AGENDAMENTOS
-- =====================================
CREATE TABLE agendamentos (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    servico VARCHAR(100) NOT NULL,
    data_evento DATE NOT NULL,
    mensagem TEXT,
    criado_em TIMESTAMP DEFAULT NOW()
);


-- =====================================
--  TABELA ORCAMENTOS
-- =====================================
CREATE TABLE orcamentos (
    id SERIAL PRIMARY KEY,
    admin_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    servico VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    preco NUMERIC(10,2) DEFAULT 0.0,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Inserir alguns orçamentos pré-prontos
INSERT INTO orcamentos (admin_id, servico, descricao, preco)
VALUES
    (1, 'Casamento', 'Pacote Básico: Decoração + Buffet', 5000.00),
    (1, 'Aniversário', 'Pacote Infantil: Decoração + Bolo', 1500.00),
    (1, 'Eventos Corporativos', 'Pacote Corporativo: Coffee Break + Sala', 3000.00);

create table datas_bloqueadas (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  origem text, -- google ou sistema
  created_at timestamp default now()
);

alter table agendamentos add column google_event_id text;

alter table agendamentos
add column usuario_id_uuid uuid;

alter table agendamentos
add constraint agendamentos_usuario_fk
foreign key (usuario_id_uuid)
references auth.users(id)
on delete cascade;

-- 1. Adicionar nova coluna UUID
alter table orcamentos
add column usuario_id uuid;

-- 2. Criar foreign key
alter table orcamentos
add constraint orcamentos_usuario_fk
foreign key (usuario_id)
references auth.users(id)
on delete cascade;

alter table orcamentos
alter column usuario_id drop not null;

alter table agendamentos
alter column usuario_id drop not null;

drop table agendamentos cascade;

create table agendamentos (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references auth.users(id) on delete cascade,
  servico text not null,
  data_evento timestamp not null,
  mensagem text,
  google_event_id text,
  created_at timestamp default now()
);
ALTER TABLE agendamentos
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'em_processo';

CREATE TABLE public.visitas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  data_visita timestamp NOT NULL,
  mensagem text,
  status varchar(20) NOT NULL DEFAULT 'em_processo',
  google_event_id text,
  created_at timestamp DEFAULT now()
);

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
alter table usuarios add column is_admin boolean default false;

-- =========================================
-- EXTENSÃO UUID
-- =========================================
create extension if not exists "pgcrypto";

-- =========================================
-- TABELA USUARIOS
-- =========================================
create table if not exists public.usuarios (
    id uuid primary key,
    full_name text,
    email text unique,
    telefone text,
    is_admin boolean not null default false,
    created_at timestamptz not null default now()
);

-- adiciona colunas que possam estar faltando
alter table public.usuarios
    add column if not exists full_name text,
    add column if not exists email text,
    add column if not exists telefone text,
    add column if not exists is_admin boolean not null default false,
    add column if not exists created_at timestamptz not null default now();

-- remove senha se existir
alter table public.usuarios
    drop column if exists password;

-- garante unicidade do email
do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'usuarios_email_key'
    ) then
        alter table public.usuarios
        add constraint usuarios_email_key unique (email);
    end if;
end $$;

-- =========================================
-- TABELA ORCAMENTOS
-- =========================================
create table if not exists public.orcamentos (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid not null,
    descricao text not null,
    status text not null default 'pendente',
    created_at timestamptz not null default now()
);

alter table public.orcamentos
    add column if not exists usuario_id uuid,
    add column if not exists descricao text,
    add column if not exists status text not null default 'pendente',
    add column if not exists created_at timestamptz not null default now();

-- remove colunas que você disse que não devem existir
alter table public.orcamentos
    drop column if exists nome,
    drop column if exists email,
    drop column if exists telefone,
    drop column if exists data_evento,
    drop column if exists usuario_id_uuid;

-- se descricao ficou nullable por herança antiga, ajuste manualmente depois se houver dados ruins
-- alter table public.orcamentos alter column descricao set not null;
-- alter table public.orcamentos alter column usuario_id set not null;

-- =========================================
-- TABELA AGENDAMENTOS
-- =========================================
create table if not exists public.agendamentos (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid not null,
    servico text not null,
    data_evento timestamptz not null,
    mensagem text,
    google_event_id text,
    status text not null default 'em_processo',
    created_at timestamptz not null default now()
);

alter table public.agendamentos
    add column if not exists usuario_id uuid,
    add column if not exists servico text,
    add column if not exists data_evento timestamptz,
    add column if not exists mensagem text,
    add column if not exists google_event_id text,
    add column if not exists status text not null default 'em_processo',
    add column if not exists created_at timestamptz not null default now();

-- =========================================
-- TABELA VISITAS
-- =========================================
create table if not exists public.visitas (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid not null,
    data_visita timestamptz not null,
    mensagem text,
    google_event_id text,
    status text not null default 'em_processo',
    created_at timestamptz not null default now()
);

alter table public.visitas
    add column if not exists usuario_id uuid,
    add column if not exists data_visita timestamptz,
    add column if not exists mensagem text,
    add column if not exists google_event_id text,
    add column if not exists status text not null default 'em_processo',
    add column if not exists created_at timestamptz not null default now();

-- =========================================
-- TABELA DATAS_BLOQUEADAS
-- =========================================
create table if not exists public.datas_bloqueadas (
    data date primary key,
    origem text not null default 'google',
    created_at timestamptz not null default now()
);

alter table public.datas_bloqueadas
    add column if not exists origem text not null default 'google',
    add column if not exists created_at timestamptz not null default now();

-- =========================================
-- FOREIGN KEYS
-- =========================================

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'orcamentos_usuario_id_fkey'
    ) then
        alter table public.orcamentos
        add constraint orcamentos_usuario_id_fkey
        foreign key (usuario_id) references public.usuarios(id)
        on delete cascade;
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'agendamentos_usuario_id_fkey'
    ) then
        alter table public.agendamentos
        add constraint agendamentos_usuario_id_fkey
        foreign key (usuario_id) references public.usuarios(id)
        on delete cascade;
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'visitas_usuario_id_fkey'
    ) then
        alter table public.visitas
        add constraint visitas_usuario_id_fkey
        foreign key (usuario_id) references public.usuarios(id)
        on delete cascade;
    end if;
end $$;

-- =========================================
-- CHECKS DE STATUS
-- =========================================

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'orcamentos_status_check'
    ) then
        alter table public.orcamentos
        add constraint orcamentos_status_check
        check (status in ('pendente', 'aprovado', 'rejeitado'));
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'agendamentos_status_check'
    ) then
        alter table public.agendamentos
        add constraint agendamentos_status_check
        check (status in ('em_processo', 'aprovado', 'rejeitado'));
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'visitas_status_check'
    ) then
        alter table public.visitas
        add constraint visitas_status_check
        check (status in ('em_processo', 'aprovado', 'rejeitado'));
    end if;
end $$;

-- =========================================
-- ÍNDICES
-- =========================================
create index if not exists idx_usuarios_email on public.usuarios(email);
create index if not exists idx_usuarios_is_admin on public.usuarios(is_admin);

create index if not exists idx_orcamentos_usuario_id on public.orcamentos(usuario_id);
create index if not exists idx_orcamentos_status on public.orcamentos(status);
create index if not exists idx_orcamentos_created_at on public.orcamentos(created_at);

create index if not exists idx_agendamentos_usuario_id on public.agendamentos(usuario_id);
create index if not exists idx_agendamentos_status on public.agendamentos(status);
create index if not exists idx_agendamentos_data_evento on public.agendamentos(data_evento);

create index if not exists idx_visitas_usuario_id on public.visitas(usuario_id);
create index if not exists idx_visitas_status on public.visitas(status);
create index if not exists idx_visitas_data_visita on public.visitas(data_visita);