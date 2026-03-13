import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import agendamentosRoutes from "./routes/agendamentos.routes.js";
import orcamentosRoutes from "./routes/orcamentos.routes.js";
import visitasRoutes from "./routes/visitas.routes.js";
import adminsRoutes from "./routes/admins.routes.js";
import googleCalendarRoutes from "./routes/google-calendar.routes.js";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";

import tiposServicoRoutes from "./routes/tipos-servico.routes.js";
import solicitacoesOrcamentoRoutes from "./routes/solicitacoes-orcamento.routes.js";
import modelosOrcamentoRoutes from "./routes/modelos-orcamento.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Fest Haus API rodando 🚀");
});

app.use(authRoutes);
app.use(googleCalendarRoutes);
app.use(adminsRoutes);
app.use(agendamentosRoutes);
app.use(orcamentosRoutes);
app.use(visitasRoutes);

app.use(tiposServicoRoutes);
app.use(solicitacoesOrcamentoRoutes);
app.use(modelosOrcamentoRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;