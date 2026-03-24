import { supabase } from "../config/supabase.js";

const BUCKET_FESTAS = "festas-usuarios";

function usuarioLogadoId(req) {
    return req.user?.id || req.usuario?.id || req.auth?.user?.id || null;
}

function nomeArquivoSeguro(nome = "foto") {
    return String(nome)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9._-]/g, "")
        .toLowerCase();
}

function extensaoPorMime(mimetype = "") {
    const mapa = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/heic": "heic",
        "image/heif": "heif",
        "application/octet-stream": "jpg",
    };

    return mapa[mimetype] || "jpg";
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
        .select("id, usuario_id, titulo, data_festa, realizada")
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
            return res.status(403).json({ error: "Você não pode enviar foto para esta festa" });
        }

        const ext = extensaoPorMime(req.file.mimetype);
        const nomeBase = nomeArquivoSeguro(
            req.file.originalname?.replace(/\.[^/.]+$/, "") || "foto"
        );
        const nomeFinal = `${Date.now()}-${nomeBase}.${ext}`;
        const storagePath = `usuarios/${userId}/festas/${festa_id}/${nomeFinal}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_FESTAS)
            .upload(storagePath, req.file.buffer, {
                contentType: req.file.mimetype,
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
                "id, usuario_id, festa_id, storage_path, status, aprovada_para_coin, destaque_habilitado, created_at, approved_at"
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
                "id, usuario_id, festa_id, storage_path, status, aprovada_para_coin, destaque_habilitado, created_at, approved_at"
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
                "id, usuario_id, festa_id, storage_path, status, aprovada_para_coin, destaque_habilitado, created_at, approved_at"
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
                "id, usuario_id, festa_id, storage_path, status, aprovada_para_coin, destaque_habilitado, created_at, approved_at"
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
                "id, usuario_id, festa_id, storage_path, status, aprovada_para_coin, destaque_habilitado, created_at, approved_at"
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
                "id, usuario_id, festa_id, storage_path, status, aprovada_para_coin, destaque_habilitado, created_at, approved_at"
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