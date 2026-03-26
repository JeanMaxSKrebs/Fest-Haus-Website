import { supabase } from "../config/supabase.js";

const BUCKET_FESTAS = "festas-usuarios";

async function montarFotoComUrl(foto) {
    if (!foto?.storage_path) {
        return {
            ...foto,
            url: null,
        };
    }

    const { data } = await supabase.storage
        .from(BUCKET_FESTAS)
        .createSignedUrl(foto.storage_path, 60 * 60);

    return {
        ...foto,
        url: data?.signedUrl || null,
    };
}

async function montarFotosComUrl(fotos = []) {
    return Promise.all((fotos || []).map(montarFotoComUrl));
}

export async function listarImagensDaFestaAdmin(req, res, next) {
    try {
        const { id } = req.params;

        const { data: festa, error: festaError } = await supabase
            .from("festas_usuario")
            .select("id, titulo, data_festa")
            .eq("id", id)
            .single();

        if (festaError || !festa) {
            return res.status(404).json({ error: "Festa não encontrada" });
        }

        const { data, error } = await supabase
            .from("fotos_festa_usuario")
            .select(
                "id, festa_id, storage_path, status, aprovada_para_coin, destaque_habilitado, created_at, approved_at, aprovada_para_galeria"
            )
            .eq("festa_id", id)
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        const fotosComUrl = await montarFotosComUrl(data || []);
        res.json(fotosComUrl);
    } catch (error) {
        next(error);
    }
}

export async function aprovarFotoParaGaleria(req, res, next) {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("fotos_festa_usuario")
            .update({
                aprovada_para_galeria: true,
            })
            .eq("id", id)
            .select(
                "id, festa_id, storage_path, status, aprovada_para_coin, destaque_habilitado, created_at, approved_at, aprovada_para_galeria"
            )
            .single();

        if (error || !data) {
            return res.status(404).json({ error: "Foto não encontrada" });
        }

        const fotoComUrl = await montarFotoComUrl(data);
        res.json(fotoComUrl);
    } catch (error) {
        next(error);
    }
}

export async function rejeitarFotoParaGaleria(req, res, next) {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("fotos_festa_usuario")
            .update({
                aprovada_para_galeria: false,
            })
            .eq("id", id)
            .select(
                "id, festa_id, storage_path, status, aprovada_para_coin, destaque_habilitado, created_at, approved_at, aprovada_para_galeria"
            )
            .single();

        if (error || !data) {
            return res.status(404).json({ error: "Foto não encontrada" });
        }

        const fotoComUrl = await montarFotoComUrl(data);
        res.json(fotoComUrl);
    } catch (error) {
        next(error);
    }
}