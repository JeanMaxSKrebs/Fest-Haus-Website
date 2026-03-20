import { supabase } from "../config/supabase.js";

function obterNomeFallback(user, email) {
    return (
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        (email ? String(email).split("@")[0] : "") ||
        "Usuário"
    );
}

export async function buscarMeuPerfil(req, res, next) {
    try {
        const usuarioId = req.user?.id;
        const email = req.user?.email;

        if (!usuarioId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const nomeFallback = obterNomeFallback(req.user, email);

        const { data, error } = await supabase
            .from("usuarios")
            .select("id, nome, email, telefone, created_at")
            .eq("id", usuarioId)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.json({
                id: usuarioId,
                nome: nomeFallback,
                email: email || "",
                telefone: "",
                created_at: null,
            });
        }

        return res.json({
            id: data.id,
            nome: data.nome || nomeFallback,
            email: data.email || email || "",
            telefone: data.telefone || "",
            created_at: data.created_at || null,
        });
    } catch (error) {
        console.error("Erro buscarMeuPerfil:", error);
        next(error);
    }
}

export async function atualizarMeuPerfil(req, res, next) {
    try {
        const usuarioId = req.user?.id;
        const email = req.user?.email;

        if (!usuarioId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const nomeFallback = obterNomeFallback(req.user, email);
        const { nome, telefone } = req.body;

        const nomeFinal = String(nome || "").trim() || nomeFallback;
        const telefoneFinal = String(telefone || "").trim();

        if (!nomeFinal) {
            return res.status(400).json({ error: "Nome é obrigatório" });
        }

        const payload = {
            id: usuarioId,
            nome: nomeFinal,
            email: email || null,
            telefone: telefoneFinal || null,
        };

        const { data, error } = await supabase
            .from("usuarios")
            .upsert(payload, { onConflict: "id" })
            .select("id, nome, email, telefone, created_at")
            .single();

        if (error) throw error;

        return res.json({
            id: data.id,
            nome: data.nome || nomeFinal,
            email: data.email || email || "",
            telefone: data.telefone || "",
            created_at: data.created_at || null,
        });
    } catch (error) {
        console.error("Erro atualizarMeuPerfil:", error);
        next(error);
    }
}