# Fest Haus 🎉

Sistema completo de gerenciamento para o salão de festas **Fest Haus**, com foco em reservas, galeria interativa, painel administrativo e um sistema gamificado de moedas para usuários.

O projeto foi desenvolvido com **React + Supabase + Node.js**, com arquitetura pensada para evolução contínua e futura conversão para aplicativo mobile.

---

## 📌 Visão geral

O sistema atualmente permite:

### 👤 Usuários
- Login e cadastro (incluindo Google)
- Visualização de serviços
- Agendamento de visitas
- Visualização da galeria por categoria e data
- Envio de fotos de eventos *(em desenvolvimento)*
- Sistema de moedas *(em desenvolvimento)*

### 🛠️ Administrador
- Gerenciar serviços (CRUD completo)
- Upload de imagens (principal + galeria por serviço)
- Gerenciar galeria pública
- Aprovar conteúdos enviados pelos usuários *(em evolução)*

---

## 🚀 Tecnologias utilizadas

### Frontend
- React
- TypeScript
- Vite
- CSS puro (customizado com variáveis e responsividade)
- Context API (Auth)

### Backend
- Node.js
- Express
- Supabase (Auth + Database + Storage)

### Outros
- Multer (upload de imagens)
- HEIC convert (compatibilidade com iPhone)
- Supabase Storage

---

## 🎨 Estilo e UI

O projeto utiliza **CSS próprio**, com:

- Variáveis globais (`:root`)
- Suporte a tema claro/escuro
- Layout responsivo
- Componentização visual consistente (cards, botões, grids)
- Design moderno focado em UX simples

---

## 📂 Estrutura do projeto (resumida)

```bash
Fest-Haus-Website/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── lib/
│   │   ├── styles/
│   │   └── App.tsx
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middlewares/
│   └── app.js
│
├── supabase/
│   └── (banco + storage)
```

---

## ⚙️ Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/JeanMaxSKrebs/Fest-Haus-Website
cd Fest-Haus-Website
```

### 2. Instalar frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Instalar backend

```bash
cd backend
npm install
node server.js
```

---

## 🌐 Acessos

Frontend: http://localhost:5173  
Backend: http://localhost:3001  

---

## 🧠 Funcionalidades atuais

### 🔹 Serviços
- Cadastro via admin
- Imagem principal + galeria (até 5 imagens)
- Ativação/desativação

### 🔹 Galeria pública
- Filtro por categoria
- Filtro por data (mês/ano)
- Upload com categorização
- Organização automática no storage

### 🔹 Autenticação
- Login com email/senha
- Login com Google
- Controle de admin

### 🔹 Visitas
- Agendamento pelo usuário
- Integração com Google Calendar

---

## 💰 Sistema de Moedas *(em desenvolvimento)*

Sistema gamificado vinculado ao usuário com:

- Saldo de moedas
- Histórico de ganhos/gastos

### Missões
- 📸 Upload de fotos *(com aprovação)*
- 🎉 Eventos realizados
- ⭐ Destaque do mês
- 🔁 Login diário

### Recursos planejados
- Tiers de recompensa
- Sistema de streak
- Página de perfil com progresso
- Loja futura (uso das moedas)

---

## 📸 Upload de imagens

### Suporte a:
- JPG
- PNG
- WEBP
- HEIC *(convertido automaticamente)*

### Organização no Supabase Storage:

```bash
servicos/
  casamento/
    principal/
    galeria/

galeria/
  categoria/
    2026-03/
```

---

## 🔮 Próximos passos

- [ ] Sistema completo de moedas funcional
- [ ] Página de perfil do usuário
- [ ] Aprovação de fotos por admin
- [ ] Destaque do mês integrado com Instagram
- [ ] Dashboard administrativo avançado
- [ ] Notificações
- [ ] Otimização de imagens (thumbnails)
- [ ] Deploy em produção

---

## 📱 Futuro Mobile

O projeto foi estruturado para facilitar migração para:

- React Native
- Aplicativo Android/iOS

Reutilizando:
- lógica de negócio
- serviços API
- estrutura de dados

---

## 👨‍💻 Autor

Desenvolvido por **Jean Max**  
Projeto real para o salão **Fest Haus**

---

## 📄 Licença

Projeto de uso privado.