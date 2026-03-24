import { supabase } from "../config/supabase.js";
import {
  criarEventoAgendamento,
  deletarEventoAgendamento,
} from "../services/google-calendar.service.js";

import { criarNotificacao } from "../services/notificacoes.service.js";
import { enviarEmail } from "../services/email.service.js";
import { formatarDataPtBR } from "../utils/formatarData.js";


const supabaseUrl = process.env.SUPABASE_URL;
const coinUrl = `${supabaseUrl}/storage/v1/object/public/email-assets/coin/festcoindouble.png`;

async function anexarUsuarios(agendamentos = []) {
  if (!agendamentos.length) return [];

  const usuarioIds = [
    ...new Set(agendamentos.map((ag) => ag.usuario_id).filter(Boolean)),
  ];

  if (!usuarioIds.length) {
    return agendamentos.map((ag) => ({
      ...ag,
      usuario: null,
    }));
  }

  const { data: usuarios, error: usuariosError } = await supabase
    .from("usuarios")
    .select("id, nome, email, telefone")
    .in("id", usuarioIds);

  if (usuariosError) {
    console.error("Erro ao buscar usuários:", usuariosError);

    return agendamentos.map((ag) => ({
      ...ag,
      usuario: null,
    }));
  }

  const usuariosMap = new Map(
    (usuarios || []).map((usuario) => [usuario.id, usuario])
  );

  return agendamentos.map((ag) => ({
    ...ag,
    usuario: usuariosMap.get(ag.usuario_id) || null,
  }));
}

async function anexarFestas(agendamentos = []) {
  if (!agendamentos.length) return [];

  const agendamentoIds = agendamentos.map((ag) => ag.id).filter(Boolean);

  if (!agendamentoIds.length) {
    return agendamentos.map((ag) => ({
      ...ag,
      festa: null,
      festa_id: null,
      festa_registrada: false,
      festa_realizada: false,
    }));
  }

  const { data: festas, error: festasError } = await supabase
    .from("festas_usuario")
    .select("id, agendamento_id, usuario_id, titulo, data_festa, realizada, created_at")
    .in("agendamento_id", agendamentoIds);

  if (festasError) {
    console.error("Erro ao buscar festas dos agendamentos:", festasError);

    return agendamentos.map((ag) => ({
      ...ag,
      festa: null,
      festa_id: null,
      festa_registrada: false,
      festa_realizada: false,
    }));
  }

  const festasMap = new Map(
    (festas || []).map((festa) => [festa.agendamento_id, festa])
  );

  return agendamentos.map((ag) => {
    const festa = festasMap.get(ag.id) || null;

    return {
      ...ag,
      festa,
      festa_id: festa?.id || null,
      festa_registrada: Boolean(festa),
      festa_realizada: Boolean(festa?.realizada),
    };
  });
}

async function enriquecerAgendamentos(agendamentos = []) {
  const comUsuarios = await anexarUsuarios(agendamentos);
  const comFestas = await anexarFestas(comUsuarios);
  return comFestas;
}

function montarTituloFesta(servico, dataEvento) {
  if (!servico && !dataEvento) return "Minha Festa";
  if (!servico) return `Festa ${dataEvento}`;
  return `${servico}`;
}

async function garantirFestaDoAgendamento(agendamento) {
  if (!agendamento?.id || !agendamento?.usuario_id) {
    return null;
  }

  const { data: existente, error: erroExistente } = await supabase
    .from("festas_usuario")
    .select("id, agendamento_id, usuario_id, titulo, data_festa, criado_pelo_site, realizada, created_at")
    .eq("agendamento_id", agendamento.id)
    .maybeSingle();

  if (erroExistente) {
    throw erroExistente;
  }

  if (existente) {
    return existente;
  }

  const payload = {
    usuario_id: agendamento.usuario_id,
    agendamento_id: agendamento.id,
    titulo: montarTituloFesta(agendamento.servico, agendamento.data_evento),
    data_festa: agendamento.data_evento || null,
    criado_pelo_site: true,
    realizada: false,
  };

  const { data: criada, error: erroCriacao } = await supabase
    .from("festas_usuario")
    .insert([payload])
    .select("id, agendamento_id, usuario_id, titulo, data_festa, criado_pelo_site, realizada, created_at")
    .single();

  if (erroCriacao) {
    throw erroCriacao;
  }

  return criada;
}

export async function criarAgendamento(req, res, next) {
  try {
    const { usuario_id, servico, data_evento, mensagem } = req.body;

    if (!usuario_id || !servico || !data_evento) {
      return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }

    const googleEvent = await criarEventoAgendamento({
      servico,
      data_evento,
      mensagem,
    });

    const { data, error } = await supabase
      .from("agendamentos")
      .insert([
        {
          usuario_id,
          servico,
          data_evento,
          mensagem: mensagem || null,
          google_event_id: googleEvent?.id || null,
          status: "em_processo",
        },
      ])
      .select("*")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const resultado = await enriquecerAgendamentos([data]);

    res.status(201).json(resultado[0]);
  } catch (error) {
    next(error);
  }
}

export async function listarAgendamentos(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from("agendamentos")
      .select("*")
      .order("data_evento", { ascending: true });

    if (error) {
      console.error("Erro Supabase listarAgendamentos:", error);
      return res.status(400).json({ error: error.message });
    }

    const resultado = await enriquecerAgendamentos(data || []);

    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function listarAgendamentosPorUsuario(req, res, next) {
  try {
    const { usuario_id } = req.params;

    const { data, error } = await supabase
      .from("agendamentos")
      .select("*")
      .eq("usuario_id", usuario_id)
      .order("data_evento", { ascending: true });

    if (error) {
      console.error("Erro Supabase listarAgendamentosPorUsuario:", error);
      return res.status(400).json({ error: error.message });
    }

    const resultado = await enriquecerAgendamentos(data || []);

    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function buscarAgendamentoPorId(req, res, next) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("agendamentos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const resultado = await enriquecerAgendamentos([data]);

    res.json(resultado[0]);
  } catch (error) {
    next(error);
  }
}

export async function deletarAgendamento(req, res, next) {
  try {
    const { id } = req.params;

    const { data: agendamento, error: erroBusca } = await supabase
      .from("agendamentos")
      .select("id, google_event_id")
      .eq("id", id)
      .single();

    if (erroBusca) {
      return res.status(400).json({ error: erroBusca.message });
    }

    if (agendamento?.google_event_id) {
      await deletarEventoAgendamento(agendamento.google_event_id);
    }

    const { error: erroDelete } = await supabase
      .from("agendamentos")
      .delete()
      .eq("id", id);

    if (erroDelete) {
      return res.status(400).json({ error: erroDelete.message });
    }

    res.json({ message: "Agendamento deletado" });
  } catch (error) {
    next(error);
  }
}

export async function aprovarAgendamento(req, res, next) {
  try {
    const { id } = req.params;

    const { data: agendamentoAtual, error: erroBusca } = await supabase
      .from("agendamentos")
      .select("*")
      .eq("id", id)
      .single();

    if (erroBusca || !agendamentoAtual) {
      return res.status(404).json({ error: "Agendamento não encontrado" });
    }

    const { data, error } = await supabase
      .from("agendamentos")
      .update({ status: "aprovado" })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const festaCriadaOuExistente = await garantirFestaDoAgendamento(data);

    const festaId = festaCriadaOuExistente?.id || null;
    const linkFesta = festaId ? `/minhas-festas/${festaId}` : "/minhas-festas";
    const dataFormatada = formatarDataPtBR(data.data_evento);

    try {
      await criarNotificacao({
        usuario_id: data.usuario_id,
        tipo: "agendamento_aprovado",
        titulo: "Seu agendamento foi aprovado",
        mensagem: `Seu agendamento para ${data.servico} foi aprovado com sucesso. Data do evento: ${dataFormatada}.`,
        link: linkFesta,
        referencia_id: data.id,
      });
    } catch (notificacaoError) {
      console.error(
        "Erro ao criar notificação de agendamento aprovado:",
        notificacaoError
      );
    }

    try {
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("nome, email")
        .eq("id", data.usuario_id)
        .single();

      if (usuario?.email) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const linkCompleto = `${frontendUrl}${linkFesta}`;

        await enviarEmail({
          to: usuario.email,
          subject: "Seu agendamento foi aprovado 🎉",
          text: `Olá${usuario?.nome ? `, ${usuario.nome}` : ""}!

Seu agendamento para ${data.servico} foi aprovado com sucesso.

Data do evento: ${dataFormatada}

Acesse sua área:
${linkCompleto}

Em breve, você poderá acompanhar sua festa e ganhar algumas FestCoins adicionando as fotos dela.

Equipe Fest Haus`,
          html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1726; background: #f8f5fc; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid rgba(124, 58, 237, 0.08);">
        
        <div style="background: linear-gradient(135deg, #3b0a57 0%, #6d28d9 100%); padding: 28px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; color: #ffffff;">
            🎉 Seu agendamento foi aprovado
          </h1>
        </div>

        <div style="padding: 28px 24px;">
          <p style="margin-top: 0; font-size: 16px;">
            Olá${usuario?.nome ? `, <strong>${usuario.nome}</strong>` : ""}!
          </p>

          <p style="font-size: 16px; color: #3a2d44;">
            Seu agendamento para <strong>${data.servico}</strong> foi aprovado com sucesso pela equipe da Fest Haus.
          </p>

          <div style="margin: 20px 0; padding: 16px 18px; border-radius: 14px; background: #faf5ff; border: 1px solid rgba(124, 58, 237, 0.14);">
            <p style="margin: 0; font-size: 15px; color: #4b3561;">
              <strong>📅 Data do evento:</strong><br />
              ${dataFormatada}
            </p>
          </div>

          <div style="margin: 24px 0; padding: 18px; border-radius: 16px; background: linear-gradient(135deg, rgba(253, 213, 126, 0.14), rgba(124, 58, 237, 0.08)); border: 1px solid rgba(253, 213, 126, 0.28); text-align: center;">
            <img
              src="${coinUrl}"
              alt="FestCoin"
              width="72"
              style="display: block; margin: 0 auto 14px;"
            />

            <p style="margin: 0; font-size: 16px; font-weight: 700; color: #4a2a67;">
              Em breve, você poderá ganhar algumas FestCoins adicionando as fotos da sua festa
            </p>
          </div>

          <div style="margin: 28px 0; text-align: center;">
            <a
              href="${linkCompleto}"
              style="
                background: #7c3aed;
                color: #ffffff;
                padding: 14px 22px;
                border-radius: 10px;
                text-decoration: none;
                font-weight: 700;
                display: inline-block;
                box-shadow: 0 8px 18px rgba(124, 58, 237, 0.24);
              "
            >
              Acessar Minhas Festas
            </a>
          </div>

          <p style="font-size: 15px; color: #5c4a6a;">
            Pela sua área do usuário, você poderá acompanhar os próximos passos da sua festa.
          </p>

          <p style="margin-bottom: 0; font-size: 15px; color: #5c4a6a;">
            Equipe Fest Haus
          </p>
        </div>
      </div>
    </div>
  `,
        });
      }
    } catch (emailError) {
      console.error(
        "Erro ao enviar email de agendamento aprovado:",
        emailError
      );
    }

    const resultado = await enriquecerAgendamentos([data]);

    res.json({
      message: "Agendamento aprovado",
      data: {
        ...resultado[0],
        festa: festaCriadaOuExistente || resultado[0]?.festa || null,
        festa_id: festaId || resultado[0]?.festa_id || null,
        festa_registrada: Boolean(festaId || resultado[0]?.festa_id),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function rejeitarAgendamento(req, res, next) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("agendamentos")
      .update({ status: "rejeitado" })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const resultado = await enriquecerAgendamentos([data]);

    res.json({
      message: "Agendamento rejeitado",
      data: resultado[0],
    });
  } catch (error) {
    next(error);
  }
}