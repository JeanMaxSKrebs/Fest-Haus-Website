import { supabase } from "../config/supabase.js";

function usuarioLogadoId(req) {
    return req.user?.id || req.usuario?.id || req.auth?.user?.id || null;
}

export async function listarMinhasNotificacoes(req, res, next) {
    try {
        const userId = usuarioLogadoId(req);

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const { data, error } = await supabase
            .from("notificacoes_usuario")
            .select("id, usuario_id, tipo, titulo, mensagem, link, lida, referencia_id, created_at")
            .eq("usuario_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data || []);
    } catch (error) {
        next(error);
    }
}

export async function contarMinhasNotificacoesNaoLidas(req, res, next) {
    try {
        const userId = usuarioLogadoId(req);

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const { count, error } = await supabase
            .from("notificacoes_usuario")
            .select("*", { count: "exact", head: true })
            .eq("usuario_id", userId)
            .eq("lida", false);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({
            nao_lidas: count || 0,
        });
    } catch (error) {
        next(error);
    }
}

export async function marcarNotificacaoComoLida(req, res, next) {
    try {
        const userId = usuarioLogadoId(req);
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const { data: notificacao, error: buscaError } = await supabase
            .from("notificacoes_usuario")
            .select("id, usuario_id, lida")
            .eq("id", id)
            .single();

        if (buscaError || !notificacao) {
            return res.status(404).json({ error: "Notificação não encontrada" });
        }

        if (notificacao.usuario_id !== userId) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const { data, error } = await supabase
            .from("notificacoes_usuario")
            .update({ lida: true })
            .eq("id", id)
            .select("id, usuario_id, tipo, titulo, mensagem, link, lida, referencia_id, created_at")
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        next(error);
    }
}

export async function marcarTodasNotificacoesComoLidas(req, res, next) {
    try {
        const userId = usuarioLogadoId(req);

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const { error } = await supabase
            .from("notificacoes_usuario")
            .update({ lida: true })
            .eq("usuario_id", userId)
            .eq("lida", false);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: "Todas as notificações foram marcadas como lidas" });
    } catch (error) {
        next(error);
    }
}

export async function deletarNotificacao(req, res, next) {
    try {
        const userId = usuarioLogadoId(req);
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const { data: notificacao, error: buscaError } = await supabase
            .from("notificacoes_usuario")
            .select("id, usuario_id")
            .eq("id", id)
            .single();

        if (buscaError || !notificacao) {
            return res.status(404).json({ error: "Notificação não encontrada" });
        }

        if (notificacao.usuario_id !== userId) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const { error } = await supabase
            .from("notificacoes_usuario")
            .delete()
            .eq("id", id);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: "Notificação deletada com sucesso" });
    } catch (error) {
        next(error);
    }
}