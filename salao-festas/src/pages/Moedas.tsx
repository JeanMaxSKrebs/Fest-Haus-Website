import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type ResumoMoedas = {
    saldo: number;
    checkin_hoje: boolean;
    sequencia_atual: number;
    maior_sequencia: number;
    total_ganhas: number;
    total_gastas: number;
};

type ExtratoMoeda = {
    id: string;
    tipo: "ganho" | "gasto" | "ajuste";
    origem: string;
    referencia_id: string | null;
    valor: number;
    descricao: string;
    criado_em: string;
};

export default function Moedas() {
    const [resumo, setResumo] = useState<ResumoMoedas>({
        saldo: 0,
        checkin_hoje: false,
        sequencia_atual: 0,
        maior_sequencia: 0,
        total_ganhas: 0,
        total_gastas: 0,
    });

    const [extrato, setExtrato] = useState<ExtratoMoeda[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [checkinLoading, setCheckinLoading] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    useEffect(() => {
        carregarMoedas();
    }, []);

    async function carregarMoedas() {
        setCarregando(true);
        setErro("");
        setSucesso("");

        try {
            const [resumoResponse, extratoResponse] = await Promise.all([
                apiFetch("/api/moedas/resumo"),
                apiFetch("/api/moedas/extrato"),
            ]);

            if (!resumoResponse.ok) {
                throw new Error("Não foi possível carregar o resumo de moedas.");
            }

            if (!extratoResponse.ok) {
                throw new Error("Não foi possível carregar o extrato de moedas.");
            }

            const resumoData = await resumoResponse.json();
            const extratoData = await extratoResponse.json();

            setResumo({
                saldo: resumoData.saldo ?? 0,
                checkin_hoje: resumoData.checkin_hoje ?? false,
                sequencia_atual: resumoData.sequencia_atual ?? 0,
                maior_sequencia: resumoData.maior_sequencia ?? 0,
                total_ganhas: resumoData.total_ganhas ?? 0,
                total_gastas: resumoData.total_gastas ?? 0,
            });

            setExtrato(Array.isArray(extratoData) ? extratoData : []);
        } catch (error) {
            console.error("Erro carregarMoedas:", error);
            setErro("Não foi possível carregar suas moedas.");
        } finally {
            setCarregando(false);
        }
    }

    async function fazerCheckin() {
        if (resumo.checkin_hoje || checkinLoading) return;

        setCheckinLoading(true);
        setErro("");
        setSucesso("");

        try {
            const response = await apiFetch("/api/moedas/checkin", {
                method: "POST",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || "Não foi possível realizar o check-in.");
            }

            if (data?.bonus_streak > 0) {
                setSucesso(
                    `Check-in realizado. Você ganhou +${data.ganho} moeda e +${data.bonus_streak} de bônus de streak.`
                );
            } else {
                setSucesso(`Check-in realizado. Você ganhou +${data.ganho} moeda.`);
            }

            await carregarMoedas();
        } catch (error: any) {
            console.error("Erro fazerCheckin:", error);
            setErro(error?.message || "Não foi possível realizar o check-in.");
        } finally {
            setCheckinLoading(false);
        }
    }

    function formatarData(data: string) {
        return new Date(data).toLocaleString("pt-BR");
    }

    return (
        <section className="section moedas-page">
            <div className="moedas-topo">
                <h2>Minhas moedas</h2>
                <p>Veja seu saldo, streak, check-in e extrato completo.</p>
            </div>

            {erro ? <div className="moedas-msg moedas-msg--erro">{erro}</div> : null}
            {sucesso ? <div className="moedas-msg moedas-msg--sucesso">{sucesso}</div> : null}

            <div className="moedas-grid">
                <div className="moedas-card moedas-card--saldo">
                    <span className="moedas-icone">🪙</span>
                    <h3>Saldo atual</h3>
                    <strong>{carregando ? "..." : resumo.saldo}</strong>
                </div>

                <div className="moedas-card">
                    <span className="moedas-icone">🎁</span>
                    <h3>Check-in diário</h3>
                    <strong>
                        {carregando ? "..." : resumo.checkin_hoje ? "Feito hoje" : "Pendente"}
                    </strong>

                    <button
                        type="button"
                        className="btn-apresentacao"
                        onClick={fazerCheckin}
                        disabled={carregando || checkinLoading || resumo.checkin_hoje}
                    >
                        {checkinLoading
                            ? "Registrando..."
                            : resumo.checkin_hoje
                                ? "Check-in concluído"
                                : "Fazer check-in"}
                    </button>
                </div>

                <div className="moedas-card">
                    <span className="moedas-icone">🔥</span>
                    <h3>Streak atual</h3>
                    <strong>{carregando ? "..." : resumo.sequencia_atual}</strong>
                </div>

                <div className="moedas-card">
                    <span className="moedas-icone">🏆</span>
                    <h3>Maior streak</h3>
                    <strong>{carregando ? "..." : resumo.maior_sequencia}</strong>
                </div>

                <div className="moedas-card">
                    <span className="moedas-icone">📈</span>
                    <h3>Total ganho</h3>
                    <strong>{carregando ? "..." : resumo.total_ganhas}</strong>
                </div>

                <div className="moedas-card">
                    <span className="moedas-icone">📉</span>
                    <h3>Total gasto</h3>
                    <strong>{carregando ? "..." : resumo.total_gastas}</strong>
                </div>
            </div>

            <div className="moedas-extrato">
                <div className="moedas-extrato__topo">
                    <h3>Extrato de moedas</h3>
                    <p>Todas as entradas e saídas registradas.</p>
                </div>

                {carregando ? (
                    <p>Carregando extrato...</p>
                ) : extrato.length === 0 ? (
                    <p>Nenhuma movimentação encontrada.</p>
                ) : (
                    <div className="moedas-lista">
                        {extrato.map((item) => (
                            <div key={item.id} className="moedas-item">
                                <div className="moedas-item__info">
                                    <strong>{item.descricao || item.origem}</strong>
                                    <span>
                                        {item.origem} • {formatarData(item.criado_em)}
                                    </span>
                                </div>

                                <div
                                    className={`moedas-item__valor ${item.tipo === "gasto" ? "gasto" : "ganho"}`}
                                >
                                    {item.tipo === "gasto" ? "-" : "+"} {item.valor}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}