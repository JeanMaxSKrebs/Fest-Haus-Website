import { useEffect, useMemo, useState } from "react";
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
    status?: "agendada" | "festa_realizada" | null;
    situacao_imagens?:
    | "bloqueada"
    | "aguardando_imagens"
    | "em_analise"
    | "aprovadas"
    | null;
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

function formatarStatusFesta(
    status?: string | null,
    realizada?: boolean
) {
    if (status === "festa_realizada") return "Realizada";
    if (status === "agendada") return "Agendada";
    return realizada ? "Realizada" : "Agendada";
}

function formatarSituacaoImagens(situacao_imagens?: string | null) {
    if (situacao_imagens === "aguardando_imagens") return "Aguardando imagens";
    if (situacao_imagens === "em_analise") return "Em análise";
    if (situacao_imagens === "aprovadas") return "Aprovadas";
    if (situacao_imagens === "bloqueada") return "Bloqueadas";
    return "Bloqueadas";
}

export default function MinhasFestasDetalhe({ setPageTitle }: Props) {
    const { id } = useParams();
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    const [festa, setFesta] = useState<FestaDetalhe | null>(null);
    const [fotos, setFotos] = useState<FotoFesta[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [enviandoDestaque, setEnviandoDestaque] = useState(false);
    const [selecionadas, setSelecionadas] = useState<string[]>([]);

    const situacaoImagens = festa?.situacao_imagens ?? null;

    const podeEnviarFotos = useMemo(() => {
        const statusPermitidos = ["aguardando_imagens", "em_analise"];
        return statusPermitidos.includes(situacaoImagens ?? "");
    }, [situacaoImagens]);

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

    async function recarregarFotos() {
        if (!id) return;
        const fotosData = await apiFetch(`/api/fotos-festa/festa/${id}`);
        setFotos(Array.isArray(fotosData) ? fotosData : []);
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        if (!files.length || !id) return;

        const restantes = 20 - fotos.length;

        if (restantes <= 0) {
            alert("Você já atingiu o limite de 20 fotos para esta festa.");
            e.target.value = "";
            return;
        }

        const arquivosParaEnviar = files.slice(0, restantes);

        if (files.length > restantes) {
            alert(`Você só pode enviar mais ${restantes} foto(s) nesta festa.`);
        }

        try {
            setEnviando(true);

            for (const file of arquivosParaEnviar) {
                const formData = new FormData();
                formData.append("foto", file);
                formData.append("festa_id", id);

                await apiFetch("/api/fotos-festa", {
                    method: "POST",
                    body: formData,
                });
            }

            await recarregarFotos();
            e.target.value = "";
        } catch (err) {
            console.error("Erro ao enviar fotos:", err);
            alert("Não foi possível enviar uma ou mais fotos.");
        } finally {
            setEnviando(false);
        }
    }

    async function excluirFoto(fotoId: string) {
        const confirmar = window.confirm("Deseja excluir esta foto?");
        if (!confirmar) return;

        try {
            await apiFetch(`/api/fotos-festa/${fotoId}`, {
                method: "DELETE",
            });

            setFotos((prev) => prev.filter((foto) => foto.id !== fotoId));
            setSelecionadas((prev) => prev.filter((id) => id !== fotoId));
        } catch (error) {
            console.error("Erro ao excluir foto:", error);
            alert("Não foi possível excluir a foto.");
        }
    }

    function toggleSelecionada(fotoId: string) {
        if (!podeEnviarFotos) return;

        setSelecionadas((prev) => {
            if (prev.includes(fotoId)) {
                return prev.filter((idAtual) => idAtual !== fotoId);
            }

            if (prev.length >= 3) {
                return prev;
            }

            return [...prev, fotoId];
        });
    }

    async function enviarDestaque() {
        if (!id || selecionadas.length === 0) return;

        try {
            setEnviandoDestaque(true);

            await apiFetch("/api/fotos-festa/destaque", {
                method: "POST",
                body: JSON.stringify({
                    festa_id: id,
                    fotos_ids: selecionadas,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            alert("Fotos enviadas para destaque com sucesso.");
            setSelecionadas([]);
            await recarregarFotos();
        } catch (err) {
            console.error("Erro ao enviar destaque:", err);
            alert("Não foi possível enviar as fotos para destaque.");
        } finally {
            setEnviandoDestaque(false);
        }
    }

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
                    <div className="minhas-festas-erro">{erro || "Festa não encontrada."}</div>

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

                <section className="minhas-festas-detalhe-stack">
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
                                    <strong>Status da festa:</strong>{" "}
                                    {formatarStatusFesta(festa.status, festa.realizada)}
                                </p>
                                <p>
                                    <strong>Situação das imagens:</strong>{" "}
                                    {formatarSituacaoImagens(festa.situacao_imagens)}
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
                                {podeEnviarFotos
                                    ? " Você pode clicar em uma imagem para adicionar ao destaque ou arrastá-la para a área de destaques."
                                    : ""}
                            </p>

                            {podeEnviarFotos && (
                                <>
                                    <div className="minhas-festas-upload">
                                        <label className="minhas-festas-upload-label">
                                            Enviar novas fotos
                                        </label>

                                        <label className="minhas-festas-upload-dropzone">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleUpload}
                                                className="minhas-festas-upload-input-hidden"
                                                disabled={enviando || fotos.length >= 20}
                                            />

                                            <span className="minhas-festas-upload-button">
                                                Escolher ficheiros
                                            </span>

                                            <span className="minhas-festas-upload-dropzone-text">
                                                Selecione uma ou várias imagens para enviar
                                            </span>
                                        </label>

                                        <span className="minhas-festas-upload-info">
                                            Você pode enviar no máximo 20 fotos por festa.
                                        </span>

                                        <span className="minhas-festas-upload-info destaque">
                                            As fotos em destaque futuramente poderão ir para votação no Instagram.
                                        </span>

                                        <span className="minhas-festas-upload-info">
                                            {fotos.length}/20 fotos enviadas
                                        </span>

                                        {enviando && (
                                            <div className="minhas-festas-upload-loading">
                                                <span className="minhas-festas-upload-loading-spinner" />
                                                <span>Enviando fotos, aguarde...</span>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className="minhas-festas-destaques-box"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const fotoId = e.dataTransfer.getData("text/plain");
                                            if (fotoId) {
                                                toggleSelecionada(fotoId);
                                            }
                                        }}
                                    >
                                        <div className="minhas-festas-destaques-header">
                                            <h3 className="minhas-festas-destaques-title">
                                                Destaques selecionados ({selecionadas.length}/3)
                                            </h3>
                                        </div>

                                        <span className="minhas-festas-destaques-explicacao">
                                            Arraste até 3 fotos para esta área ou use o botão “Adicionar destaque”.
                                        </span>

                                        {selecionadas.length === 0 ? (
                                            <div className="minhas-festas-destaques-vazio">
                                                Nenhuma foto selecionada para destaque ainda.
                                            </div>
                                        ) : (
                                            <div className="minhas-festas-destaques-grid">
                                                {fotos
                                                    .filter((foto) => selecionadas.includes(foto.id))
                                                    .map((foto) => (
                                                        <div
                                                            key={foto.id}
                                                            className="minhas-festas-destaque-card"
                                                        >
                                                            {foto.url ? (
                                                                <img
                                                                    src={foto.url}
                                                                    alt="Foto destaque"
                                                                    className="minhas-festas-destaque-imagem"
                                                                />
                                                            ) : (
                                                                <div className="minhas-festas-foto-sem-imagem">
                                                                    Imagem indisponível
                                                                </div>
                                                            )}

                                                            <button
                                                                type="button"
                                                                className="minhas-festas-foto-acao danger"
                                                                onClick={() => toggleSelecionada(foto.id)}
                                                            >
                                                                Remover destaque
                                                            </button>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {fotos.length === 0 ? (
                                <div className="minhas-festas-vazio minhas-festas-vazio-sem-margem">
                                    <p>Nenhuma foto enviada ainda para esta festa.</p>
                                </div>
                            ) : (
                                <div className="minhas-festas-fotos-grid">
                                    {fotos.map((foto) => {
                                        const selecionada = selecionadas.includes(foto.id);

                                        return (
                                            <div
                                                key={foto.id}
                                                draggable={podeEnviarFotos}
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData("text/plain", foto.id);
                                                }}
                                                className={`minhas-festas-foto-card ${selecionada ? "selecionada" : ""
                                                    } ${podeEnviarFotos ? "clicavel" : ""}`}
                                            >
                                                {foto.url ? (
                                                    <div className="minhas-festas-foto-imagem-wrapper">
                                                        <img
                                                            src={foto.url}
                                                            alt="Foto da festa"
                                                            className="minhas-festas-foto-imagem"
                                                        />

                                                        {podeEnviarFotos && (
                                                            <div
                                                                className={`minhas-festas-foto-overlay ${selecionada ? "selecionada" : ""
                                                                    }`}
                                                            >
                                                                <div className="minhas-festas-foto-overlay-icone">
                                                                    {selecionada ? "✓" : "+"}
                                                                </div>

                                                                <span className="minhas-festas-foto-overlay-texto">
                                                                    {selecionada
                                                                        ? "Selecionada para destaque"
                                                                        : "Arraste ou adicione ao destaque"}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="minhas-festas-foto-sem-imagem">
                                                        Imagem indisponível
                                                    </div>
                                                )}

                                                <p className="minhas-festas-foto-status">
                                                    {formatarStatusFoto(foto.status)}
                                                </p>

                                                <p className="minhas-festas-foto-coin">
                                                    {foto.aprovada_para_coin
                                                        ? "Conta para coin"
                                                        : "Ainda não conta para coin"}
                                                </p>

                                                <div className="minhas-festas-foto-acoes">
                                                    {podeEnviarFotos && (
                                                        <button
                                                            type="button"
                                                            className="minhas-festas-foto-acao"
                                                            onClick={() => toggleSelecionada(foto.id)}
                                                        >
                                                            {selecionada
                                                                ? "Remover destaque"
                                                                : "Adicionar destaque"}
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        className="minhas-festas-foto-acao danger"
                                                        onClick={() => excluirFoto(foto.id)}
                                                    >
                                                        Excluir
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </article>
                </section>
            </div>
        </main>
    );
}