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