import { processarFestasAutomaticamente } from "../controllers/festas-admin.controller.js";

let intervaloFestas = null;

export function iniciarJobFestas() {
    if (intervaloFestas) return;

    async function executar() {
        try {
            const resultado = await processarFestasAutomaticamente();

            if (resultado?.total_processadas) {
                console.log(
                    `[festas.job] ${resultado.total_processadas} festa(s) processada(s) automaticamente`
                );
            }
        } catch (error) {
            console.error("[festas.job] Erro ao processar festas:", error);
        }
    }

    executar();

    intervaloFestas = setInterval(executar, 1000 * 60 * 60 * 12);
}