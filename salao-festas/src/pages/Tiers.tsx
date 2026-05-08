import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import FestCoin from "../components/coin/FestCoin";

type TierRegistro = {
    id: string;
    tier_meta: number;
    recompensa: number;
    created_at: string;
};

type TiersResumo = {
    fotos_aprovadas_para_coin: number;
    festas_realizadas_elegiveis: number;
    destaques_vencidos: number;
};

type TiersData = {
    resumo: TiersResumo;
    tiers_fotos: TierRegistro[];
    tiers_festas: TierRegistro[];
    tiers_destaque: TierRegistro[];
};

const METAS_FOTOS = [10, 20, 40, 50, 75, 100, 200];
const METAS_FESTAS = [1, 2, 4, 6, 8, 10];
const METAS_DESTAQUE = [1, 2, 5, 10, 20, 30];

export default function Tiers() {
    const [dados, setDados] = useState<TiersData>({
        resumo: {
            fotos_aprovadas_para_coin: 0,
            festas_realizadas_elegiveis: 0,
            destaques_vencidos: 0,
        },
        tiers_fotos: [],
        tiers_festas: [],
        tiers_destaque: [],
    });

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        carregarTiers();
    }, []);

    async function carregarTiers() {
        setCarregando(true);
        setErro("");

        try {
            const data = await apiFetch("/api/moedas/tiers");

            setDados({
                resumo: {
                    fotos_aprovadas_para_coin:
                        data?.resumo?.fotos_aprovadas_para_coin ?? 0,
                    festas_realizadas_elegiveis:
                        data?.resumo?.festas_realizadas_elegiveis ?? 0,
                    destaques_vencidos: data?.resumo?.destaques_vencidos ?? 0,
                },
                tiers_fotos: Array.isArray(data?.tiers_fotos) ? data.tiers_fotos : [],
                tiers_festas: Array.isArray(data?.tiers_festas) ? data.tiers_festas : [],
                tiers_destaque: Array.isArray(data?.tiers_destaque)
                    ? data.tiers_destaque
                    : [],
            });
        } catch (error: any) {
            console.error("Erro carregarTiers:", error);
            setErro(error?.message || "Não foi possível carregar seus tiers.");
        } finally {
            setCarregando(false);
        }
    }

    async function resgatarTier(tipo: "fotos" | "festas" | "destaque", meta: number) {
        try {
            await apiFetch(`/api/moedas/tiers/resgatar`, {
                method: "POST",
                body: JSON.stringify({ tipo, meta }),
            });

            carregarTiers(); // recarrega tudo
        } catch (error: any) {
            console.error("Erro resgatarTier:", error);
            setErro(error?.message || "Não foi possível resgatar seu tier.");
        } finally {
            setCarregando(false);
        }
    }
    
    const resumo = useMemo(() => {
        return {
            tiersFotosConcluidos: dados.tiers_fotos.length,
            tiersFestasConcluidos: dados.tiers_festas.length,
            tiersDestaqueConcluidos: dados.tiers_destaque.length,
        };
    }, [dados]);

    function getProximoTier(metas: number[], progressoAtual: number) {
        return metas.find((meta) => progressoAtual < meta) ?? null;
    }

    function getUltimoTierConcluido(metas: number[], progressoAtual: number) {
        return [...metas].reverse().find((meta) => progressoAtual >= meta) ?? null;
    }

    function percentualParaProximo(metas: number[], progressoAtual: number) {
        const proximo = getProximoTier(metas, progressoAtual);
        if (!proximo) return 100;
        return Math.min(100, Math.round((progressoAtual / proximo) * 100));
    }

    function concluido(lista: TierRegistro[], meta: number) {
        return lista.some((tier) => tier.tier_meta === meta);
    }

    function getRecompensas(metas: number[]) {
        if (metas.length === 7) return [10, 10, 20, 20, 30, 50, 50];
        if (metas.length === 6) return [10, 20, 20, 30, 50, 50];
        return metas.map(() => 10);
    }

    function renderProgressao(
        titulo: string,
        descricao: string,
        descricaoRecompensa: string,
        metas: number[],
        concluidos: TierRegistro[],
        progressoAtual: number
    ) {
        const recompensas = getRecompensas(metas);
        const proximo = getProximoTier(metas, progressoAtual);
        const ultimo = getUltimoTierConcluido(metas, progressoAtual);
        const percentual = percentualParaProximo(metas, progressoAtual);

        return (
            <div className="tiers-page-block">
                <div className="tiers-page-block-header">
                    <h3>{titulo}</h3>
                    <p>{descricao}</p>
                </div>

                <p className="tiers-page-block-reward-description">
                    {descricaoRecompensa}
                </p>

                <div className="tiers-page-highlight">
                    <div className="tiers-page-highlight-top">
                        <div>
                            <span className="tiers-page-highlight-label">Progresso atual</span>
                            <strong className="tiers-page-highlight-value">{progressoAtual}</strong>
                        </div>

                        <div className="tiers-page-highlight-next">
                            <span className="tiers-page-highlight-label">Próximo tier</span>
                            <strong className="tiers-page-highlight-next-value">
                                {proximo ? proximo : "Completo"}
                            </strong>
                        </div>
                    </div>

                    <div className="tiers-page-highlight-bar">
                        <div
                            className="tiers-page-highlight-bar-fill"
                            style={{ width: `${percentual}%` }}
                        />
                    </div>

                    <div className="tiers-page-highlight-footer">
                        <span>
                            {ultimo ? `Último concluído: ${ultimo}` : "Nenhum tier concluído ainda"}
                        </span>

                        <span>
                            {proximo
                                ? `Faltam ${Math.max(0, proximo - progressoAtual)}`
                                : "Todos os tiers concluídos"}
                        </span>
                    </div>
                </div>

                <div className="tiers-page-mini-grid">
                    {metas.map((meta, index) => {
                        const ativo = concluido(concluidos, meta);
                        const recompensa = recompensas[index];

                        return (
                            <div
                                key={meta}
                                className={`tiers-page-mini-card ${ativo ? "concluido" : ""}`}
                            >
                                <div className="tiers-page-mini-card-top">
                                    <strong>{meta}</strong>

                                    <span className="tiers-page-mini-card-reward">
                                        <FestCoin size={18} />
                                        <span>+{recompensa}</span>
                                    </span>
                                </div>

                                <span>{ativo ? "Concluído" : "Em aberto"}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <section className="section tiers-page">
            <div className="tiers-page-top">
                <h2>Tiers</h2>
                <p>
                    Os tiers representam marcos do seu progresso dentro da Fest Haus.
                    Conforme você evolui, novas recompensas vão sendo liberadas.
                </p>
            </div>

            {erro ? <div className="tiers-page-message tiers-page-message--error">{erro}</div> : null}

            <div className="tiers-page-summary-grid">
                <div className="tiers-page-summary-card tiers-page-summary-card--primary">
                    <span className="tiers-page-summary-icon">📷</span>
                    <h3>Fotos concluídas</h3>
                    <strong>{carregando ? "..." : resumo.tiersFotosConcluidos}</strong>
                </div>

                <div className="tiers-page-summary-card">
                    <span className="tiers-page-summary-icon">🎉</span>
                    <h3>Festas concluídas</h3>
                    <strong>{carregando ? "..." : resumo.tiersFestasConcluidos}</strong>
                </div>

                <div className="tiers-page-summary-card">
                    <span className="tiers-page-summary-icon">🏆</span>
                    <h3>Destaques concluídos</h3>
                    <strong>{carregando ? "..." : resumo.tiersDestaqueConcluidos}</strong>
                </div>
            </div>

            <div className="tiers-page-content">
                {carregando ? (
                    <p>Carregando tiers...</p>
                ) : (
                    <>
                        {renderProgressao(
                            "Fotos aprovadas",
                            "Esses marcos acompanham a quantidade de fotos aprovadas para coin.",
                            "Cada nova faixa concluída libera uma recompensa especial ligada às fotos enviadas e aprovadas.",
                            METAS_FOTOS,
                            dados.tiers_fotos,
                            dados.resumo.fotos_aprovadas_para_coin
                        )}

                        {renderProgressao(
                            "Festas realizadas",
                            "Esses marcos acompanham quantas festas elegíveis você já concluiu.",
                            "Cada festa concluída fortalece seu progresso e aproxima você de novas recompensas.",
                            METAS_FESTAS,
                            dados.tiers_festas,
                            dados.resumo.festas_realizadas_elegiveis
                        )}

                        {renderProgressao(
                            "Destaques vencidos",
                            "Esses marcos acompanham sua evolução nas participações e vitórias de destaque.",
                            "Quanto mais você se destaca, mais recompensas exclusivas pode desbloquear no sistema.",
                            METAS_DESTAQUE,
                            dados.tiers_destaque,
                            dados.resumo.destaques_vencidos
                        )}
                    </>
                )}
            </div>
        </section>
    );
}