import { supabase } from "../config/supabase.js";
import { criarNotificacao } from "../services/notificacoes.service.js";
import { enviarEmail } from "../services/email.service.js";
import { formatarDataPtBR } from "../utils/formatarData.js";
import {
    listarFestasAdminService,
    buscarFestaPorIdService,
    atualizarFestaParaRealizadaService,
    atualizarFestaParaAgendadaService,
    atualizarProcessamentoAutomaticoService,
    atualizarProcessamentoAutomaticoGlobalService,
    buscarFestasAutomaticasParaProcessamentoService,
    atualizarSituacaoImagensParaAguardandoService,
    atualizarSituacaoImagensService,
} from "../services/festas.service.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const EMAIL_ASSETS_BUCKET = "email-assets";
const FESTCOIN_EMAIL_IMAGE = "coin/festcoindouble.png";
const COIN_URL = SUPABASE_URL
    ? `${SUPABASE_URL}/storage/v1/object/public/${EMAIL_ASSETS_BUCKET}/${FESTCOIN_EMAIL_IMAGE}`
    : "";

function montarLinkFesta(festaId) {
    return `${FRONTEND_URL}/minhas-festas/${festaId}`;
}

function montarTituloFesta(nomeFesta) {
    return nomeFesta ? ` "${nomeFesta}"` : "";
}

function montarCardFestCoinHtml() {
    return `
    <div style="margin: 24px 0; padding: 18px; border-radius: 16px; background: linear-gradient(135deg, rgba(253, 213, 126, 0.14), rgba(124, 58, 237, 0.08)); border: 1px solid rgba(253, 213, 126, 0.28); text-align: center;">
      ${COIN_URL
            ? `
        <img
          src="${COIN_URL}"
          alt="FestCoin"
          width="72"
          style="display: block; margin: 0 auto 14px;"
        />
      `
            : ""
        }
      <p style="margin: 0; font-size: 16px; font-weight: 700; color: #4a2a67;">
        Ganhe algumas FestCoins adicionando as fotos da sua festa
      </p>
    </div>
  `;
}

function montarTemplateEmail({
    titulo,
    saudacaoNome,
    textoPrincipal,
    dataLabel,
    dataValor,
    botaoLabel,
    botaoHref,
    textoFinal,
}) {
    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1726; background: #f8f5fc; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid rgba(124, 58, 237, 0.08);">
        <div style="background: linear-gradient(135deg, #3b0a57 0%, #6d28d9 100%); padding: 28px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; color: #ffffff;">
            ${titulo}
          </h1>
        </div>

        <div style="padding: 28px 24px;">
          <p style="margin-top: 0; font-size: 16px;">
            Olá${saudacaoNome ? `, <strong>${saudacaoNome}</strong>` : ""}!
          </p>

          <p style="font-size: 16px; color: #3a2d44;">
            ${textoPrincipal}
          </p>

          <div style="margin: 20px 0; padding: 16px 18px; border-radius: 14px; background: #faf5ff; border: 1px solid rgba(124, 58, 237, 0.14);">
            <p style="margin: 0; font-size: 15px; color: #4b3561;">
              <strong>${dataLabel}</strong><br />
              ${dataValor}
            </p>
          </div>

          ${montarCardFestCoinHtml()}

          <div style="margin: 28px 0; text-align: center;">
            <a
              href="${botaoHref}"
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
              ${botaoLabel}
            </a>
          </div>

          <p style="font-size: 15px; color: #5c4a6a;">
            ${textoFinal}
          </p>

          <p style="margin-bottom: 0; font-size: 15px; color: #5c4a6a;">
            Equipe Fest Haus
          </p>
        </div>
      </div>
    </div>
  `;
}

async function anexarUsuarios(festas = []) {
    if (!festas.length) return [];

    const usuarioIds = [...new Set(festas.map((f) => f.usuario_id).filter(Boolean))];

    if (!usuarioIds.length) {
        return festas.map((festa) => ({
            ...festa,
            usuario: null,
        }));
    }

    const { data: usuarios, error } = await supabase
        .from("usuarios")
        .select("id, nome, email, telefone")
        .in("id", usuarioIds);

    if (error) {
        console.error("Erro ao buscar usuários das festas:", error);
        return festas.map((festa) => ({
            ...festa,
            usuario: null,
        }));
    }

    const usuariosMap = new Map((usuarios || []).map((u) => [u.id, u]));

    return festas.map((festa) => ({
        ...festa,
        usuario: usuariosMap.get(festa.usuario_id) || null,
    }));
}

async function enviarNotificacaoEEmailFestaRealizada(festa) {
    try {
        await criarNotificacao({
            usuario_id: festa.usuario_id,
            tipo: "festa_realizada",
            titulo: "Sua festa foi marcada como realizada",
            mensagem: `Sua festa${montarTituloFesta(
                festa.titulo
            )} foi marcada como realizada com sucesso pela equipe da Fest Haus.`,
            link: `/minhas-festas/${festa.id}`,
            referencia_id: festa.id,
        });
    } catch (error) {
        console.error("Erro ao criar notificação de festa realizada:", error);
    }

    try {
        const { data: usuario } = await supabase
            .from("usuarios")
            .select("nome, email")
            .eq("id", festa.usuario_id)
            .single();

        if (usuario?.email) {
            const linkCompleto = montarLinkFesta(festa.id);
            const dataFormatada = formatarDataPtBR(festa.data_festa);

            await enviarEmail({
                to: usuario.email,
                subject: "Sua festa foi marcada como realizada 🎉",
                text: `Olá${usuario?.nome ? `, ${usuario.nome}` : ""}!

Sua festa${montarTituloFesta(
                    festa.titulo
                )} foi marcada como realizada com sucesso pela equipe da Fest Haus.

Data da festa: ${dataFormatada}

Acesse sua área:
${linkCompleto}

Ganhe algumas FestCoins adicionando as fotos da sua festa.

Equipe Fest Haus`,
                html: montarTemplateEmail({
                    titulo: "🎉 Sua festa foi marcada como realizada",
                    saudacaoNome: usuario?.nome || "",
                    textoPrincipal: `Sua festa${montarTituloFesta(
                        festa.titulo
                    )} foi marcada como realizada com sucesso pela equipe da Fest Haus.`,
                    dataLabel: "📅 Data da festa:",
                    dataValor: dataFormatada,
                    botaoLabel: "Acessar Minhas Festas",
                    botaoHref: linkCompleto,
                    textoFinal:
                        "Pela sua área do usuário, você poderá mandar fotos da sua festa, para receber algumas Fest Coins.",
                }),
            });
        }
    } catch (error) {
        console.error("Erro ao enviar email de festa realizada:", error);
    }
}

async function enviarNotificacaoEEmailAguardandoImagens(festa) {
    try {
        await criarNotificacao({
            usuario_id: festa.usuario_id,
            tipo: "enviar_imagens_festa",
            titulo: "Agora você já pode enviar as fotos da sua festa",
            mensagem: `Sua festa${montarTituloFesta(
                festa.titulo
            )} já pode receber imagens. Envie suas fotos para participar das próximas etapas.`,
            link: `/minhas-festas/${festa.id}`,
            referencia_id: festa.id,
        });
    } catch (error) {
        console.error("Erro ao criar notificação de imagens:", error);
    }

    try {
        const { data: usuario } = await supabase
            .from("usuarios")
            .select("nome, email")
            .eq("id", festa.usuario_id)
            .single();

        if (usuario?.email) {
            const linkCompleto = montarLinkFesta(festa.id);
            const dataFormatada = formatarDataPtBR(festa.data_festa);

            await enviarEmail({
                to: usuario.email,
                subject: "📸 Envie as fotos da sua festa",
                text: `Olá${usuario?.nome ? `, ${usuario.nome}` : ""}!

Sua festa${montarTituloFesta(
                    festa.titulo
                )} já está pronta para receber imagens.

Data da festa: ${dataFormatada}

Envie suas fotos por aqui:
${linkCompleto}

Ganhe algumas FestCoins adicionando as fotos da sua festa.

Equipe Fest Haus`,
                html: montarTemplateEmail({
                    titulo: "📸 Envie as fotos da sua festa",
                    saudacaoNome: usuario?.nome || "",
                    textoPrincipal: `Sua festa${montarTituloFesta(
                        festa.titulo
                    )} já está pronta para receber imagens.`,
                    dataLabel: "📅 Data da festa:",
                    dataValor: dataFormatada,
                    botaoLabel: "Enviar fotos da festa",
                    botaoHref: linkCompleto,
                    textoFinal:
                        "Pela sua área do usuário, você pode adicionar as imagens da sua festa e acompanhar as próximas etapas do sistema.",
                }),
            });
        }
    } catch (error) {
        console.error("Erro ao enviar email para envio de imagens:", error);
    }
}

export async function listarFestasAdmin(_req, res, next) {
    try {
        const { data, error } = await listarFestasAdminService();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        const resultado = await anexarUsuarios(data || []);
        res.json(resultado);
    } catch (error) {
        next(error);
    }
}

export async function buscarFestaAdminPorId(req, res, next) {
    try {
        const { id } = req.params;

        const { data, error } = await buscarFestaPorIdService(id);

        if (error || !data) {
            return res.status(404).json({ error: "Festa não encontrada" });
        }

        const [resultado] = await anexarUsuarios([data]);
        res.json(resultado);
    } catch (error) {
        next(error);
    }
}

export async function marcarFestaComoRealizada(req, res, next) {
    try {
        const { id } = req.params;

        const { data: festaAtual, error: erroBusca } =
            await buscarFestaPorIdService(id);

        if (erroBusca || !festaAtual) {
            return res.status(404).json({ error: "Festa não encontrada" });
        }

        const agoraIso = new Date().toISOString();

        const { data, error } = await atualizarFestaParaRealizadaService(id, agoraIso);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        await enviarNotificacaoEEmailFestaRealizada(data);

        const [resultado] = await anexarUsuarios([data]);

        res.json({
            message: "Festa marcada como realizada com sucesso.",
            data: resultado,
        });
    } catch (error) {
        next(error);
    }
}

export async function voltarFestaParaAgendada(req, res, next) {
    try {
        const { id } = req.params;

        const { data: festaAtual, error: erroBusca } =
            await buscarFestaPorIdService(id);

        if (erroBusca || !festaAtual) {
            return res.status(404).json({ error: "Festa não encontrada" });
        }

        const { data, error } = await atualizarFestaParaAgendadaService(id);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        const [resultado] = await anexarUsuarios([data]);

        res.json({
            message: "Festa voltou para agendada com sucesso.",
            data: resultado,
        });
    } catch (error) {
        next(error);
    }
}

export async function atualizarProcessamentoAutomatico(req, res, next) {
    try {
        const { id } = req.params;
        const { processar_automaticamente } = req.body;

        const { data: festaAtual, error: erroBusca } =
            await buscarFestaPorIdService(id);

        if (erroBusca || !festaAtual) {
            return res.status(404).json({ error: "Festa não encontrada" });
        }

        const { data, error } = await atualizarProcessamentoAutomaticoService(
            id,
            Boolean(processar_automaticamente)
        );

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({
            message: "Processamento automático atualizado com sucesso.",
            data,
        });
    } catch (error) {
        next(error);
    }
}

export async function atualizarProcessamentoAutomaticoGlobal(req, res, next) {
    try {
        const { processar_automaticamente } = req.body;

        const { error } = await atualizarProcessamentoAutomaticoGlobalService(
            Boolean(processar_automaticamente)
        );

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({
            message: "Processamento automático global atualizado com sucesso.",
            data: {
                processar_automaticamente: Boolean(processar_automaticamente),
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function processarFestasAutomaticamente() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const { data: festas, error } =
        await buscarFestasAutomaticasParaProcessamentoService();

    if (error) {
        throw error;
    }

    let totalProcessadas = 0;

    for (const festa of festas || []) {
        if (!festa.data_festa) continue;

        const dataFesta = new Date(festa.data_festa);
        dataFesta.setHours(0, 0, 0, 0);

        const dataLimite = new Date(dataFesta);
        dataLimite.setDate(dataLimite.getDate() + 2);

        if (hoje < dataLimite) {
            continue;
        }

        let festaAtualizada = festa;

        if (festa.status === "agendada") {
            const { data: realizadaData, error: realizadaError } =
                await atualizarFestaParaRealizadaService(
                    festa.id,
                    new Date().toISOString()
                );

            if (realizadaError || !realizadaData) {
                console.error(
                    "[festas-auto] erro ao marcar como realizada:",
                    realizadaError
                );
                continue;
            }

            festaAtualizada = realizadaData;
            await enviarNotificacaoEEmailFestaRealizada(festaAtualizada);
        }

        if (festaAtualizada.situacao_imagens !== "aguardando_imagens") {
            const { data: imagensData, error: imagensError } =
                await atualizarSituacaoImagensParaAguardandoService(festa.id);

            if (imagensError || !imagensData) {
                console.error(
                    "[festas-auto] erro ao liberar imagens:",
                    imagensError
                );
                continue;
            }

            festaAtualizada = imagensData;
            await enviarNotificacaoEEmailAguardandoImagens(festaAtualizada);
        }

        totalProcessadas += 1;
    }

    return {
        total_encontradas: (festas || []).length,
        total_processadas: totalProcessadas,
    };
}

export async function atualizarSituacaoImagens(req, res, next) {
    try {
        const { id } = req.params;
        const { situacao_imagens } = req.body;

        const situacoesPermitidas = [
            "bloqueada",
            "aguardando_imagens",
            "em_analise",
            "liberadas",
        ];

        if (!situacoesPermitidas.includes(situacao_imagens)) {
            return res.status(400).json({
                error:
                    "situacao_imagens inválida. Use: bloqueada, aguardando_imagens, em_analise ou liberadas.",
            });
        }

        const { data: festaAtual, error: erroBusca } =
            await buscarFestaPorIdService(id);

        if (erroBusca || !festaAtual) {
            return res.status(404).json({ error: "Festa não encontrada" });
        }

        const { data, error } = await atualizarSituacaoImagensService(
            id,
            situacao_imagens
        );

        if (error || !data) {
            return res.status(400).json({
                error: error?.message || "Não foi possível atualizar a situação das imagens.",
            });
        }

        const [resultado] = await anexarUsuarios([data]);

        res.json({
            message: "Situação das imagens atualizada com sucesso.",
            data: resultado,
        });
    } catch (error) {
        next(error);
    }
}