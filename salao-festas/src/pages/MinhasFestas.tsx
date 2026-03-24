import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type FestaApi = {
    id: string;
    usuario_id: string;
    agendamento_id: string | null;
    titulo: string | null;
    data_festa: string | null;
    criado_pelo_site: boolean;
    realizada: boolean;
    created_at: string;
    total_fotos?: number;
    fotos_aprovadas?: number;
    fotos_pendentes?: number;
    fotos_para_coin?: number;
};

function formatarData(data?: string | null) {
    if (!data) return "Sem data definida";

    const dt = new Date(data);

    if (Number.isNaN(dt.getTime())) {
        return data;
    }

    return dt.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function festaJaPassou(data?: string | null) {
    if (!data) return false;

    const hoje = new Date();
    const festa = new Date(data);

    hoje.setHours(0, 0, 0, 0);
    festa.setHours(0, 0, 0, 0);

    return festa < hoje;
}

function festaEhHoje(data?: string | null) {
    if (!data) return false;

    const hoje = new Date();
    const festa = new Date(data);

    return (
        hoje.getFullYear() === festa.getFullYear() &&
        hoje.getMonth() === festa.getMonth() &&
        hoje.getDate() === festa.getDate()
    );
}

function obterStatusFesta(festa: FestaApi) {
    if (festa.realizada) {
        return {
            label: "Realizada",
            classe: "realizada",
            descricao: "Essa festa já foi marcada como realizada.",
        };
    }

    if (festaEhHoje(festa.data_festa)) {
        return {
            label: "É hoje",
            classe: "hoje",
            descricao: "Sua festa acontece hoje.",
        };
    }

    if (festaJaPassou(festa.data_festa)) {
        return {
            label: "Aguardando registro",
            classe: "aguardando",
            descricao:
                "A data da festa já passou. Em breve essa etapa pode liberar registro e recompensas.",
        };
    }

    return {
        label: "Agendada",
        classe: "agendada",
        descricao: "Sua festa está cadastrada e aguardando a data do evento.",
    };
}

export default function MinhasFestas() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    const [festas, setFestas] = useState<FestaApi[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        async function carregarFestas() {
            if (!user) {
                setFestas([]);
                setCarregando(false);
                return;
            }

            try {
                setCarregando(true);
                setErro("");

                const data = await apiFetch("/api/festas/minhas");
                setFestas(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Erro ao carregar minhas festas:", error);
                setErro("Não foi possível carregar suas festas.");
                setFestas([]);
            } finally {
                setCarregando(false);
            }
        }

        if (!loading) {
            carregarFestas();
        }
    }, [user, loading]);

    if (loading || carregando) {
        return (
            <main className="minhas-festas-page">
                <div className="minhas-festas-container">
                    <header className="minhas-festas-header">
                        <span className="minhas-festas-badge">Área do Usuário</span>
                        <h1 className="minhas-festas-title">Minhas Festas</h1>
                        <p className="minhas-festas-subtitle">Acompanhe suas festas e fotos.</p>
                    </header>

                    <p className="minhas-festas-loading">Carregando suas festas...</p>
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="minhas-festas-page">
                <div className="minhas-festas-container">
                    <header className="minhas-festas-header">
                        <span className="minhas-festas-badge">Área do Usuário</span>
                        <h1 className="minhas-festas-title">Minhas Festas</h1>
                        <p className="minhas-festas-subtitle">
                            Faça login para acompanhar suas festas.
                        </p>
                    </header>
                </div>
            </main>
        );
    }

    return (
        <main className="minhas-festas-page">
            <div className="minhas-festas-container">
                <header className="minhas-festas-header">
                    <span className="minhas-festas-badge">Área do Usuário</span>
                    <h1 className="minhas-festas-title">Minhas Festas</h1>
                    <p className="minhas-festas-subtitle">
                        Aqui você acompanha seus eventos, fotos enviadas e o andamento de cada festa.
                    </p>
                </header>

                {erro ? <div className="minhas-festas-erro">{erro}</div> : null}

                {!erro && festas.length === 0 ? (
                    <section className="minhas-festas-vazio">
                        <h2>Nenhuma festa encontrada</h2>
                        <p>
                            Quando um agendamento aprovado gerar uma festa para sua conta, ela aparecerá aqui.
                        </p>
                    </section>
                ) : (
                    <section className="minhas-festas-grid">
                        {festas.map((festa) => {
                            const status = obterStatusFesta(festa);

                            return (
                                <article key={festa.id} className="minhas-festas-card">
                                    <div className="minhas-festas-card-top">
                                        <span className={`minhas-festas-status ${status.classe}`}>
                                            {status.label}
                                        </span>
                                    </div>

                                    <div className="minhas-festas-card-content">
                                        <h2 className="minhas-festas-card-title">
                                            {festa.titulo || "Minha Festa"}
                                        </h2>

                                        <p className="minhas-festas-card-description">
                                            {status.descricao}
                                        </p>

                                        <div className="minhas-festas-info">
                                            <p>
                                                <strong>Data:</strong> {formatarData(festa.data_festa)}
                                            </p>

                                            <p>
                                                <strong>Origem:</strong>{" "}
                                                {festa.criado_pelo_site ? "Criada pelo site" : "Manual"}
                                            </p>

                                            <p>
                                                <strong>Agendamento vinculado:</strong>{" "}
                                                {festa.agendamento_id ? "Sim" : "Não"}
                                            </p>
                                        </div>

                                        <div className="minhas-festas-resumo">
                                            <div className="minhas-festas-resumo-item">
                                                <span className="minhas-festas-resumo-numero">
                                                    {festa.total_fotos || 0}
                                                </span>
                                                <span className="minhas-festas-resumo-label">
                                                    Fotos enviadas
                                                </span>
                                            </div>

                                            <div className="minhas-festas-resumo-item">
                                                <span className="minhas-festas-resumo-numero">
                                                    {festa.fotos_aprovadas || 0}
                                                </span>
                                                <span className="minhas-festas-resumo-label">
                                                    Aprovadas
                                                </span>
                                            </div>

                                            <div className="minhas-festas-resumo-item">
                                                <span className="minhas-festas-resumo-numero">
                                                    {festa.fotos_para_coin || 0}
                                                </span>
                                                <span className="minhas-festas-resumo-label">
                                                    Valendo coin
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="minhas-festas-card-footer">
                                        <button
                                            type="button"
                                            className="minhas-festas-botao"
                                            onClick={() => navigate(`/minhas-festas/${festa.id}`)}
                                        >
                                            Ver detalhes da festa →
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}
            </div>
        </main>
    );
}