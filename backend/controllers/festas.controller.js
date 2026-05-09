import { supabase } from "../config/supabase.js";
import {
    criarEventoFesta,
    atualizarEventoFesta,
    deletarEventoFesta,
} from "../services/google-calendar.service.js";

const FESTA_SELECT =
    "id, usuario_id, agendamento_id, titulo, data_festa, google_event_id, criado_pelo_site, realizada, status, situacao_imagens, processar_automaticamente, created_at";

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
        .select(FESTA_SELECT)
        .eq("id", id)
        .single();

    return { data, error };
}

async function sincronizarFestaComGoogleCalendar(festa) {
    if (!festa?.id || !festa?.data_festa) {
        return festa;
    }

    // Festas vindas de agendamento já têm evento criado pelo fluxo de agendamento.
    // Aqui sincronizamos apenas festas criadas por orçamento/manual.
    if (festa.agendamento_id) {
        return festa;
    }

    try {
        let googleEvent = null;

        if (festa.google_event_id) {
            googleEvent = await atualizarEventoFesta({
                googleEventId: festa.google_event_id,
                titulo: festa.titulo,
                data_festa: festa.data_festa,
                descricao: `Festa do usuário ${festa.usuario_id}`,
            });

            return {
                ...festa,
                google_event_id: googleEvent?.id || festa.google_event_id,
            };
        }

        googleEvent = await criarEventoFesta({
            titulo: festa.titulo,
            data_festa: festa.data_festa,
            descricao: `Festa do usuário ${festa.usuario_id}`,
        });

        if (!googleEvent?.id) {
            return festa;
        }

        const { data: festaAtualizada, error } = await supabase
            .from("festas_usuario")
            .update({ google_event_id: googleEvent.id })
            .eq("id", festa.id)
            .select(FESTA_SELECT)
            .single();

        if (error) {
            console.error("Erro ao salvar google_event_id na festa:", error);
            return {
                ...festa,
                google_event_id: googleEvent.id,
            };
        }

        return festaAtualizada;
    } catch (error) {
        console.error("Erro ao sincronizar festa com Google Calendar:", error);
        return festa;
    }
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
            status = "agendada",
            situacao_imagens = "bloqueada",
            processar_automaticamente = false,
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
                    status,
                    situacao_imagens,
                    processar_automaticamente,
                },
            ])
            .select(FESTA_SELECT)
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
            .select(FESTA_SELECT)
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
            .select(FESTA_SELECT)
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
            .select(FESTA_SELECT)
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
            "status",
            "situacao_imagens",
            "processar_automaticamente",
        ];

        for (const campo of camposPermitidos) {
            if (campo in req.body) {
                payload[campo] = req.body[campo];
            }
        }

        if ("data_festa" in payload && payload.data_festa) {
            payload.data_festa = String(payload.data_festa).replace("Z", "");
        }

        const { data, error } = await supabase
            .from("festas_usuario")
            .update(payload)
            .eq("id", id)
            .select(FESTA_SELECT)
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        const festaSincronizada = await sincronizarFestaComGoogleCalendar(data);

        const [festaComResumo] = await montarFestasComResumoFotos([festaSincronizada]);

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
            .select("id, usuario_id, google_event_id")
            .eq("id", id)
            .single();

        if (erroBusca || !festaAtual) {
            return res.status(404).json({ error: "Festa não encontrada" });
        }

        const isAdmin = await usuarioEhAdmin(userId);

        if (festaAtual.usuario_id !== userId && !isAdmin) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        if (festaAtual.google_event_id) {
            try {
                await deletarEventoFesta(festaAtual.google_event_id);
            } catch (calendarError) {
                console.error("Erro ao deletar evento da festa no Google Calendar:", calendarError);
            }
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