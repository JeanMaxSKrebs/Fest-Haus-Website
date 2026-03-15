import { useEffect, useState } from "react";
import { Check, X, Clock, Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/api";

type Visita = {
  id: string;
  data_visita?: string | null;
  status?: string | null;
  mensagem?: string | null;
  usuario_id?: string | null;
  usuario?: {
    id: string;
    nome?: string | null;
    email?: string | null;
    telefone?: string | null;
  } | null;
};

export default function VerVisitas() {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function buscarVisitas() {
    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const data = await apiFetch("/api/visitas");
      setVisitas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar visitas:", error);
      setErro("Não foi possível carregar as visitas.");
      setVisitas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    buscarVisitas();
  }, []);

  async function aprovarVisita(id: string) {
    try {
      setErro("");
      setSucesso("");

      const resposta = await apiFetch(`/api/visitas/${id}/aprovar`, {
        method: "PUT",
      });

      setVisitas((prev) =>
        prev.map((visita) =>
          visita.id === id
            ? resposta.data || { ...visita, status: "aprovado" }
            : visita
        )
      );

      setSucesso("Visita aprovada com sucesso.");
    } catch (error) {
      console.error("Erro ao aprovar visita:", error);
      setErro("Não foi possível aprovar a visita.");
    }
  }

  async function rejeitarVisita(id: string) {
    try {
      setErro("");
      setSucesso("");

      const resposta = await apiFetch(`/api/visitas/${id}/rejeitar`, {
        method: "PUT",
      });

      setVisitas((prev) =>
        prev.map((visita) =>
          visita.id === id
            ? resposta.data || { ...visita, status: "rejeitado" }
            : visita
        )
      );

      setSucesso("Visita rejeitada com sucesso.");
    } catch (error) {
      console.error("Erro ao rejeitar visita:", error);
      setErro("Não foi possível rejeitar a visita.");
    }
  }

  async function excluirVisita(id: string) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir esta visita?"
    );

    if (!confirmar) return;

    try {
      setErro("");
      setSucesso("");

      await apiFetch(`/api/visitas/${id}`, {
        method: "DELETE",
      });

      setVisitas((prev) => prev.filter((visita) => visita.id !== id));
      setSucesso("Visita excluída com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir visita:", error);
      setErro("Não foi possível excluir a visita.");
    }
  }

  function classeStatus(status: string | null | undefined) {
    const valor = (status || "").toLowerCase();

    if (valor === "aprovado") return "admin-role-badge aprovado";
    if (valor === "rejeitado" || valor === "recusado") {
      return "admin-role-badge recusado";
    }

    return "admin-role-badge pendente";
  }

  function renderIconeStatus(status: string | null | undefined) {
    const valor = (status || "").toLowerCase();

    if (valor === "aprovado") return <Check size={14} />;
    if (valor === "rejeitado" || valor === "recusado") return <X size={14} />;
    return <Clock size={14} />;
  }

  function formatarStatus(status: string | null | undefined) {
    const valor = (status || "").toLowerCase();

    if (valor === "aprovado") return "Aprovado";
    if (valor === "rejeitado" || valor === "recusado") return "Rejeitado";
    if (valor === "em_processo") return "Em processo";
    if (valor === "pendente") return "Pendente";

    return status || "Pendente";
  }

  function obterNomeCliente(visita: Visita) {
    return visita.usuario?.nome?.trim() || "Sem nome";
  }

  function obterEmailCliente(visita: Visita) {
    return visita.usuario?.email || "";
  }

  function parseDataVisita(dataVisita: string | null | undefined) {
    if (!dataVisita) {
      return { data: "Não informado", hora: "—" };
    }

    const dt = new Date(dataVisita);

    if (Number.isNaN(dt.getTime())) {
      return { data: dataVisita, hora: "—" };
    }

    return {
      data: dt.toLocaleDateString("pt-BR"),
      hora: dt.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <span className="admin-page-badge">Administração</span>
        <h1 className="admin-page-title">Ver Visitas</h1>
        <p className="admin-page-subtitle">
          Gerencie solicitações de visita feitas pelos clientes.
        </p>
      </div>

      <div className="admin-panel">
        {erro && <p className="admin-message-error">{erro}</p>}
        {sucesso && <p className="admin-message-success">{sucesso}</p>}

        {loading ? (
          <p className="admin-message-info">Carregando visitas...</p>
        ) : visitas.length === 0 ? (
          <p className="admin-message-info">Nenhuma visita encontrada.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th>Hora</th>
                  <th>Mensagem</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {visitas.map((visita) => {
                  const dataHora = parseDataVisita(visita.data_visita);

                  return (
                    <tr key={visita.id}>
                      <td>
                        <div className="admin-user-name">
                          {obterNomeCliente(visita)}
                        </div>

                        {obterEmailCliente(visita) && (
                          <div className="admin-user-email">
                            {obterEmailCliente(visita)}
                          </div>
                        )}
                      </td>

                      <td>{dataHora.data}</td>
                      <td>{dataHora.hora}</td>
                      <td>{visita.mensagem || "Sem mensagem"}</td>

                      <td>
                        <span className={classeStatus(visita.status)}>
                          {renderIconeStatus(visita.status)}
                          <span style={{ marginLeft: 6 }}>
                            {formatarStatus(visita.status)}
                          </span>
                        </span>
                      </td>

                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-icon-button edit"
                            title="Aprovar"
                            onClick={() => aprovarVisita(visita.id)}
                          >
                            <Check size={16} />
                            <span>Aprovar</span>
                          </button>

                          <button
                            className="admin-icon-button danger"
                            title="Rejeitar"
                            onClick={() => rejeitarVisita(visita.id)}
                          >
                            <X size={16} />
                            <span>Rejeitar</span>
                          </button>

                          <button
                            className="admin-icon-button danger"
                            title="Excluir"
                            onClick={() => excluirVisita(visita.id)}
                          >
                            <Trash2 size={16} />
                            <span>Excluir</span>
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