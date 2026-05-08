import { supabase } from "../config/supabase.js";

async function garantirCarteira(usuarioId) {
    const { data: existente, error: erroBusca } = await supabase
        .from("moeda_carteiras")
        .select("id, usuario_id, saldo")
        .eq("usuario_id", usuarioId)
        .maybeSingle();

    if (erroBusca) throw erroBusca;

    if (existente) return existente;

    const { data: criada, error: erroCriar } = await supabase
        .from("moeda_carteiras")
        .insert([
            {
                usuario_id: usuarioId,
                saldo: 0,
            },
        ])
        .select("id, usuario_id, saldo")
        .single();

    if (erroCriar) throw erroCriar;

    return criada;
}

async function obterDataBrasil() {
    const { data, error } = await supabase.rpc("data_brasil");

    if (error) throw error;

    return data;
}

function calcularNovaStreak(ultimoLogin, sequenciaAtual, hoje) {
    if (!ultimoLogin) {
        return 1;
    }

    const dataHoje = new Date(`${hoje}T00:00:00`);
    const dataUltimo = new Date(`${ultimoLogin}T00:00:00`);

    const diffMs = dataHoje.getTime() - dataUltimo.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias === 0) {
        return sequenciaAtual;
    }

    if (diffDias === 1) {
        return sequenciaAtual + 1;
    }

    return 1;
}

export async function buscarResumoMoedas(req, res, next) {
    try {
        const usuarioId = req.user?.id;

        if (!usuarioId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        await garantirCarteira(usuarioId);

        const { data: resumo, error: resumoError } = await supabase
            .from("vw_moeda_resumo_usuario")
            .select("usuario_id, saldo, checkin_hoje")
            .eq("usuario_id", usuarioId)
            .maybeSingle();

        if (resumoError) throw resumoError;

        const { data: streak, error: streakError } = await supabase
            .from("usuario_streaks_login")
            .select("sequencia_atual, maior_sequencia, ultimo_login")
            .eq("usuario_id", usuarioId)
            .maybeSingle();

        if (streakError) throw streakError;

        const { data: ganhos, error: ganhosError } = await supabase
            .from("moeda_movimentacoes")
            .select("quantidade")
            .eq("usuario_id", usuarioId)
            .eq("tipo", "ganho");

        if (ganhosError) throw ganhosError;

        const { data: gastos, error: gastosError } = await supabase
            .from("moeda_movimentacoes")
            .select("quantidade")
            .eq("usuario_id", usuarioId)
            .eq("tipo", "gasto");

        if (gastosError) throw gastosError;

        const totalGanhos = (ganhos || []).reduce(
            (acc, item) => acc + Number(item.quantidade || 0),
            0
        );

        const totalGastos = (gastos || []).reduce(
            (acc, item) => acc + Number(item.quantidade || 0),
            0
        );

        return res.json({
            saldo: Number(resumo?.saldo || 0),
            checkin_hoje: Boolean(resumo?.checkin_hoje),
            sequencia_atual: Number(streak?.sequencia_atual || 0),
            maior_sequencia: Number(streak?.maior_sequencia || 0),
            total_ganhas: totalGanhos,
            total_gastas: totalGastos,
        });
    } catch (error) {
        console.error("Erro buscarResumoMoedas:", error);
        next(error);
    }
}

export async function listarExtratoMoedas(req, res, next) {
    try {
        const usuarioId = req.user?.id;

        if (!usuarioId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const { data, error } = await supabase
            .from("moeda_movimentacoes")
            .select("id, tipo, origem, referencia_id, quantidade, descricao, created_at")
            .eq("usuario_id", usuarioId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const extrato = (data || []).map((item) => ({
            id: item.id,
            tipo: item.tipo,
            origem: item.origem,
            referencia_id: item.referencia_id,
            valor: Number(item.quantidade || 0),
            descricao: item.descricao || item.origem,
            criado_em: item.created_at,
        }));

        return res.json(extrato);
    } catch (error) {
        console.error("Erro listarExtratoMoedas:", error);
        next(error);
    }
}

export async function fazerCheckinDiario(req, res, next) {
    try {
        const usuarioId = req.user?.id;

        if (!usuarioId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        await garantirCarteira(usuarioId);

        const hoje = await obterDataBrasil();

        const { data: loginExistente, error: loginExistenteError } = await supabase
            .from("usuario_logins_diarios")
            .select("id")
            .eq("usuario_id", usuarioId)
            .eq("data_login", hoje)
            .maybeSingle();

        if (loginExistenteError) throw loginExistenteError;

        if (loginExistente) {
            return res.status(400).json({
                error: "Check-in diário já realizado hoje",
            });
        }

        const { error: insertLoginError } = await supabase
            .from("usuario_logins_diarios")
            .insert([
                {
                    usuario_id: usuarioId,
                    data_login: hoje,
                },
            ]);

        if (insertLoginError) throw insertLoginError;

        const { error: ganhoCheckinError } = await supabase.rpc(
            "registrar_movimentacao_moeda",
            {
                p_usuario_id: usuarioId,
                p_tipo: "ganho",
                p_origem: "login_diario",
                p_referencia_id: null,
                p_quantidade: 1,
                p_descricao: "Check-in diário",
            }
        );

        if (ganhoCheckinError) throw ganhoCheckinError;

        const { data: streakAtual, error: streakBuscaError } = await supabase
            .from("usuario_streaks_login")
            .select("usuario_id, sequencia_atual, maior_sequencia, ultimo_login")
            .eq("usuario_id", usuarioId)
            .maybeSingle();

        if (streakBuscaError) throw streakBuscaError;

        const novaSequencia = calcularNovaStreak(
            streakAtual?.ultimo_login || null,
            Number(streakAtual?.sequencia_atual || 0),
            hoje
        );

        const maiorSequencia = Math.max(
            novaSequencia,
            Number(streakAtual?.maior_sequencia || 0)
        );

        const { error: upsertStreakError } = await supabase
            .from("usuario_streaks_login")
            .upsert(
                {
                    usuario_id: usuarioId,
                    sequencia_atual: novaSequencia,
                    maior_sequencia: maiorSequencia,
                    ultimo_login: hoje,
                },
                {
                    onConflict: "usuario_id",
                }
            );

        if (upsertStreakError) throw upsertStreakError;

        let bonusStreak = 0;

        if (novaSequencia > 0 && novaSequencia % 7 === 0) {
            bonusStreak = 10;

            const { error: bonusError } = await supabase.rpc(
                "registrar_movimentacao_moeda",
                {
                    p_usuario_id: usuarioId,
                    p_tipo: "ganho",
                    p_origem: "bonus_streak_7",
                    p_referencia_id: null,
                    p_quantidade: bonusStreak,
                    p_descricao: `Bônus por ${novaSequencia} dias seguidos`,
                }
            );

            if (bonusError) throw bonusError;
        }

        const { data: resumo, error: resumoError } = await supabase
            .from("vw_moeda_resumo_usuario")
            .select("saldo, checkin_hoje")
            .eq("usuario_id", usuarioId)
            .maybeSingle();

        if (resumoError) throw resumoError;

        return res.json({
            ganho: 1,
            bonus_streak: bonusStreak,
            saldo: Number(resumo?.saldo || 0),
            checkin_hoje: Boolean(resumo?.checkin_hoje),
            sequencia_atual: novaSequencia,
            maior_sequencia: maiorSequencia,
        });
    } catch (error) {
        console.error("Erro fazerCheckinDiario:", error);
        next(error);
    }
}

function usuarioLogadoId(req) {
    return req.user?.id || req.usuario?.id || req.auth?.user?.id || null;
}

export async function buscarTiersMoedas(req, res, next) {
    try {
        const userId = usuarioLogadoId(req);

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado." });
        }

        const [
            { data: tiersFotos, error: errorFotos },
            { data: tiersFestas, error: errorFestas },
            { data: tiersDestaque, error: errorDestaque },
            { count: fotosAprovadasCount, error: errorFotosResumo },
            { count: festasRealizadasCount, error: errorFestasResumo },
            { count: destaquesVencidosCount, error: errorDestaquesResumo },
        ] = await Promise.all([
            supabase
                .from("moeda_tiers_fotos")
                .select("id, tier_meta, recompensa, created_at")
                .eq("usuario_id", userId)
                .order("tier_meta", { ascending: true }),

            supabase
                .from("moeda_tiers_festas")
                .select("id, tier_meta, recompensa, created_at")
                .eq("usuario_id", userId)
                .order("tier_meta", { ascending: true }),

            supabase
                .from("moeda_tiers_destaque")
                .select("id, tier_meta, recompensa, created_at")
                .eq("usuario_id", userId)
                .order("tier_meta", { ascending: true }),

            supabase
                .from("fotos_festa_usuario")
                .select("*", { count: "exact", head: true })
                .eq("usuario_id", userId)
                .eq("aprovada_para_coin", true),

            supabase
                .from("festas_usuario")
                .select("*", { count: "exact", head: true })
                .eq("usuario_id", userId)
                .eq("realizada", true)
                .eq("criado_pelo_site", true),

            supabase
                .from("fotos_destaque_mes")
                .select("*", { count: "exact", head: true })
                .eq("usuario_id", userId)
                .eq("status", "vencedora"),
        ]);

        const erros = [
            errorFotos,
            errorFestas,
            errorDestaque,
            errorFotosResumo,
            errorFestasResumo,
            errorDestaquesResumo,
        ].filter(Boolean);

        if (erros.length > 0) {
            return res.status(400).json({
                error: erros[0]?.message || "Não foi possível carregar os tiers.",
            });
        }

        res.json({
            resumo: {
                fotos_aprovadas_para_coin: fotosAprovadasCount || 0,
                festas_realizadas_elegiveis: festasRealizadasCount || 0,
                destaques_vencidos: destaquesVencidosCount || 0,
            },
            tiers_fotos: tiersFotos || [],
            tiers_festas: tiersFestas || [],
            tiers_destaque: tiersDestaque || [],
        });
    } catch (error) {
        next(error);
    }
}