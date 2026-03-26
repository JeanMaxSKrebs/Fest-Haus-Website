import { supabase } from "../config/supabase.js";

export const FESTA_SELECT =
    "id, usuario_id, agendamento_id, titulo, data_festa, criado_pelo_site, realizada, status, situacao_imagens, realizada_em, notificacao_realizada_enviada, notificacao_imagens_enviada, processar_automaticamente, created_at";

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
        .select(FESTA_SELECT)
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
            notificacao_realizada_enviada: true,
        })
        .eq("id", id)
        .select(FESTA_SELECT)
        .single();
}

export async function atualizarFestaParaAgendadaService(id) {
    return supabase
        .from("festas_usuario")
        .update({
            realizada: false,
            status: "agendada",
            situacao_imagens: "bloqueada",
            realizada_em: null,
            notificacao_realizada_enviada: false,
            notificacao_imagens_enviada: false,
        })
        .eq("id", id)
        .select(FESTA_SELECT)
        .single();
}

export async function atualizarProcessamentoAutomaticoService(
    id,
    processar_automaticamente
) {
    return supabase
        .from("festas_usuario")
        .update({
            processar_automaticamente,
        })
        .eq("id", id)
        .select(FESTA_SELECT)
        .single();
}

export async function buscarFestasAutomaticasParaProcessamentoService() {
    return supabase
        .from("festas_usuario")
        .select(FESTA_SELECT)
        .eq("processar_automaticamente", true)
        .in("status", ["agendada", "festa_realizada"]);
}

export async function atualizarSituacaoImagensParaAguardandoService(id) {
    return supabase
        .from("festas_usuario")
        .update({
            situacao_imagens: "aguardando_imagens",
            notificacao_imagens_enviada: true,
        })
        .eq("id", id)
        .select(FESTA_SELECT)
        .single();
}

export async function atualizarSituacaoImagensService(id, situacao_imagens) {
    return supabase
        .from("festas_usuario")
        .update({
            situacao_imagens,
        })
        .eq("id", id)
        .select(FESTA_SELECT)
        .single();
}

export async function atualizarProcessamentoAutomaticoGlobalService(
    processar_automaticamente
) {
    return supabase
        .from("festas_usuario")
        .update({
            processar_automaticamente,
        })
        .neq("id", "00000000-0000-0000-0000-000000000000");
}

