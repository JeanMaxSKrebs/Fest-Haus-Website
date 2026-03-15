import { useEffect, useState } from "react";
import { Check, X, Clock, Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/api";

type Agendamento = {
  id: string;
  servico?: string | null;
  data_evento?: string | null;
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

export default function VerAgendamentos() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function buscarAgendamentos() {
    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const data = await apiFetch("/api/agendamentos");
      setAgendamentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      setErro("Não foi possível carregar os agendamentos.");
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    buscarAgendamentos();
  }, []);

  async function aprovarAgendamento(id: string) {
    try {
      setErro("");
      setSucesso("");

      const resposta = await apiFetch(`/api/agendamentos/${id}/aprovar`, {
        method: "PUT",
      });

      setAgendamentos((prev) =>
        prev.map((ag) =>
          ag.id === id ? resposta.data || { ...ag, status: "aprovado" } : ag
        )
      );

      setSucesso("Agendamento aprovado com sucesso.");
    } catch (error) {
      console.error("Erro ao aprovar agendamento:", error);
      setErro("Não foi possível aprovar o agendamento.");
    }
  }

  async function rejeitarAgendamento(id: string) {
    try {
      setErro("");
      setSucesso("");

      const resposta = await apiFetch(`/api/agendamentos/${id}/rejeitar`, {
        method: "PUT",
      });

      setAgendamentos((prev) =>
        prev.map((ag) =>
          ag.id === id ? resposta.data || { ...ag, status: "rejeitado" } : ag
        )
      );

      setSucesso("Agendamento rejeitado com sucesso.");
    } catch (error) {
      console.error("Erro ao rejeitar agendamento:", error);
      setErro("Não foi possível rejeitar o agendamento.");
    }
  }

  async function excluirAgendamento(id: string) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este agendamento?"
    );

    if (!confirmar) return;

    try {
      setErro("");
      setSucesso("");

      await apiFetch(`/api/agendamentos/${id}`, {
        method: "DELETE",
      });

      setAgendamentos((prev) => prev.filter((ag) => ag.id !== id));
      setSucesso("Agendamento excluído com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      setErro("Não foi possível excluir o agendamento.");
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

  function obterNomeCliente(ag: Agendamento) {
    return ag.usuario?.nome?.trim() || "Sem nome";
  }

  function obterEmailCliente(ag: Agendamento) {
    return ag.usuario?.email || "";
  }

  function parseDataEvento(dataEvento: string | null | undefined) {
    if (!dataEvento) {
      return { data: "Não informado", hora: "—" };
    }

    const dt = new Date(dataEvento);

    if (Number.isNaN(dt.getTime())) {
      return { data: dataEvento, hora: "—" };
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
        <h1 className="admin-page-title">Ver Agendamentos</h1>
        <p className="admin-page-subtitle">
          Gerencie solicitações de agendamento feitas pelos clientes.
        </p>
      </div>

      <div className="admin-panel">
        {erro && <p className="admin-message-error">{erro}</p>}
        {sucesso && <p className="admin-message-success">{sucesso}</p>}

        {loading ? (
          <p className="admin-message-info">Carregando agendamentos...</p>
        ) : agendamentos.length === 0 ? (
          <p className="admin-message-info">Nenhum agendamento encontrado.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Data</th>
                  <th>Hora</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {agendamentos.map((ag) => {
                  const dataHora = parseDataEvento(ag.data_evento);

                  return (
                    <tr key={ag.id}>
                      <td>
                        <div className="admin-user-name">
                          {obterNomeCliente(ag)}
                        </div>

                        {obterEmailCliente(ag) && (
                          <div className="admin-user-email">
                            {obterEmailCliente(ag)}
                          </div>
                        )}
                      </td>

                      <td>{ag.servico || "Não informado"}</td>
                      <td>{dataHora.data}</td>
                      <td>{dataHora.hora}</td>

                      <td>
                        <span className={classeStatus(ag.status)}>
                          {renderIconeStatus(ag.status)}
                          <span style={{ marginLeft: 6 }}>
                            {formatarStatus(ag.status)}
                          </span>
                        </span>
                      </td>

                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-icon-button edit"
                            title="Aprovar"
                            onClick={() => aprovarAgendamento(ag.id)}
                          >
                            <Check size={16} />
                            <span>Aprovar</span>
                          </button>

                          <button
                            className="admin-icon-button danger"
                            title="Rejeitar"
                            onClick={() => rejeitarAgendamento(ag.id)}
                          >
                            <X size={16} />
                            <span>Rejeitar</span>
                          </button>

                          <button
                            className="admin-icon-button danger"
                            title="Excluir"
                            onClick={() => excluirAgendamento(ag.id)}
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