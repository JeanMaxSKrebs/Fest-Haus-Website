import { useEffect, useState } from "react";
import { Eye, CheckCircle, FilePlus2 } from "lucide-react";
import { apiFetch } from "../../../lib/api";

type TipoServico = {
  id: string;
  nome: string;
};

type Usuario = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
};

type SolicitacaoOrcamento = {
  id: string;
  titulo: string | null;
  descricao: string;
  status: string;
  aprovado_para_modelo: boolean;
  created_at: string;
  tipos_servico: TipoServico | null;
  usuarios: Usuario | null;
};

export default function SolicitacoesOrcamento() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoOrcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [selecionada, setSelecionada] = useState<SolicitacaoOrcamento | null>(
    null
  );

  async function buscarSolicitacoes() {
    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const data = await apiFetch("/api/solicitacoes-orcamento");
      setSolicitacoes(data);
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Não foi possível carregar as solicitações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    buscarSolicitacoes();
  }, []);

  async function atualizarStatus(id: string, status: string) {
    try {
      setErro("");
      setSucesso("");

      const atualizada = await apiFetch(`/api/solicitacoes-orcamento/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });

      setSolicitacoes((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...atualizada } : item))
      );

      setSucesso("Status atualizado com sucesso.");
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Não foi possível atualizar o status.");
    }
  }

  async function converterEmModelo(item: SolicitacaoOrcamento) {
    try {
      setErro("");
      setSucesso("");

      await apiFetch(`/api/solicitacoes-orcamento/${item.id}/converter-em-modelo`, {
        method: "POST",
        body: JSON.stringify({
          nome: item.titulo?.trim()
            ? item.titulo
            : `Orçamento ${item.tipos_servico?.nome || "Serviço"} - Opção`,
          descricao: item.descricao,
          valor_base: null,
        }),
      });

      await buscarSolicitacoes();
      setSucesso("Solicitação convertida em modelo com sucesso.");
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Não foi possível converter em modelo.");
    }
  }

  function classeStatus(status: string) {
    const valor = status?.toLowerCase();

    if (valor === "aprovada") return "admin-role-badge aprovado";
    if (valor === "rejeitada") return "admin-role-badge recusado";
    if (valor === "convertida_modelo") return "admin-role-badge aprovado";
    return "admin-role-badge pendente";
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString("pt-BR");
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <span className="admin-page-badge">Orçamentos</span>
        <h1 className="admin-page-title">Solicitações dos Clientes</h1>
        <p className="admin-page-subtitle">
          Analise pedidos, altere status e aproveite boas solicitações como base
          para modelos futuros.
        </p>
      </div>

      <div className="admin-panel">
        {erro && <p className="admin-message-error">{erro}</p>}
        {sucesso && <p className="admin-message-success">{sucesso}</p>}

        {loading ? (
          <p className="admin-message-info">Carregando solicitações...</p>
        ) : solicitacoes.length === 0 ? (
          <p className="admin-message-info">Nenhuma solicitação encontrada.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Tipo de Serviço</th>
                  <th>Título</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {solicitacoes.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="admin-user-name">
                        {item.usuarios?.nome || "Sem nome"}
                      </div>
                      <div className="admin-secondary-text">
                        {item.usuarios?.email || "Sem email"}
                      </div>
                    </td>

                    <td>{item.tipos_servico?.nome || "Não informado"}</td>

                    <td>{item.titulo || "Sem título"}</td>

                    <td>
                      <select
                        className={`admin-select ${classeStatus(item.status)}`}
                        value={item.status}
                        onChange={(e) => atualizarStatus(item.id, e.target.value)}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="em_analise">Em análise</option>
                        <option value="aprovada">Aprovada</option>
                        <option value="rejeitada">Rejeitada</option>
                        <option value="convertida_modelo">Convertida em modelo</option>
                      </select>
                    </td>

                    <td>{formatarData(item.created_at)}</td>

                    <td>
                      <div className="admin-actions">
                        <button
                          type="button"
                          className="admin-icon-button view"
                          title="Visualizar"
                          onClick={() => setSelecionada(item)}
                        >
                          <Eye className="admin-icon-svg" />
                        </button>

                        <button
                          type="button"
                          className="admin-icon-button edit"
                          title="Aprovar"
                          onClick={() => atualizarStatus(item.id, "aprovada")}
                        >
                          <CheckCircle className="admin-icon-svg" />
                        </button>

                        <button
                          type="button"
                          className="admin-icon-button edit"
                          title="Converter em modelo"
                          onClick={() => converterEmModelo(item)}
                        >
                          <FilePlus2 className="admin-icon-svg" />
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

      {selecionada && (
        <div className="admin-modal-overlay" onClick={() => setSelecionada(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-title">Detalhes da Solicitação</h2>
            <p className="admin-modal-subtitle">
              Informações enviadas pelo cliente.
            </p>

            <div className="admin-modal-grid">
              <div className="admin-modal-field">
                <span className="admin-modal-label">Cliente</span>
                <div className="admin-modal-value">
                  {selecionada.usuarios?.nome || "Sem nome"}
                </div>
              </div>

              <div className="admin-modal-field">
                <span className="admin-modal-label">Email</span>
                <div className="admin-modal-value">
                  {selecionada.usuarios?.email || "Sem email"}
                </div>
              </div>

              <div className="admin-modal-field">
                <span className="admin-modal-label">Telefone</span>
                <div className="admin-modal-value">
                  {selecionada.usuarios?.telefone || "Sem telefone"}
                </div>
              </div>

              <div className="admin-modal-field">
                <span className="admin-modal-label">Tipo de Serviço</span>
                <div className="admin-modal-value">
                  {selecionada.tipos_servico?.nome || "Não informado"}
                </div>
              </div>

              <div className="admin-modal-field full">
                <span className="admin-modal-label">Título</span>
                <div className="admin-modal-value">
                  {selecionada.titulo || "Sem título"}
                </div>
              </div>

              <div className="admin-modal-field full">
                <span className="admin-modal-label">Descrição</span>
                <div className="admin-modal-value">
                  {selecionada.descricao || "Sem descrição"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}