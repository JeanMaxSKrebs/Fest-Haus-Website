import { supabase } from "../config/supabase.js";
import { processarImagemUpload } from "../utils/processar-imagem-upload.js";

const BUCKET_FESTAS = "festas-usuarios";

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

async function buscarFestaPorId(festaId) {
    const { data, error } = await supabase
        .from("festas_usuario")
        .select(
            "id, usuario_id, titulo, data_festa, realizada, status, situacao_imagens"
        )
        .eq("id", festaId)
        .single();

    return { data, error };
}

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

export async function uploadFotoFesta(req, res, next) {
    try {
        const userId = usuarioLogadoId(req);
        const { festa_id } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        if (!festa_id) {
            return res.status(400).json({ error: "festa_id é obrigatório" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Arquivo da foto é obrigatório" });
        }

        const { data: festa, error: festaError } = await buscarFestaPorId(festa_id);

        if (festaError || !festa) {
            return res.status(404).json({ error: "Festa não encontrada" });
        }

        if (festa.usuario_id !== userId) {
            return res
                .status(403)
                .json({ error: "Você não pode enviar foto para esta festa" });
        }

        if (festa.situacao_imagens !== "aguardando_imagens") {
            return res.status(400).json({
                error:
                    "O envio de imagens ainda não está liberado para esta festa.",
            });
        }

        const arquivoProcessado = await processarImagemUpload(req.file);

        const storagePath = `${festa_id}/${arquivoProcessado.fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_FESTAS)
            .upload(storagePath, arquivoProcessado.buffer, {
                contentType: arquivoProcessado.contentType,
                upsert: false,
            });

        if (uploadError) {
            return res.status(400).json({ error: uploadError.message });
        }

        const { data, error } = await supabase
            .from("fotos_festa_usuario")
            .insert([
                {
                    usuario_id: userId,
                    festa_id,
                    storage_path: storagePath,
                    status: "pendente",
                    aprovada_para_coin: false,
                    destaque_habilitado: false,
                },
            ])
            .select(
                "id, usuario_id, festa_id, storage_path, status, aprovada_para_coin, destaque_habilitado, created_at, approved_at"
            )
            .single();

        if (error) {
            await supabase.storage.from(BUCKET_FESTAS).remove([storagePath]);
            return res.status(400).json({ error: error.message });
        }

        const fotoComUrl = await montarFotoComUrl(data);

        res.status(201).json(fotoComUrl);
    } catch (error) {
        next(error);
    }
}

export async function listarFotosDaFesta(req, res, next) {
    try {
        const userId = usuarioLogadoId(req);
        const { festa_id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const { data: festa, error: festaError } = await buscarFestaPorId(festa_id);

        if (festaError || !festa) {
            return res.status(404).json({ error: "Festa não encontrada" });
        }

        const isAdmin = await usuarioEhAdmin(userId);

        if (festa.usuario_id !== userId && !isAdmin) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const { data, error } = await supabase
            .from("fotos_festa_usuario")
            .select(
                "id, usuario_id, festa_id, storage_path, status, aprovada_para_coin, destaque_habilitado, created_at, approved_at, aprovada_para_galeria"
            )
            .eq("festa_id", festa_id)
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

export async function listarMinhasFotosFesta(req, res, next) {
    try {
        const userId = usuarioLogadoId(req);

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const { data, error } = await supabase
            .from("fotos_festa_usuario")
            .select(
                "id, usuario_id, festa_id, storage_path, status, aprovada_para_coin, destaque_habilitado, created_at, approved_at, aprovada_para_galeria"
            )
            .eq("usuario_id", userId)
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

export async function aprovarFotoFesta(req, res, next) {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("fotos_festa_usuario")
            .update({
                status: "aprovada",
                approved_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select(
                "id, usuario_id, festa_id, storage_path, status, aprovada_para_coin, destaque_habilitado, created_at, approved_at, aprovada_para_galeria"
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

export async function rejeitarFotoFesta(req, res, next) {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("fotos_festa_usuario")
            .update({
                status: "rejeitada",
                aprovada_para_coin: false,
                destaque_habilitado: false,
                approved_at: null,
            })
            .eq("id", id)
            .select(
                "id, usuario_id, festa_id, storage_path, status, aprovada_para_coin, destaque_habilitado, created_at, approved_at, aprovada_para_galeria"
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

export async function habilitarFotoParaCoin(req, res, next) {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("fotos_festa_usuario")
            .update({
                aprovada_para_coin: true,
            })
            .eq("id", id)
            .select(
                "id, usuario_id, festa_id, storage_path, status, aprovada_para_coin, destaque_habilitado, created_at, approved_at, aprovada_para_galeria"
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

export async function enviarFotosParaDestaque(req, res, next) {
    try {
        const userId = usuarioLogadoId(req);
        const { festa_id, fotos_ids } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        if (!festa_id || !Array.isArray(fotos_ids) || fotos_ids.length === 0) {
            return res.status(400).json({
                error: "festa_id e fotos_ids são obrigatórios.",
            });
        }

        if (fotos_ids.length > 3) {
            return res.status(400).json({
                error: "Você pode selecionar no máximo 3 fotos para destaque.",
            });
        }

        const { data: festa, error: festaError } = await buscarFestaPorId(festa_id);

        if (festaError || !festa) {
            return res.status(404).json({ error: "Festa não encontrada" });
        }

        if (festa.usuario_id !== userId) {
            return res.status(403).json({ error: "Acesso negado." });
        }

        if (festa.situacao_imagens !== "aguardando_imagens") {
            return res.status(400).json({
                error: "O destaque só pode ser enviado quando a festa estiver aguardando imagens.",
            });
        }

        const { data: fotos, error: fotosError } = await supabase
            .from("fotos_festa_usuario")
            .select("id, usuario_id, festa_id")
            .in("id", fotos_ids)
            .eq("festa_id", festa_id)
            .eq("usuario_id", userId);

        if (fotosError) {
            return res.status(400).json({ error: fotosError.message });
        }

        if (!fotos || fotos.length !== fotos_ids.length) {
            return res.status(400).json({
                error: "Uma ou mais fotos informadas não pertencem a esta festa.",
            });
        }

        const { error } = await supabase
            .from("fotos_festa_usuario")
            .update({
                destaque_habilitado: true,
                status: "concorrendo_destaque",
            })
            .in("id", fotos_ids);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({
            message: "Fotos enviadas para destaque com sucesso.",
        });
    } catch (error) {
        next(error);
    }
}

export async function deletarFotoFesta(req, res, next) {
    try {
        const userId = usuarioLogadoId(req);
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const { data: foto, error: fotoError } = await supabase
            .from("fotos_festa_usuario")
            .select(
                "id, usuario_id, festa_id, storage_path, status, aprovada_para_coin, destaque_habilitado, created_at, approved_at, aprovada_para_galeria"
            )
            .eq("id", id)
            .single();

        if (fotoError || !foto) {
            return res.status(404).json({ error: "Foto não encontrada" });
        }

        const isAdmin = await usuarioEhAdmin(userId);

        if (foto.usuario_id !== userId && !isAdmin) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const { error: storageError } = await supabase.storage
            .from(BUCKET_FESTAS)
            .remove([foto.storage_path]);

        if (storageError) {
            return res.status(400).json({ error: storageError.message });
        }

        const { error } = await supabase
            .from("fotos_festa_usuario")
            .delete()
            .eq("id", id);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: "Foto deletada com sucesso" });
    } catch (error) {
        next(error);
    }
}