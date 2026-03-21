import cron from "node-cron";
import { supabase } from "../config/supabase.js";

export function iniciarJobLimpezaUsuarios() {
    cron.schedule("0 3 * * *", async () => {
        try {
            console.log("[CRON] Iniciando limpeza...");

            // 1. Buscar usuários que serão excluídos
            const { data: usuarios, error: selectError } = await supabase
                .from("usuarios")
                .select("id, email")
                .eq("status_conta", "pendente_exclusao")
                .lte(
                    "excluido_em",
                    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
                );

            if (selectError) {
                console.error("Erro ao buscar usuários:", selectError);
                return;
            }

            if (!usuarios || usuarios.length === 0) {
                console.log("[CRON] Nenhum usuário para excluir.");
                return;
            }

            console.log(`[CRON] ${usuarios.length} usuários encontrados.`);

            // 2. Rodar tua limpeza SQL (remove dados do banco)
            const { error: rpcError } = await supabase.rpc(
                "limpar_usuarios_excluidos"
            );

            if (rpcError) {
                console.error("Erro na RPC:", rpcError);
                return;
            }

            // 3. Deletar do auth
            for (const usuario of usuarios) {
                try {
                    const { error } = await supabase.auth.admin.deleteUser(usuario.id);

                    if (error) throw error;

                    console.log(
                        "[CRON] Usuário deletado do auth:",
                        usuario.id,
                        usuario.email
                    );
                } catch (err) {
                    console.error(
                        "[CRON] Erro ao deletar usuário:",
                        usuario.id,
                        err.message
                    );
                }
            }

            console.log("[CRON] Limpeza completa finalizada.");
        } catch (error) {
            console.error("Erro inesperado no job:", error);
        }
    });
}