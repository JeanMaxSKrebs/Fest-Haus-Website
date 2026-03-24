import { supabase } from "../config/supabase.js";

export async function criarNotificacao({
    usuario_id,
    tipo,
    titulo,
    mensagem,
    link = null,
    referencia_id = null,
}) {
    const { data, error } = await supabase
        .from("notificacoes_usuario")
        .insert([
            {
                usuario_id,
                tipo,
                titulo,
                mensagem,
                link,
                referencia_id,
            },
        ])
        .select("*")
        .single();

    if (error) {
        throw error;
    }

    return data;
}