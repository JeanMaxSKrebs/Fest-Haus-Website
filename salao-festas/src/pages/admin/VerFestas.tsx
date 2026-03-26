import { useEffect, useState } from "react";
import {
    Check,
    Clock,
    ImagePlus,
    Loader2,
    RotateCcw,
    Images,
    RefreshCw,
} from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useNavigate } from "react-router-dom";

type Festa = {
    id: string;
    usuario_id: string;
    agendamento_id?: string | null;
    titulo?: string | null;
    data_festa?: string | null;
    criado_pelo_site?: boolean;
    realizada?: boolean;
    status?: "agendada" | "festa_realizada" | null;
    situacao_imagens?:
    | "bloqueada"
    | "aguardando_imagens"
    | "em_analise"
    | "liberadas"
    | null;
    realizada_em?: string | null;
    notificacao_imagens_enviada?: boolean;
    processar_automaticamente?: boolean;
    usuario?: {
        id: string;
        nome?: string | null;
        email?: string | null;
        telefone?: string | null;
    } | null;
};

export default function VerFestas() {
    const navigate = useNavigate();

    const [festas, setFestas] = useState<Festa[]>([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [processandoId, setProcessandoId] = useState<string | null>(null);
    const [alterandoAutomaticoGlobal, setAlterandoAutomaticoGlobal] =
        useState(false);
    const [automaticoGlobal, setAutomaticoGlobal] = useState(false);
    const [alterandoImagemId, setAlterandoImagemId] = useState<string | null>(null);

    async function buscarFestas() {
        try {
            setLoading(true);
            setErro("");
            setSucesso("");

            const data = await apiFetch("/api/admin/festas");
            const lista = Array.isArray(data) ? data : [];

            setFestas(lista);

            if (lista.length > 0) {
                const todasAutomaticas = lista.every((festa) =>
                    Boolean(festa.processar_automaticamente)
                );
                setAutomaticoGlobal(todasAutomaticas);
            } else {
                setAutomaticoGlobal(false);
            }
        } catch (error) {
            console.error("Erro ao buscar festas:", error);
            setErro("Não foi possível carregar as festas.");
            setFestas([]);
            setAutomaticoGlobal(false);
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

    async function voltarPasso(id: string) {
        try {
            setErro("");
            setSucesso("");
            setProcessandoId(id);

            const resposta = await apiFetch(`/api/admin/festas/${id}/agendada`, {
                method: "PUT",
            });

            setFestas((prev) =>
                prev.map((festa) =>
                    festa.id === id
                        ? resposta.data || {
                            ...festa,
                            realizada: false,
                            status: "agendada",
                            situacao_imagens: "bloqueada",
                            realizada_em: null,
                        }
                        : festa
                )
            );

            setSucesso("Festa voltou para agendada com sucesso.");
        } catch (error) {
            console.error("Erro ao voltar passo da festa:", error);
            setErro("Não foi possível voltar a festa para agendada.");
        } finally {
            setProcessandoId(null);
        }
    }

    async function toggleAutomaticoGlobal() {
        try {
            setErro("");
            setSucesso("");
            setAlterandoAutomaticoGlobal(true);

            const novoValor = !automaticoGlobal;

            await apiFetch("/api/admin/festas/automatico-global", {
                method: "PUT",
                body: JSON.stringify({
                    processar_automaticamente: novoValor,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            setAutomaticoGlobal(novoValor);
            setFestas((prev) =>
                prev.map((festa) => ({
                    ...festa,
                    processar_automaticamente: novoValor,
                }))
            );

            setSucesso(
                novoValor
                    ? "Processamento automático ativado para todas as festas."
                    : "Processamento automático desativado para todas as festas."
            );
        } catch (error) {
            console.error("Erro ao alterar processamento automático global:", error);
            setErro("Não foi possível alterar o processamento automático.");
        } finally {
            setAlterandoAutomaticoGlobal(false);
        }
    }

    function proximaSituacaoImagens(
        atual?: Festa["situacao_imagens"]
    ): NonNullable<Festa["situacao_imagens"]> {
        if (atual === "bloqueada") return "aguardando_imagens";
        if (atual === "aguardando_imagens") return "em_analise";
        if (atual === "em_analise") return "liberadas";
        return "bloqueada";
    }

    async function alterarSituacaoImagens(
        id: string,
        situacaoAtual?: Festa["situacao_imagens"]
    ) {
        try {
            setErro("");
            setSucesso("");
            setAlterandoImagemId(id);

            const novaSituacao = proximaSituacaoImagens(situacaoAtual);

            const resposta = await apiFetch(`/api/admin/festas/${id}/situacao-imagens`, {
                method: "PUT",
                body: JSON.stringify({
                    situacao_imagens: novaSituacao,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            setFestas((prev) =>
                prev.map((festa) =>
                    festa.id === id
                        ? {
                            ...festa,
                            ...(resposta.data || {}),
                            situacao_imagens:
                                resposta?.data?.situacao_imagens || novaSituacao,
                        }
                        : festa
                )
            );

            setSucesso("Situação das imagens atualizada com sucesso.");
        } catch (error) {
            console.error("Erro ao alterar situação das imagens:", error);
            setErro("Não foi possível alterar a situação das imagens.");
        } finally {
            setAlterandoImagemId(null);
        }
    }

    function obterNomeCliente(festa: Festa) {
        return festa.usuario?.nome?.trim() || "Sem nome";
    }

    function obterEmailCliente(festa: Festa) {
        return festa.usuario?.email || "";
    }

    function formatarDataHora(data?: string | null) {
        if (!data) {
            return { data: "Não informado", hora: "—" };
        }

        const dt = new Date(data);

        if (Number.isNaN(dt.getTime())) {
            return { data, hora: "—" };
        }

        return {
            data: dt.toLocaleDateString("pt-BR"),
            hora: dt.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
    }

    function formatarStatus(status?: Festa["status"]) {
        if (status === "festa_realizada") return "Realizada";
        return "Agendada";
    }

    function formatarSituacaoImagens(
        situacao?: Festa["situacao_imagens"]
    ) {
        if (situacao === "bloqueada") return "Bloqueadas";
        if (situacao === "aguardando_imagens") return "Aguardando";
        if (situacao === "em_analise") return "Em análise";
        if (situacao === "liberadas") return "Aprovadas";
        return "Bloqueadas";
    }

    function classeStatus(status?: Festa["status"]) {
        if (status === "festa_realizada") return "admin-role-badge aprovado";
        return "admin-role-badge pendente";
    }

    function classeSituacaoImagens(
        situacao?: Festa["situacao_imagens"]
    ) {
        if (situacao === "liberadas") return "admin-role-badge aprovado";
        if (situacao === "aguardando_imagens") return "admin-role-badge pendente";
        if (situacao === "em_analise") return "admin-role-badge";
        return "admin-role-badge recusado";
    }

    function textoBotaoSituacaoImagem(
        situacao?: Festa["situacao_imagens"]
    ) {
        if (situacao === "bloqueada") return "Liberar imagens";
        if (situacao === "aguardando_imagens") return "Colocar em análise";
        if (situacao === "em_analise") return "Aprovar imagens";
        return "Bloquear imagens";
    }

    return (
        <section className="admin-page">
            <div className="admin-page-header">
                <span className="admin-page-badge">Administração</span>
                <h1 className="admin-page-title">Ver Festas</h1>
                <p className="admin-page-subtitle">
                    Gerencie o status das festas e a situação das imagens dos usuários.
                </p>
            </div>

            <div className="admin-panel">
                {erro && <p className="admin-message-error">{erro}</p>}
                {sucesso && <p className="admin-message-success">{sucesso}</p>}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 16,
                        flexWrap: "wrap",
                        marginBottom: 20,
                    }}
                >
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "12px 14px",
                            borderRadius: 14,
                            border: "1px solid rgba(253, 213, 126, 0.16)",
                            background: "rgba(255,255,255,0.04)",
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={automaticoGlobal}
                            onChange={toggleAutomaticoGlobal}
                            disabled={alterandoAutomaticoGlobal}
                        />
                        <div>
                            <strong style={{ display: "block" }}>
                                Processamento automático
                            </strong>
                            <span
                                style={{
                                    fontSize: 13,
                                    color: "var(--cor-texto-secundario)",
                                }}
                            >
                                {alterandoAutomaticoGlobal
                                    ? "Salvando..."
                                    : "Ativo para todas as festas"}
                            </span>
                        </div>
                    </div>
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
                                    <th>Imagens</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {festas.map((festa) => {
                                    const emProcessamento = processandoId === festa.id;
                                    const alterandoImagem = alterandoImagemId === festa.id;
                                    const dataHora = formatarDataHora(festa.data_festa);

                                    return (
                                        <tr key={festa.id}>
                                            <td>
                                                <div className="admin-user-name">
                                                    {obterNomeCliente(festa)}
                                                </div>
                                                {obterEmailCliente(festa) && (
                                                    <div className="admin-user-email">
                                                        {obterEmailCliente(festa)}
                                                    </div>
                                                )}
                                            </td>

                                            <td>{festa.titulo || "Minha Festa"}</td>

                                            <td>
                                                <div className="admin-user-name">{dataHora.data}</div>
                                                <div className="admin-user-email">{dataHora.hora}</div>
                                            </td>

                                            <td>
                                                <span className={classeStatus(festa.status)}>
                                                    {festa.status === "festa_realizada" ? (
                                                        <Check size={14} />
                                                    ) : (
                                                        <Clock size={14} />
                                                    )}
                                                    <span style={{ marginLeft: 6 }}>
                                                        {formatarStatus(festa.status)}
                                                    </span>
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={classeSituacaoImagens(
                                                        festa.situacao_imagens
                                                    )}
                                                >
                                                    <ImagePlus size={14} />
                                                    <span style={{ marginLeft: 6 }}>
                                                        {formatarSituacaoImagens(festa.situacao_imagens)}
                                                    </span>
                                                </span>
                                            </td>

                                            <td>
                                                <div
                                                    className="admin-actions"
                                                    style={{ flexWrap: "wrap" }}
                                                >
                                                    {festa.status === "agendada" ? (
                                                        <button
                                                            className="admin-icon-button edit"
                                                            onClick={() => marcarComoRealizada(festa.id)}
                                                            disabled={emProcessamento}
                                                        >
                                                            {emProcessamento ? (
                                                                <Loader2 size={16} className="spin" />
                                                            ) : (
                                                                <Check size={16} />
                                                            )}
                                                            <span>
                                                                {emProcessamento
                                                                    ? "Salvando..."
                                                                    : "Festa realizada"}
                                                            </span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="admin-icon-button"
                                                            onClick={() => voltarPasso(festa.id)}
                                                            disabled={emProcessamento}
                                                        >
                                                            {emProcessamento ? (
                                                                <Loader2 size={16} className="spin" />
                                                            ) : (
                                                                <RotateCcw size={16} />
                                                            )}
                                                            <span>
                                                                {emProcessamento
                                                                    ? "Salvando..."
                                                                    : "Voltar passo"}
                                                            </span>
                                                        </button>
                                                    )}

                                                    <button
                                                        className="admin-icon-button"
                                                        onClick={() =>
                                                            alterarSituacaoImagens(
                                                                festa.id,
                                                                festa.situacao_imagens
                                                            )
                                                        }
                                                        disabled={alterandoImagem}
                                                    >
                                                        {alterandoImagem ? (
                                                            <Loader2 size={16} className="spin" />
                                                        ) : (
                                                            <RefreshCw size={16} />
                                                        )}
                                                        <span>
                                                            {alterandoImagem
                                                                ? "Salvando..."
                                                                : textoBotaoSituacaoImagem(
                                                                    festa.situacao_imagens
                                                                )}
                                                        </span>
                                                    </button>

                                                    <button
                                                        className="admin-icon-button edit"
                                                        onClick={() =>
                                                            navigate(`/admin/ver-festas/${festa.id}/imagens`)
                                                        }
                                                    >
                                                        <Images size={16} />
                                                        <span>Ver imagens</span>
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