import { useEffect, useState } from "react";
import { Eye, Edit, Trash2, DollarSign } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

type Orcamento = {
  id: string;
  nome: string | null;
  email: string | null;
  servico: string | null;
  valor: number | null;
  status: string | null;
  mensagem: string | null;
  created_at: string | null;
};

export default function AjustarOrcamentos() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<Orcamento | null>(null);

  async function buscarOrcamentos() {
    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const { data, error } = await supabase
        .from("orcamentos")
        .select("id, nome, email, servico, valor, status, mensagem, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrcamentos(data || []);
    } catch (error) {
      console.error("Erro ao buscar orçamentos:", error);
      setErro("Não foi possível carregar os orçamentos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    buscarOrcamentos();
  }, []);

  async function atualizarStatus(id: string, novoStatus: string) {
    try {
      setErro("");
      setSucesso("");

      const { error } = await supabase
        .from("orcamentos")
        .update({ status: novoStatus })
        .eq("id", id);

      if (error) throw error;

      setOrcamentos((prev) =>
        prev.map((orc) =>
          orc.id === id ? { ...orc, status: novoStatus } : orc
        )
      );

      setSucesso("Status atualizado com sucesso.");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setErro("Não foi possível atualizar o status do orçamento.");
    }
  }

  async function excluirOrcamento(id: string) {
    const confirmar = window.confirm("Tem certeza que deseja excluir este orçamento?");
    if (!confirmar) return;

    try {
      setErro("");
      setSucesso("");

      const { error } = await supabase
        .from("orcamentos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setOrcamentos((prev) => prev.filter((orc) => orc.id !== id));
      setSucesso("Orçamento excluído com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      setErro("Não foi possível excluir o orçamento.");
    }
  }

  function formatarValor(valor: number | null) {
    if (valor === null || valor === undefined) return "Não informado";

    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data: string | null) {
    if (!data) return "Não informada";

    return new Date(data).toLocaleDateString("pt-BR");
  }

  function classeStatus(status: string | null) {
    const valor = (status || "").toLowerCase();

    if (valor === "aprovado") return "admin-role-badge aprovado";
    if (valor === "recusado") return "admin-role-badge recusado";
    return "admin-role-badge pendente";
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <span className="admin-page-badge">Administração</span>
        <h1 className="admin-page-title">Ajustar Orçamentos</h1>
        <p className="admin-page-subtitle">
          Visualize, atualize e remova orçamentos enviados pelos clientes.
        </p>
      </div>

      <div className="admin-panel">
        {erro && <p className="admin-message-error">{erro}</p>}
        {sucesso && <p className="admin-message-success">{sucesso}</p>}

        {loading ? (
          <p className="admin-message-info">Carregando orçamentos...</p>
        ) : orcamentos.length === 0 ? (
          <p className="admin-message-info">Nenhum orçamento encontrado.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {orcamentos.map((orc) => (
                  <tr key={orc.id}>
                    <td>
                      <div className="admin-user-name">
                        {orc.nome || "Sem nome"}
                      </div>
                      <div className="admin-secondary-text">
                        {orc.email || "Sem email"}
                      </div>
                    </td>

                    <td>{orc.servico || "Não informado"}</td>

                    <td>
                      <div className="admin-money">
                        <DollarSign size={16} />
                        {formatarValor(orc.valor)}
                      </div>
                    </td>

                    <td>
                      <select
                        className={`admin-select ${classeStatus(orc.status)}`}
                        value={orc.status || "Pendente"}
                        onChange={(e) => atualizarStatus(orc.id, e.target.value)}
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Recusado">Recusado</option>
                      </select>
                    </td>

                    <td>{formatarData(orc.created_at)}</td>

                    <td>
                      <div className="admin-actions">
                        <button
                          type="button"
                          className="admin-icon-button view"
                          title="Visualizar"
                          onClick={() => setOrcamentoSelecionado(orc)}
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          type="button"
                          className="admin-icon-button edit"
                          title="Editar status"
                          onClick={() =>
                            atualizarStatus(
                              orc.id,
                              orc.status === "Aprovado" ? "Pendente" : "Aprovado"
                            )
                          }
                        >
                          <Edit size={18} />
                        </button>

                        <button
                          type="button"
                          className="admin-icon-button danger"
                          title="Excluir"
                          onClick={() => excluirOrcamento(orc.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {orcamentoSelecionado && (
        <div
          className="admin-modal-overlay"
          onClick={() => setOrcamentoSelecionado(null)}
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-title">Detalhes do Orçamento</h2>
            <p className="admin-modal-subtitle">
              Visualize as informações enviadas pelo cliente.
            </p>

            <div className="admin-modal-grid">
              <div className="admin-modal-field">
                <span className="admin-modal-label">Cliente</span>
                <div className="admin-modal-value">
                  {orcamentoSelecionado.nome || "Sem nome"}
                </div>
              </div>

              <div className="admin-modal-field">
                <span className="admin-modal-label">Email</span>
                <div className="admin-modal-value">
                  {orcamentoSelecionado.email || "Sem email"}
                </div>
              </div>

              <div className="admin-modal-field">
                <span className="admin-modal-label">Serviço</span>
                <div className="admin-modal-value">
                  {orcamentoSelecionado.servico || "Não informado"}
                </div>
              </div>

              <div className="admin-modal-field">
                <span className="admin-modal-label">Valor</span>
                <div className="admin-modal-value">
                  {formatarValor(orcamentoSelecionado.valor)}
                </div>
              </div>

              <div className="admin-modal-field">
                <span className="admin-modal-label">Status</span>
                <div className="admin-modal-value">
                  {orcamentoSelecionado.status || "Pendente"}
                </div>
              </div>

              <div className="admin-modal-field">
                <span className="admin-modal-label">Data</span>
                <div className="admin-modal-value">
                  {formatarData(orcamentoSelecionado.created_at)}
                </div>
              </div>

              <div className="admin-modal-field full">
                <span className="admin-modal-label">Mensagem</span>
                <div className="admin-modal-value">
                  {orcamentoSelecionado.mensagem || "Sem mensagem"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}