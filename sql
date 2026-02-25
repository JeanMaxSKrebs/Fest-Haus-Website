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