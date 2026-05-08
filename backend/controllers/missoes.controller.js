import { supabase } from "../config/supabase.js";

function usuarioLogadoId(req) {
    return req.user?.id || req.usuario?.id || req.auth?.user?.id || null;
}

export async function listarMinhasMissoes(req, res, next) {
    try {
        const userId = usuarioLogadoId(req);

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado." });
        }

        const { data, error } = await supabase
            .from("vw_usuario_missoes")
            .select(
                "progresso_id, missao_id, codigo, titulo, descricao, tipo, categoria, meta, recompensa_moedas, progresso_atual, concluida, resgatada, referencia_periodo"
            )
            .eq("usuario_id", userId)
            .order("concluida", { ascending: true })
            .order("resgatada", { ascending: true });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        const missoesFormatadas = (data || []).map((item) => ({
            id: item.missao_id,
            progresso_id: item.progresso_id,
            codigo: item.codigo,
            titulo: item.titulo,
            descricao: item.descricao,
            tipo: item.tipo,
            categoria: item.categoria,
            meta: item.meta,
            recompensa_moedas: item.recompensa_moedas,
            progresso_atual: item.progresso_atual || 0,
            concluida: Boolean(item.concluida),
            resgatada: Boolean(item.resgatada),
            referencia_periodo: item.referencia_periodo,
        }));

        res.json(missoesFormatadas);
    } catch (error) {
        next(error);
    }
}

export async function resgatarMissao(req, res, next) {
    try {
        const userId = usuarioLogadoId(req);
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado." });
        }

        const { data: progresso, error: progressoError } = await supabase
            .from("usuario_missoes_progresso")
            .select(
                "id, usuario_id, missao_id, concluida, resgatada, referencia_periodo"
            )
            .eq("usuario_id", userId)
            .eq("missao_id", id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (progressoError) {
            return res.status(400).json({ error: progressoError.message });
        }

        if (!progresso) {
            return res.status(404).json({ error: "Missão não encontrada para este usuário." });
        }

        if (!progresso.concluida) {
            return res.status(400).json({ error: "Essa missão ainda não foi concluída." });
        }

        if (progresso.resgatada) {
            return res.status(400).json({ error: "Essa missão já foi resgatada." });
        }

        const { data: missao, error: missaoError } = await supabase
            .from("missoes")
            .select("id, titulo, recompensa_moedas")
            .eq("id", id)
            .single();

        if (missaoError || !missao) {
            return res.status(404).json({ error: "Missão não encontrada." });
        }

        const recompensa = Number(missao.recompensa_moedas || 0);

        const { error: updateError } = await supabase
            .from("usuario_missoes_progresso")
            .update({
                resgatada: true,
                resgatada_em: new Date().toISOString(),
            })
            .eq("id", progresso.id);

        if (updateError) {
            return res.status(400).json({ error: updateError.message });
        }

        const { error: resgateError } = await supabase
            .from("usuario_missoes_resgates")
            .insert([
                {
                    usuario_id: userId,
                    missao_id: id,
                    progresso_id: progresso.id,
                    recompensa_moedas: recompensa,
                },
            ]);

        if (resgateError) {
            return res.status(400).json({ error: resgateError.message });
        }

        if (recompensa > 0) {
            const { error: moedaError } = await supabase.rpc(
                "registrar_movimentacao_moeda",
                {
                    p_usuario_id: userId,
                    p_tipo: "ganho",
                    p_origem: "missao_resgatada",
                    p_referencia_id: id,
                    p_quantidade: recompensa,
                    p_descricao: `Resgate da missão: ${missao.titulo}`,
                }
            );

            if (moedaError) {
                return res.status(400).json({ error: moedaError.message });
            }
        }

        res.json({
            message: "Missão resgatada com sucesso.",
            recompensa,
        });
    } catch (error) {
        next(error);
    }
}