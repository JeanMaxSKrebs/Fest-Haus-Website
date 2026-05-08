import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import FestCoin from "../components/coin/FestCoin";

type Missao = {
    id: string;
    codigo: string;
    titulo: string;
    descricao: string | null;
    tipo: "diaria" | "semanal" | "mensal" | "unica" | "permanente";
    categoria: "login" | "fotos" | "festas" | "destaque" | "especial";
    meta: number;
    recompensa_moedas: number;
    progresso_atual: number;
    concluida: boolean;
    resgatada: boolean;
    referencia_periodo: string | null;
};

export default function Missoes() {
    const [missoes, setMissoes] = useState<Missao[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [resgatandoId, setResgatandoId] = useState<string | null>(null);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    useEffect(() => {
        carregarMissoes();
    }, []);

    async function carregarMissoes() {
        setCarregando(true);
        setErro("");
        setSucesso("");

        try {
            const data = await apiFetch("/api/missoes/minhas");
            setMissoes(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error("Erro carregarMissoes:", error);
            setErro(error?.message || "Não foi possível carregar suas missões.");
        } finally {
            setCarregando(false);
        }
    }

    async function resgatarMissao(missaoId: string) {
        if (resgatandoId) return;

        setResgatandoId(missaoId);
        setErro("");
        setSucesso("");

        try {
            const data = await apiFetch(`/api/missoes/${missaoId}/resgatar`, {
                method: "POST",
            });

            setSucesso(
                `Missão resgatada com sucesso. Você ganhou +${data?.recompensa ?? 0} moedas.`
            );

            await carregarMissoes();
            window.dispatchEvent(new Event("moedas-atualizadas"));
        } catch (error: any) {
            console.error("Erro resgatarMissao:", error);
            setErro(error?.message || "Não foi possível resgatar a missão.");
        } finally {
            setResgatandoId(null);
        }
    }

    const resumo = useMemo(() => {
        const total = missoes.length;
        const concluidas = missoes.filter((m) => m.concluida).length;
        const resgatadas = missoes.filter((m) => m.resgatada).length;
        const pendentes = missoes.filter((m) => !m.concluida).length;
        const prontasParaResgatar = missoes.filter(
            (m) => m.concluida && !m.resgatada
        ).length;

        return {
            total,
            concluidas,
            resgatadas,
            pendentes,
            prontasParaResgatar,
        };
    }, [missoes]);

    function percentualMissao(missao: Missao) {
        if (!missao.meta || missao.meta <= 0) return 0;
        return Math.min(
            100,
            Math.round((missao.progresso_atual / missao.meta) * 100)
        );
    }

    function nomeTipo(tipo: Missao["tipo"]) {
        if (tipo === "diaria") return "Diária";
        if (tipo === "semanal") return "Semanal";
        if (tipo === "mensal") return "Mensal";
        if (tipo === "unica") return "Única";
        return "Permanente";
    }

    function nomeCategoria(categoria: Missao["categoria"]) {
        if (categoria === "login") return "Login";
        if (categoria === "fotos") return "Fotos";
        if (categoria === "festas") return "Festas";
        if (categoria === "destaque") return "Destaque";
        return "Especial";
    }

    function textoStatus(missao: Missao) {
        if (missao.resgatada) return "Resgatada";
        if (missao.concluida) return "Pronta para resgatar";
        return "Em progresso";
    }

    return (
        <section className="section moedas-page">
            <div className="moedas-topo">
                <h2>Missões</h2>
                <p>Complete objetivos e ganhe FestCoins.</p>
            </div>

            {erro ? <div className="moedas-msg moedas-msg--erro">{erro}</div> : null}
            {sucesso ? <div className="moedas-msg moedas-msg--sucesso">{sucesso}</div> : null}

            <div className="moedas-grid">
                <div className="moedas-card moedas-card--saldo">
                    <FestCoin size={42} />
                    <h3>Total de missões</h3>
                    <strong>{carregando ? "..." : resumo.total}</strong>
                </div>

                <div className="moedas-card">
                    <span className="moedas-icone">✅</span>
                    <h3>Concluídas</h3>
                    <strong>{carregando ? "..." : resumo.concluidas}</strong>
                </div>

                <div className="moedas-card">
                    <span className="moedas-icone">🎁</span>
                    <h3>Prontas para resgatar</h3>
                    <strong>{carregando ? "..." : resumo.prontasParaResgatar}</strong>
                </div>

                <div className="moedas-card">
                    <span className="moedas-icone">📌</span>
                    <h3>Pendentes</h3>
                    <strong>{carregando ? "..." : resumo.pendentes}</strong>
                </div>

                <div className="moedas-card">
                    <span className="moedas-icone">🏆</span>
                    <h3>Já resgatadas</h3>
                    <strong>{carregando ? "..." : resumo.resgatadas}</strong>
                </div>
            </div>

            <div className="moedas-extrato">
                <div className="moedas-extrato__topo">
                    <h3>Lista de missões</h3>
                    <p>Acompanhe seu progresso e resgate suas recompensas.</p>
                </div>

                {carregando ? (
                    <p>Carregando missões...</p>
                ) : missoes.length === 0 ? (
                    <p>Nenhuma missão encontrada.</p>
                ) : (
                    <div className="missoes-lista">
                        {missoes.map((missao) => {
                            const progresso = percentualMissao(missao);
                            const podeResgatar = missao.concluida && !missao.resgatada;

                            return (
                                <div key={missao.id} className="missao-card">
                                    <div className="missao-card__topo">
                                        <div>
                                            <h4 className="missao-card__titulo">{missao.titulo}</h4>
                                            <p className="missao-card__descricao">
                                                {missao.descricao || "Complete esta missão para ganhar recompensas."}
                                            </p>
                                        </div>

                                        <div className="missao-card__coin">
                                            <FestCoin size={30} />
                                            <span>+{missao.recompensa_moedas}</span>
                                        </div>
                                    </div>

                                    <div className="missao-card__meta">
                                        <span>{nomeTipo(missao.tipo)}</span>
                                        <span>{nomeCategoria(missao.categoria)}</span>
                                        <span>{textoStatus(missao)}</span>
                                    </div>

                                    <div className="missao-card__progresso">
                                        <div className="missao-card__barra">
                                            <div
                                                className="missao-card__barra-fill"
                                                style={{ width: `${progresso}%` }}
                                            />
                                        </div>

                                        <span className="missao-card__progresso-texto">
                                            {missao.progresso_atual}/{missao.meta}
                                        </span>
                                    </div>

                                    <div className="missao-card__rodape">
                                        <span className="missao-card__status">
                                            {progresso}% concluído
                                        </span>

                                        <button
                                            type="button"
                                            className="btn-apresentacao"
                                            disabled={!podeResgatar || resgatandoId === missao.id}
                                            onClick={() => resgatarMissao(missao.id)}
                                        >
                                            {missao.resgatada
                                                ? "Resgatada"
                                                : resgatandoId === missao.id
                                                    ? "Resgatando..."
                                                    : podeResgatar
                                                        ? "Resgatar"
                                                        : "Em progresso"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}