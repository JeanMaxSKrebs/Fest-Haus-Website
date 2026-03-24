import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type Props = {
    setPageTitle: (title: string) => void;
};

type FestaDetalhe = {
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

type FotoFesta = {
    id: string;
    festa_id: string;
    storage_path: string;
    status: string;
    aprovada_para_coin: boolean;
    destaque_habilitado: boolean;
    created_at: string;
    approved_at: string | null;
    url?: string | null;
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

function formatarStatusFoto(status?: string | null) {
    if (!status) return "Pendente";

    if (status === "aprovada") return "Aprovada";
    if (status === "rejeitada") return "Rejeitada";
    if (status === "concorrendo_destaque") return "Concorrendo";
    if (status === "destaque_mes") return "Destaque do mês";

    return "Pendente";
}

export default function MinhasFestasDetalhe({ setPageTitle }: Props) {
    const { id } = useParams();
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    const [festa, setFesta] = useState<FestaDetalhe | null>(null);
    const [fotos, setFotos] = useState<FotoFesta[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        async function carregar() {
            if (!user || !id) {
                setCarregando(false);
                setPageTitle("Detalhe da Festa | Fest Haus");
                return;
            }

            try {
                setCarregando(true);
                setErro("");

                const [festaData, fotosData] = await Promise.all([
                    apiFetch(`/api/festas/${id}`),
                    apiFetch(`/api/fotos-festa/festa/${id}`),
                ]);

                setFesta(festaData || null);
                setFotos(Array.isArray(fotosData) ? fotosData : []);
                setPageTitle(`${festaData?.titulo || "Detalhe da Festa"} | Fest Haus`);
            } catch (error) {
                console.error("Erro ao carregar detalhe da festa:", error);
                setErro("Não foi possível carregar os detalhes da festa.");
                setFesta(null);
                setFotos([]);
                setPageTitle("Detalhe da Festa | Fest Haus");
            } finally {
                setCarregando(false);
            }
        }

        if (!loading) {
            carregar();
        }
    }, [id, user, loading, setPageTitle]);

    useEffect(() => {
        return () => {
            setPageTitle("Detalhe da Festa | Fest Haus");
        };
    }, [setPageTitle]);

    if (loading || carregando) {
        return (
            <main className="minhas-festas-page">
                <div className="minhas-festas-container">
                    <p className="minhas-festas-loading">Carregando detalhes da festa...</p>
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="minhas-festas-page">
                <div className="minhas-festas-container">
                    <div className="minhas-festas-erro">Faça login para visualizar essa festa.</div>
                </div>
            </main>
        );
    }

    if (erro || !festa) {
        return (
            <main className="minhas-festas-page">
                <div className="minhas-festas-container">
                    <div className="minhas-festas-erro">
                        {erro || "Festa não encontrada."}
                    </div>

                    <button
                        type="button"
                        className="minhas-festas-botao"
                        onClick={() => navigate("/minhas-festas")}
                    >
                        Voltar para Minhas Festas
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="minhas-festas-page">
            <div className="minhas-festas-container">
                <header className="minhas-festas-header">
                    <span className="minhas-festas-badge">Detalhe da Festa</span>
                    <h1 className="minhas-festas-title">{festa.titulo || "Minha Festa"}</h1>
                    <p className="minhas-festas-subtitle">
                        Veja as informações da sua festa e acompanhe as fotos enviadas.
                    </p>
                </header>

                <section className="minhas-festas-grid" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
                    <article className="minhas-festas-card">
                        <div className="minhas-festas-card-content">
                            <h2 className="minhas-festas-card-title">Informações da Festa</h2>

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
                                <p>
                                    <strong>Status:</strong> {festa.realizada ? "Realizada" : "Em andamento"}
                                </p>
                            </div>

                            <div className="minhas-festas-resumo">
                                <div className="minhas-festas-resumo-item">
                                    <span className="minhas-festas-resumo-numero">
                                        {festa.total_fotos || 0}
                                    </span>
                                    <span className="minhas-festas-resumo-label">Fotos enviadas</span>
                                </div>

                                <div className="minhas-festas-resumo-item">
                                    <span className="minhas-festas-resumo-numero">
                                        {festa.fotos_aprovadas || 0}
                                    </span>
                                    <span className="minhas-festas-resumo-label">Aprovadas</span>
                                </div>

                                <div className="minhas-festas-resumo-item">
                                    <span className="minhas-festas-resumo-numero">
                                        {festa.fotos_para_coin || 0}
                                    </span>
                                    <span className="minhas-festas-resumo-label">Valendo coin</span>
                                </div>
                            </div>
                        </div>

                        <div className="minhas-festas-card-footer">
                            <span className="minhas-festas-card-action">
                                Acompanhe suas outras festas
                            </span>

                            <button
                                type="button"
                                className="minhas-festas-botao"
                                onClick={() => navigate("/minhas-festas")}
                            >
                                Voltar
                            </button>
                        </div>
                    </article>

                    <article className="minhas-festas-card">
                        <div className="minhas-festas-card-content">
                            <h2 className="minhas-festas-card-title">Fotos da Festa</h2>
                            <p className="minhas-festas-card-description">
                                Aqui ficam as fotos vinculadas a essa festa.
                            </p>

                            {fotos.length === 0 ? (
                                <div className="minhas-festas-vazio" style={{ margin: 0 }}>
                                    <p>Nenhuma foto enviada ainda para esta festa.</p>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                                        gap: "14px",
                                    }}
                                >
                                    {fotos.map((foto) => (
                                        <div
                                            key={foto.id}
                                            style={{
                                                background: "rgba(255,255,255,0.03)",
                                                border: "1px solid rgba(253, 213, 126, 0.12)",
                                                borderRadius: "18px",
                                                padding: "12px",
                                            }}
                                        >
                                            {foto.url ? (
                                                <img
                                                    src={foto.url}
                                                    alt="Foto da festa"
                                                    style={{
                                                        width: "100%",
                                                        height: "150px",
                                                        objectFit: "cover",
                                                        borderRadius: "12px",
                                                        marginBottom: "10px",
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        height: "150px",
                                                        borderRadius: "12px",
                                                        marginBottom: "10px",
                                                        background: "rgba(255,255,255,0.05)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        color: "var(--cor-texto-secundario)",
                                                        fontSize: "14px",
                                                        textAlign: "center",
                                                        padding: "10px",
                                                    }}
                                                >
                                                    Imagem indisponível
                                                </div>
                                            )}

                                            <p style={{ color: "var(--cor-texto)", fontWeight: 700, marginBottom: 6 }}>
                                                {formatarStatusFoto(foto.status)}
                                            </p>

                                            <p style={{ color: "var(--cor-texto-secundario)", fontSize: "14px" }}>
                                                {foto.aprovada_para_coin ? "Conta para coin" : "Ainda não conta para coin"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </article>
                </section>
            </div>
        </main>
    );
}