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
import galeriaRoutes from "./routes/galeria.routes.js";

import perfilRoutes from "./routes/perfil.routes.js";
import moedasRoutes from "./routes/moedas.routes.js";


import { configurarBuckets } from "./config/storage.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://festhaus.site",
  "https://www.festhaus.site",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".pages.dev")
      ) {
        return callback(null, true);
      }

      return callback(new Error(`Origin não permitido por CORS: ${origin}`));
    },
    credentials: true,
  })
);

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
app.use(galeriaRoutes);


app.use(perfilRoutes);
app.use(moedasRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

configurarBuckets();

export default app;