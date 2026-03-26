import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../lib/api";

type Festa = {
    id: string;
    titulo?: string | null;
    data_festa?: string | null;
    usuario?: {
        nome?: string | null;
        email?: string | null;
    } | null;
};

type Foto = {
    id: string;
    festa_id: string;
    storage_path: string;
    status: string;
    aprovada_para_coin: boolean;
    destaque_habilitado: boolean;
    created_at: string;
    approved_at: string | null;
    url?: string | null;
    aprovada_para_galeria?: boolean;
};

export default function VerFestaImagens() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [festa, setFesta] = useState<Festa | null>(null);
    const [fotos, setFotos] = useState<Foto[]>([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [processandoId, setProcessandoId] = useState<string | null>(null);

    async function carregar() {
        if (!id) return;

        try {
            setLoading(true);
            setErro("");
            setSucesso("");

            const [festaData, fotosData] = await Promise.all([
                apiFetch(`/api/admin/festas/${id}`),
                apiFetch(`/api/admin/festas/${id}/imagens`),
            ]);

            setFesta(festaData || null);
            setFotos(Array.isArray(fotosData) ? fotosData : []);
        } catch (error) {
            console.error("Erro ao carregar imagens da festa:", error);
            setErro("Não foi possível carregar as imagens da festa.");
            setFesta(null);
            setFotos([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregar();
    }, [id]);

    async function aprovarParaGaleria(fotoId: string) {
        try {
            setErro("");
            setSucesso("");
            setProcessandoId(fotoId);

            const resposta = await apiFetch(
                `/api/admin/fotos/${fotoId}/aprovar-galeria`,
                {
                    method: "PUT",
                }
            );

            setFotos((prev) =>
                prev.map((foto) =>
                    foto.id === fotoId
                        ? {
                            ...foto,
                            ...(resposta || {}),
                            aprovada_para_galeria: true,
                        }
                        : foto
                )
            );

            setSucesso("Imagem aprovada para a galeria do salão.");
        } catch (error) {
            console.error("Erro ao aprovar imagem para galeria:", error);
            setErro("Não foi possível aprovar a imagem para a galeria.");
        } finally {
            setProcessandoId(null);
        }
    }

    async function rejeitarParaGaleria(fotoId: string) {
        try {
            setErro("");
            setSucesso("");
            setProcessandoId(fotoId);

            const resposta = await apiFetch(
                `/api/admin/fotos/${fotoId}/rejeitar-galeria`,
                {
                    method: "PUT",
                }
            );

            setFotos((prev) =>
                prev.map((foto) =>
                    foto.id === fotoId
                        ? {
                            ...foto,
                            ...(resposta || {}),
                            aprovada_para_galeria: false,
                        }
                        : foto
                )
            );

            setSucesso("Imagem removida da galeria do salão.");
        } catch (error) {
            console.error("Erro ao rejeitar imagem da galeria:", error);
            setErro("Não foi possível rejeitar a imagem da galeria.");
        } finally {
            setProcessandoId(null);
        }
    }

    function formatarData(data?: string | null) {
        if (!data) return "Não informado";

        const dt = new Date(data);
        if (Number.isNaN(dt.getTime())) return data;

        return dt.toLocaleDateString("pt-BR");
    }

    return (
        <section className="admin-page">
            <div className="admin-page-header">
                <span className="admin-page-badge">Administração</span>
                <h1 className="admin-page-title">Imagens da Festa</h1>
                <p className="admin-page-subtitle">
                    Aprove ou bloqueie imagens antes de irem para a galeria do salão.
                </p>
            </div>

            <div className="admin-panel">
                {erro && <p className="admin-message-error">{erro}</p>}
                {sucesso && <p className="admin-message-success">{sucesso}</p>}

                <div style={{ marginBottom: 18 }}>
                    <button
                        type="button"
                        className="admin-icon-button"
                        onClick={() => navigate("/admin/ver-festas")}
                    >
                        <span>← Voltar para festas</span>
                    </button>
                </div>

                {loading ? (
                    <p className="admin-message-info">Carregando imagens...</p>
                ) : !festa ? (
                    <p className="admin-message-info">Festa não encontrada.</p>
                ) : (
                    <>
                        <div
                            style={{
                                marginBottom: 20,
                                padding: 18,
                                borderRadius: 18,
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(253, 213, 126, 0.12)",
                            }}
                        >
                            <h2 style={{ marginBottom: 8 }}>{festa.titulo || "Minha Festa"}</h2>
                            <p style={{ color: "var(--cor-texto-secundario)", margin: 0 }}>
                                <strong>Data:</strong> {formatarData(festa.data_festa)}
                            </p>
                        </div>

                        {fotos.length === 0 ? (
                            <p className="admin-message-info">
                                Nenhuma imagem enviada para esta festa.
                            </p>
                        ) : (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                    gap: 16,
                                }}
                            >
                                {fotos.map((foto) => {
                                    const processando = processandoId === foto.id;

                                    return (
                                        <article
                                            key={foto.id}
                                            style={{
                                                background: "rgba(255,255,255,0.04)",
                                                border: "1px solid rgba(253, 213, 126, 0.12)",
                                                borderRadius: 18,
                                                padding: 14,
                                            }}
                                        >
                                            {foto.url ? (
                                                <img
                                                    src={foto.url}
                                                    alt="Imagem da festa"
                                                    style={{
                                                        width: "100%",
                                                        height: 180,
                                                        objectFit: "cover",
                                                        borderRadius: 12,
                                                        marginBottom: 12,
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        height: 180,
                                                        borderRadius: 12,
                                                        marginBottom: 12,
                                                        background: "rgba(255,255,255,0.05)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        color: "var(--cor-texto-secundario)",
                                                    }}
                                                >
                                                    Imagem indisponível
                                                </div>
                                            )}

                                            <p style={{ marginBottom: 8 }}>
                                                <strong>Status:</strong> {foto.status}
                                            </p>

                                            <p
                                                style={{
                                                    marginBottom: 12,
                                                    color: "var(--cor-texto-secundario)",
                                                }}
                                            >
                                                {foto.aprovada_para_galeria
                                                    ? "Aprovada para a galeria"
                                                    : "Ainda não aprovada para a galeria"}
                                            </p>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 10,
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                <button
                                                    className="admin-icon-button edit"
                                                    onClick={() => aprovarParaGaleria(foto.id)}
                                                    disabled={processando}
                                                >
                                                    <span>
                                                        {processando ? "Salvando..." : "Aprovar galeria"}
                                                    </span>
                                                </button>

                                                <button
                                                    className="admin-icon-button danger"
                                                    onClick={() => rejeitarParaGaleria(foto.id)}
                                                    disabled={processando}
                                                >
                                                    <span>Bloquear</span>
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}