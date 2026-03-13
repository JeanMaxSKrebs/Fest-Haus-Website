import { useEffect, useState } from "react";
import { Check, X, Clock } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

type Agendamento = {
  id: string;
  nome: string | null;
  servico: string | null;
  data: string | null;
  hora: string | null;
  status: string | null;
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

      const { data, error } = await supabase
        .from("agendamentos")
        .select("id, nome, servico, data, hora, status")
        .order("data", { ascending: true });

      if (error) throw error;

      setAgendamentos(data || []);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      setErro("Não foi possível carregar os agendamentos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    buscarAgendamentos();
  }, []);

  async function atualizarStatus(id: string, novoStatus: string) {
    try {
      setErro("");
      setSucesso("");

      const { error } = await supabase
        .from("agendamentos")
        .update({ status: novoStatus })
        .eq("id", id);

      if (error) throw error;

      setAgendamentos((prev) =>
        prev.map((ag) =>
          ag.id === id ? { ...ag, status: novoStatus } : ag
        )
      );

      setSucesso("Status atualizado com sucesso.");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setErro("Não foi possível atualizar o status.");
    }
  }

  function classeStatus(status: string | null) {
    const valor = (status || "").toLowerCase();

    if (valor === "aprovado") return "admin-role-badge aprovado";
    if (valor === "recusado") return "admin-role-badge recusado";
    return "admin-role-badge pendente";
  }

  function formatarData(data: string | null) {
    if (!data) return "Não informado";
    return new Date(data).toLocaleDateString("pt-BR");
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
          <p className="admin-message-info">
            Nenhum agendamento encontrado.
          </p>
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
                {agendamentos.map((ag) => (
                  <tr key={ag.id}>
                    <td>
                      <div className="admin-user-name">
                        {ag.nome || "Sem nome"}
                      </div>
                    </td>

                    <td>{ag.servico || "Não informado"}</td>

                    <td>{formatarData(ag.data)}</td>

                    <td>{ag.hora || "—"}</td>

                    <td>
                      <span className={classeStatus(ag.status)}>
                        {ag.status === "Aprovado" ? (
                          <Check size={14} />
                        ) : ag.status === "Recusado" ? (
                          <X size={14} />
                        ) : (
                          <Clock size={14} />
                        )}
                        &nbsp;{ag.status || "Pendente"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-actions">
                        {ag.status === "Em Processo" ||
                        ag.status === "Pendente" ? (
                          <>
                            <button
                              className="admin-icon-button edit"
                              title="Aprovar"
                              onClick={() =>
                                atualizarStatus(ag.id, "Aprovado")
                              }
                            >
                              <Check size={18} />
                            </button>

                            <button
                              className="admin-icon-button danger"
                              title="Rejeitar"
                              onClick={() =>
                                atualizarStatus(ag.id, "Recusado")
                              }
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}