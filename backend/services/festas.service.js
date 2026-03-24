import { supabase } from "../config/supabase.js";

export const FESTA_SELECT =
    "id, usuario_id, agendamento_id, titulo, data_festa, criado_pelo_site, realizada, status, realizada_em, notificacao_imagens_enviada, created_at";

export async function listarFestasAdminService() {
    return supabase
        .from("festas_usuario")
        .select(FESTA_SELECT)
        .order("data_festa", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
}

export async function buscarFestaPorIdService(id) {
    return supabase
        .from("festas_usuario")
        .select(
            "id, usuario_id, titulo, data_festa, status, realizada, realizada_em"
        )
        .eq("id", id)
        .single();
}

export async function atualizarFestaParaRealizadaService(id, realizada_em) {
    return supabase
        .from("festas_usuario")
        .update({
            realizada: true,
            status: "festa_realizada",
            realizada_em,
        })
        .eq("id", id)
        .select(FESTA_SELECT)
        .single();
}

export async function buscarFestasParaAguardarImagensService() {
    return supabase
        .from("festas_usuario")
        .select(
            "id, usuario_id, titulo, data_festa, status, realizada, realizada_em, notificacao_imagens_enviada"
        )
        .eq("status", "festa_realizada")
        .eq("notificacao_imagens_enviada", false);
}

export async function atualizarFestaParaAguardandoImagensService(id) {
    return supabase
        .from("festas_usuario")
        .update({
            status: "aguardando_imagens",
            notificacao_imagens_enviada: true,
        })
        .eq("id", id);
}