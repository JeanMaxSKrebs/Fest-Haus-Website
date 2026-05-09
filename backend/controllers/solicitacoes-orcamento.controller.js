import { supabase } from "../config/supabase.js";
import { enviarEmail } from "../services/email.service.js";
import { criarNotificacao } from "../services/notificacoes.service.js";

async function buscarSolicitacaoCompleta(id) {
  const { data, error } = await supabase
    .from("solicitacoes_orcamento")
    .select(`
      *,
      tipos_servico (
        id,
        nome
      ),
      usuarios (
        id,
        nome,
        email,
        telefone
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function garantirFestaDaSolicitacaoOrcamento(solicitacao) {
  if (!solicitacao?.usuario_id || !solicitacao?.id) {
    return null;
  }

  const { data: existente, error: erroExistente } = await supabase
    .from("festas_usuario")
    .select("*")
    .eq("usuario_id", solicitacao.usuario_id)
    .eq("solicitacao_orcamento_id", solicitacao.id)
    .maybeSingle();

  if (erroExistente) {
    throw erroExistente;
  }

  if (existente) {
    return existente;
  }

  const { data: criada, error: erroCriacao } = await supabase
    .from("festas_usuario")
    .insert([
      {
        usuario_id: solicitacao.usuario_id,
        solicitacao_orcamento_id: solicitacao.id,
        titulo: null,
        data_festa: null,
        criado_pelo_site: true,
        realizada: false,
        status: "agendada",
        situacao_imagens: "bloqueada",
      },
    ])
    .select("*")
    .single();

  if (erroCriacao) {
    throw erroCriacao;
  }

  return criada;
}

async function enviarEmailOrcamentoAprovado({ solicitacao, festa }) {
  const usuario = solicitacao.usuarios;

  if (!usuario?.email) {
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const linkFesta = festa?.id ? `/minhas-festas/${festa.id}` : "/minhas-festas";
  const linkCompleto = `${frontendUrl}${linkFesta}`;

  const nomeServico =
    solicitacao.tipos_servico?.nome ||
    solicitacao.titulo ||
    "sua solicitação de orçamento";

  await enviarEmail({
    to: usuario.email,
    subject: "Sua solicitação de orçamento foi aprovada 🎉",
    text: `Olá${usuario?.nome ? `, ${usuario.nome}` : ""}!

Sua solicitação de orçamento para ${nomeServico} foi aprovada pela equipe Fest Haus.

Criamos uma festa inicial na sua área para você completar as informações restantes, como nome e data.

Acesse:
${linkCompleto}

Equipe Fest Haus`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1726; background: #f8f5fc; padding: 24px;">
        <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid rgba(124, 58, 237, 0.08);">
          <div style="background: linear-gradient(135deg, #3b0a57 0%, #6d28d9 100%); padding: 28px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 26px; color: #ffffff;">
              🎉 Orçamento aprovado
            </h1>
          </div>

          <div style="padding: 28px 24px;">
            <p style="margin-top: 0; font-size: 16px;">
              Olá${usuario?.nome ? `, <strong>${usuario.nome}</strong>` : ""}!
            </p>

            <p style="font-size: 16px; color: #3a2d44;">
              Sua solicitação de orçamento para <strong>${nomeServico}</strong> foi aprovada pela equipe Fest Haus.
            </p>

            <p style="font-size: 16px; color: #3a2d44;">
              Criamos uma festa inicial na sua área. Agora você pode completar as informações restantes, como nome e data da festa.
            </p>

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
                Completar dados da festa
              </a>
            </div>

            <p style="margin-bottom: 0; font-size: 15px; color: #5c4a6a;">
              Equipe Fest Haus
            </p>
          </div>
        </div>
      </div>
    `,
  });
}

export async function criarSolicitacaoOrcamento(req, res, next) {
  try {
    const { usuario_id, tipo_servico_id, titulo, descricao } = req.body;

    if (!usuario_id || !tipo_servico_id || !descricao) {
      return res.status(400).json({
        error: "usuario_id, tipo_servico_id e descricao são obrigatórios",
      });
    }

    const { data, error } = await supabase
      .from("solicitacoes_orcamento")
      .insert([
        {
          usuario_id,
          tipo_servico_id,
          titulo: titulo || null,
          descricao,
          status: "pendente",
          aprovado_para_modelo: false,
        },
      ])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (error) {
    next(error);
  }
}

export async function listarSolicitacoesOrcamento(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from("solicitacoes_orcamento")
      .select(`
        *,
        tipos_servico (
          id,
          nome
        ),
        usuarios (
          id,
          nome,
          email,
          telefone
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function listarSolicitacoesOrcamentoPorUsuario(req, res, next) {
  try {
    const { usuario_id } = req.params;

    const { data, error } = await supabase
      .from("solicitacoes_orcamento")
      .select(`
        *,
        tipos_servico (
          id,
          nome
        )
      `)
      .eq("usuario_id", usuario_id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function buscarSolicitacaoOrcamentoPorId(req, res, next) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("solicitacoes_orcamento")
      .select(`
        *,
        tipos_servico (
          id,
          nome
        ),
        usuarios (
          id,
          nome,
          email,
          telefone
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function atualizarStatusSolicitacaoOrcamento(req, res, next) {
  try {
    const { id } = req.params;
    const { status, aprovado_para_modelo } = req.body;

    const payload = {};

    if (status !== undefined) {
      payload.status = status;
    }

    if (aprovado_para_modelo !== undefined) {
      payload.aprovado_para_modelo = aprovado_para_modelo;
    }

    const { data, error } = await supabase
      .from("solicitacoes_orcamento")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    let festa = null;

    if (status === "aprovada") {
      try {
        const solicitacaoCompleta = await buscarSolicitacaoCompleta(id);

        festa = await garantirFestaDaSolicitacaoOrcamento(solicitacaoCompleta);

        const linkFesta = festa?.id
          ? `/minhas-festas/${festa.id}`
          : "/minhas-festas";

        await criarNotificacao({
          usuario_id: solicitacaoCompleta.usuario_id,
          tipo: "orcamento_aprovado",
          titulo: "Seu orçamento foi aprovado",
          mensagem:
            "Sua solicitação de orçamento foi aprovada. Complete os dados da sua festa para continuar.",
          link: linkFesta,
          referencia_id: solicitacaoCompleta.id,
        });

        await enviarEmailOrcamentoAprovado({
          solicitacao: solicitacaoCompleta,
          festa,
        });
      } catch (efeitoAprovacaoError) {
        console.error(
          "Erro ao processar aprovação de orçamento:",
          efeitoAprovacaoError
        );
      }
    }

    res.json({
      ...data,
      festa,
    });
  } catch (error) {
    next(error);
  }
}

export async function deletarSolicitacaoOrcamento(req, res, next) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("solicitacoes_orcamento")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Solicitação excluída com sucesso" });
  } catch (error) {
    next(error);
  }
}

export async function converterSolicitacaoEmModelo(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, descricao, valor_base } = req.body;

    const { data: solicitacao, error: erroSolicitacao } = await supabase
      .from("solicitacoes_orcamento")
      .select("*")
      .eq("id", id)
      .single();

    if (erroSolicitacao || !solicitacao) {
      return res.status(404).json({ error: "Solicitação não encontrada" });
    }

    const { data: modelo, error: erroModelo } = await supabase
      .from("modelos_orcamento")
      .insert([
        {
          tipo_servico_id: solicitacao.tipo_servico_id,
          nome,
          descricao: descricao || solicitacao.descricao,
          valor_base: valor_base ?? null,
          ativo: true,
          origem_solicitacao_id: solicitacao.id,
        },
      ])
      .select()
      .single();

    if (erroModelo) {
      return res.status(400).json({ error: erroModelo.message });
    }

    const { error: erroUpdate } = await supabase
      .from("solicitacoes_orcamento")
      .update({
        status: "convertida_modelo",
        aprovado_para_modelo: true,
      })
      .eq("id", id);

    if (erroUpdate) {
      return res.status(400).json({ error: erroUpdate.message });
    }

    res.status(201).json(modelo);
  } catch (error) {
    next(error);
  }
}