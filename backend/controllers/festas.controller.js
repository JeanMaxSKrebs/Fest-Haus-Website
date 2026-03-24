import { supabase } from "../config/supabase.js";

function usuarioLogadoId(req) {
    return req.user?.id || req.usuario?.id || req.auth?.user?.id || null;
}

async function usuarioEhAdmin(userId) {
    if (!userId) return false;

    const { data, error } = await supabase
        .from("usuarios")
        .select("is_admin")
        .eq("id", userId)
        .single();

    if (error) return false;

    return Boolean(data?.is_admin);
}

async function buscarFestaBase(id) {
    const { data, error } = await supabase
        .from("festas_usuario")
        .select("id, usuario_id, agendamento_id, titulo, data_festa, criado_pelo_site, realizada, created_at")
        .eq("id", id)
        .single();

    return { data, error };
}

async function montarFestasComResumoFotos(festas) {
    if (!Array.isArray(festas) || festas.length === 0) {
        return [];
    }

    const festaIds = festas.map((festa) => festa.id);

    const { data: fotos, error } = await supabase
        .from("fotos_festa_usuario")
        .select("id, festa_id, status, aprovada_para_coin, destaque_habilitado")
        .in("festa_id", festaIds);

    if (error || !Array.isArray(fotos)) {
        return festas.map((festa) => ({
            ...festa,
            total_fotos: 0,
            fotos_aprovadas: 0,
            fotos_pendentes: 0,
            fotos_para_coin: 0,
        }));
    }

    const resumoPorFesta = {};

    for (const foto of fotos) {
        if (!resumoPorFesta[foto.festa_id]) {
            resumoPorFesta[foto.festa_id] = {
                total_fotos: 0,
                fotos_aprovadas: 0,
                fotos_pendentes: 0,
                fotos_para_coin: 0,
            };
        }

        resumoPorFesta[foto.festa_id].total_fotos += 1;

        if (foto.status === "aprovada" || foto.status === "destaque_mes") {
            resumoPorFesta[foto.festa_id].fotos_aprovadas += 1;
        }

        if (foto.status === "pendente") {
            resumoPorFesta[foto.festa_id].fotos_pendentes += 1;
        }

        if (foto.aprovada_para_coin) {
            resumoPorFesta[foto.festa_id].fotos_para_coin += 1;
        }
    }

    return festas.map((festa) => ({
        ...festa,
        ...(resumoPorFesta[festa.id] || {
            total_fotos: 0,
            fotos_aprovadas: 0,
            fotos_pendentes: 0,
            fotos_para_coin: 0,
        }),
    }));
}

export async function criarFesta(req, res, next) {
    try {
        const userId = usuarioLogadoId(req);

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const {
            agendamento_id = null,
            titulo = null,
            data_festa = null,
            criado_pelo_site = true,
            realizada = false,
        } = req.body;

        const { data, error } = await supabase
            .from("festas_usuario")
            .insert([
                {
                    usuario_id: userId,
                    agendamento_id,
                    titulo,
                    data_festa,
                    criado_pelo_site,
                    realizada,
                },
            ])
            .select("id, usuario_id, agendamento_id, titulo, data_festa, criado_pelo_site, realizada, created_at")
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({
            ...data,
            total_fotos: 0,
            fotos_aprovadas: 0,
            fotos_pendentes: 0,
            fotos_para_coin: 0,
        });
    } catch (error) {
        next(error);
    }
}

export async function listarMinhasFestas(req, res, next) {
    try {
        const userId = usuarioLogadoId(req);

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const { data, error } = await supabase
            .from("festas_usuario")
            .select("id, usuario_id, agendamento_id, titulo, data_festa, criado_pelo_site, realizada, created_at")
            .eq("usuario_id", userId)
            .order("data_festa", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        const festasComResumo = await montarFestasComResumoFotos(data || []);

        res.json(festasComResumo);
    } catch (error) {
        next(error);
    }
}

export async function listarFestasPorUsuario(req, res, next) {
    try {
        const { usuario_id } = req.params;

        if (!usuario_id) {
            return res.status(400).json({ error: "usuario_id é obrigatório" });
        }

        const { data, error } = await supabase
            .from("festas_usuario")
            .select("id, usuario_id, agendamento_id, titulo, data_festa, criado_pelo_site, realizada, created_at")
            .eq("usuario_id", usuario_id)
            .order("data_festa", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        const festasComResumo = await montarFestasComResumoFotos(data || []);

        res.json(festasComResumo);
    } catch (error) {
        next(error);
    }
}

export async function listarTodasFestas(req, res, next) {
    try {
        const { data, error } = await supabase
            .from("festas_usuario")
            .select("id, usuario_id, agendamento_id, titulo, data_festa, criado_pelo_site, realizada, created_at")
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        const festasComResumo = await montarFestasComResumoFotos(data || []);

        res.json(festasComResumo);
    } catch (error) {
        next(error);
    }
}

export async function buscarFestaPorId(req, res, next) {
    try {
        const { id } = req.params;
        const userId = usuarioLogadoId(req);

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const { data, error } = await buscarFestaBase(id);

        if (error || !data) {
            return res.status(404).json({ error: "Festa não encontrada" });
        }

        const isAdmin = await usuarioEhAdmin(userId);

        if (data.usuario_id !== userId && !isAdmin) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const [festaComResumo] = await montarFestasComResumoFotos([data]);

        res.json(festaComResumo);
    } catch (error) {
        next(error);
    }
}

export async function atualizarFesta(req, res, next) {
    try {
        const { id } = req.params;
        const userId = usuarioLogadoId(req);

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const { data: festaAtual, error: erroBusca } = await supabase
            .from("festas_usuario")
            .select("id, usuario_id")
            .eq("id", id)
            .single();

        if (erroBusca || !festaAtual) {
            return res.status(404).json({ error: "Festa não encontrada" });
        }

        const isAdmin = await usuarioEhAdmin(userId);

        if (festaAtual.usuario_id !== userId && !isAdmin) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const payload = {};
        const camposPermitidos = [
            "agendamento_id",
            "titulo",
            "data_festa",
            "criado_pelo_site",
            "realizada",
        ];

        for (const campo of camposPermitidos) {
            if (campo in req.body) {
                payload[campo] = req.body[campo];
            }
        }

        const { data, error } = await supabase
            .from("festas_usuario")
            .update(payload)
            .eq("id", id)
            .select("id, usuario_id, agendamento_id, titulo, data_festa, criado_pelo_site, realizada, created_at")
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        const [festaComResumo] = await montarFestasComResumoFotos([data]);

        res.json(festaComResumo);
    } catch (error) {
        next(error);
    }
}

export async function deletarFesta(req, res, next) {
    try {
        const { id } = req.params;
        const userId = usuarioLogadoId(req);

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const { data: festaAtual, error: erroBusca } = await supabase
            .from("festas_usuario")
            .select("id, usuario_id")
            .eq("id", id)
            .single();

        if (erroBusca || !festaAtual) {
            return res.status(404).json({ error: "Festa não encontrada" });
        }

        const isAdmin = await usuarioEhAdmin(userId);

        if (festaAtual.usuario_id !== userId && !isAdmin) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const { error } = await supabase
            .from("festas_usuario")
            .delete()
            .eq("id", id);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: "Festa deletada com sucesso" });
    } catch (error) {
        next(error);
    }
}