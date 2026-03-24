import { useEffect, useState } from "react";
import { Check, Clock, ImagePlus, Loader2, RefreshCcw } from "lucide-react";
import { apiFetch } from "../../lib/api";

type Festa = {
    id: string;
    usuario_id: string;
    agendamento_id?: string | null;
    titulo?: string | null;
    data_festa?: string | null;
    criado_pelo_site?: boolean;
    realizada?: boolean;
    status?: string | null;
    realizada_em?: string | null;
    notificacao_imagens_enviada?: boolean;
    usuario?: {
        id: string;
        nome?: string | null;
        email?: string | null;
        telefone?: string | null;
    } | null;
};

export default function VerFestas() {
    const [festas, setFestas] = useState<Festa[]>([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [processandoId, setProcessandoId] = useState<string | null>(null);
    const [processandoAutomatico, setProcessandoAutomatico] = useState(false);

    async function buscarFestas() {
        try {
            setLoading(true);
            setErro("");
            setSucesso("");

            const data = await apiFetch("/api/admin/festas");
            setFestas(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erro ao buscar festas:", error);
            setErro("Não foi possível carregar as festas.");
            setFestas([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        buscarFestas();
    }, []);

    async function marcarComoRealizada(id: string) {
        try {
            setErro("");
            setSucesso("");
            setProcessandoId(id);

            const resposta = await apiFetch(`/api/admin/festas/${id}/realizada`, {
                method: "PUT",
            });

            setFestas((prev) =>
                prev.map((festa) =>
                    festa.id === id
                        ? resposta.data || {
                            ...festa,
                            realizada: true,
                            status: "festa_realizada",
                        }
                        : festa
                )
            );

            setSucesso("Festa marcada como realizada com sucesso.");
        } catch (error) {
            console.error("Erro ao marcar festa como realizada:", error);
            setErro("Não foi possível marcar a festa como realizada.");
        } finally {
            setProcessandoId(null);
        }
    }

    async function processarAutomaticamente() {
        try {
            setErro("");
            setSucesso("");
            setProcessandoAutomatico(true);

            const resposta = await apiFetch(
                "/api/admin/festas/processar-aguardando-imagens",
                {
                    method: "POST",
                }
            );

            await buscarFestas();

            setSucesso(
                resposta?.total_processadas
                    ? `${resposta.total_processadas} festa(s) movida(s) para aguardando imagens.`
                    : "Processamento automático concluído."
            );
        } catch (error) {
            console.error("Erro ao processar festas automaticamente:", error);
            setErro("Não foi possível processar automaticamente.");
        } finally {
            setProcessandoAutomatico(false);
        }
    }

    function obterNomeCliente(festa: Festa) {
        return festa.usuario?.nome?.trim() || "Sem nome";
    }

    function obterEmailCliente(festa: Festa) {
        return festa.usuario?.email || "";
    }

    function formatarData(data?: string | null) {
        if (!data) return "Não informado";

        const dt = new Date(data);
        if (Number.isNaN(dt.getTime())) return data;

        return dt.toLocaleDateString("pt-BR");
    }

    function formatarStatus(status?: string | null) {
        if (status === "agendada") return "Agendada";
        if (status === "festa_realizada") return "Festa realizada";
        if (status === "aguardando_imagens") return "Aguardando imagens";
        return "Agendada";
    }

    function classeStatus(status?: string | null) {
        if (status === "festa_realizada") return "admin-role-badge aprovado";
        if (status === "aguardando_imagens") return "admin-role-badge pendente";
        return "admin-role-badge";
    }

    function renderIconeStatus(status?: string | null) {
        if (status === "festa_realizada") return <Check size={14} />;
        if (status === "aguardando_imagens") return <ImagePlus size={14} />;
        return <Clock size={14} />;
    }

    return (
        <section className="admin-page">
            <div className="admin-page-header">
                <span className="admin-page-badge">Administração</span>
                <h1 className="admin-page-title">Ver Festas</h1>
                <p className="admin-page-subtitle">
                    Gerencie o andamento das festas e liberação automática para envio de imagens.
                </p>
            </div>

            <div className="admin-panel">
                {erro && <p className="admin-message-error">{erro}</p>}
                {sucesso && <p className="admin-message-success">{sucesso}</p>}

                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
                    <button
                        type="button"
                        className="admin-icon-button edit"
                        onClick={processarAutomaticamente}
                        disabled={processandoAutomatico}
                    >
                        {processandoAutomatico ? (
                            <Loader2 size={16} className="spin" />
                        ) : (
                            <RefreshCcw size={16} />
                        )}
                        <span>
                            {processandoAutomatico
                                ? "Processando automático..."
                                : "Processar automático"}
                        </span>
                    </button>
                </div>

                {loading ? (
                    <p className="admin-message-info">Carregando festas...</p>
                ) : festas.length === 0 ? (
                    <p className="admin-message-info">Nenhuma festa encontrada.</p>
                ) : (
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Título</th>
                                    <th>Data</th>
                                    <th>Status</th>
                                    <th>Notificação imagens</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {festas.map((festa) => {
                                    const emProcessamento = processandoId === festa.id;

                                    return (
                                        <tr key={festa.id}>
                                            <td>
                                                <div className="admin-user-name">{obterNomeCliente(festa)}</div>
                                                {obterEmailCliente(festa) && (
                                                    <div className="admin-user-email">{obterEmailCliente(festa)}</div>
                                                )}
                                            </td>

                                            <td>{festa.titulo || "Minha Festa"}</td>
                                            <td>{formatarData(festa.data_festa)}</td>

                                            <td>
                                                <span className={classeStatus(festa.status)}>
                                                    {renderIconeStatus(festa.status)}
                                                    <span style={{ marginLeft: 6 }}>
                                                        {formatarStatus(festa.status)}
                                                    </span>
                                                </span>
                                            </td>

                                            <td>
                                                {festa.notificacao_imagens_enviada ? "Enviada" : "Pendente"}
                                            </td>

                                            <td>
                                                <div className="admin-actions">
                                                    <button
                                                        className="admin-icon-button edit"
                                                        onClick={() => marcarComoRealizada(festa.id)}
                                                        disabled={
                                                            emProcessamento || festa.status === "festa_realizada" || festa.status === "aguardando_imagens"
                                                        }
                                                    >
                                                        {emProcessamento ? (
                                                            <Loader2 size={16} className="spin" />
                                                        ) : (
                                                            <Check size={16} />
                                                        )}
                                                        <span>
                                                            {emProcessamento ? "Salvando..." : "Festa realizada"}
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}