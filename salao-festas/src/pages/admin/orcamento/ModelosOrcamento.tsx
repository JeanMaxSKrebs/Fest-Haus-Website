import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Trash2, Plus, Power } from "lucide-react";
import { apiFetch } from "../../../lib/api";

type TipoServico = {
  id: string;
  nome: string;
};

type ModeloOrcamento = {
  id: string;
  nome: string;
  descricao: string | null;
  valor_base: number | null;
  ativo: boolean;
  created_at: string;
  tipos_servico: TipoServico | null;
};

type ItemModelo = {
  id: string;
  nome: string;
  descricao: string | null;
  valor: number | null;
  ordem: number;
};

export default function ModelosOrcamento() {
  const [modelos, setModelos] = useState<ModeloOrcamento[]>([]);
  const [tiposServico, setTiposServico] = useState<TipoServico[]>([]);
  const [itensPorModelo, setItensPorModelo] = useState<Record<string, ItemModelo[]>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [selecionado, setSelecionado] = useState<ModeloOrcamento | null>(null);
  const [itensSelecionado, setItensSelecionado] = useState<ItemModelo[]>([]);
  const [editando, setEditando] = useState<ModeloOrcamento | null>(null);

  const [filtroTipoServico, setFiltroTipoServico] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const [form, setForm] = useState({
    tipo_servico_id: "",
    nome: "",
    descricao: "",
    valor_base: "",
  });

  const [formEdicao, setFormEdicao] = useState({
    tipo_servico_id: "",
    nome: "",
    descricao: "",
    valor_base: "",
    ativo: true,
  });

  async function buscarDados() {
    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const [modelosData, tiposData] = await Promise.all([
        apiFetch("/api/modelos-orcamento"),
        apiFetch("/api/tipos-servico"),
      ]);

      setModelos(modelosData);
      setTiposServico(tiposData);

      const itensEntries = await Promise.all(
        modelosData.map(async (modelo: ModeloOrcamento) => {
          const itens = await apiFetch(`/api/modelos-orcamento/${modelo.id}/itens`);
          return [modelo.id, itens] as const;
        })
      );

      setItensPorModelo(Object.fromEntries(itensEntries));
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Não foi possível carregar os modelos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    buscarDados();
  }, []);

  useEffect(() => {
    const modalAberto = !!selecionado || !!editando;

    if (modalAberto) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [selecionado, editando]);

  const modelosFiltrados = useMemo(() => {
    return modelos.filter((modelo) => {
      const passouTipo =
        !filtroTipoServico || modelo.tipos_servico?.id === filtroTipoServico;

      const passouStatus =
        !filtroStatus ||
        (filtroStatus === "ativo" && modelo.ativo) ||
        (filtroStatus === "inativo" && !modelo.ativo);

      return passouTipo && passouStatus;
    });
  }, [modelos, filtroTipoServico, filtroStatus]);

  async function criarModelo() {
    try {
      if (!form.tipo_servico_id || !form.nome.trim()) {
        setErro("Tipo de serviço e nome são obrigatórios.");
        return;
      }

      setErro("");
      setSucesso("");

      await apiFetch("/api/modelos-orcamento", {
        method: "POST",
        body: JSON.stringify({
          tipo_servico_id: form.tipo_servico_id,
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || null,
          valor_base: form.valor_base ? Number(form.valor_base) : null,
        }),
      });

      setForm({
        tipo_servico_id: "",
        nome: "",
        descricao: "",
        valor_base: "",
      });

      setSucesso("Modelo criado com sucesso.");
      await buscarDados();
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Não foi possível criar o modelo.");
    }
  }

  async function alternarAtivo(modelo: ModeloOrcamento) {
    try {
      setErro("");
      setSucesso("");

      const atualizado = await apiFetch(`/api/modelos-orcamento/${modelo.id}`, {
        method: "PUT",
        body: JSON.stringify({
          nome: modelo.nome,
          descricao: modelo.descricao,
          valor_base: modelo.valor_base,
          ativo: !modelo.ativo,
          tipo_servico_id: modelo.tipos_servico?.id,
        }),
      });

      setModelos((prev) =>
        prev.map((item) => (item.id === modelo.id ? { ...item, ...atualizado } : item))
      );

      setSucesso("Status do modelo atualizado com sucesso.");
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Não foi possível atualizar o status do modelo.");
    }
  }

  async function excluirModelo(id: string) {
    const confirmar = window.confirm("Deseja excluir este modelo?");
    if (!confirmar) return;

    try {
      setErro("");
      setSucesso("");

      await apiFetch(`/api/modelos-orcamento/${id}`, {
        method: "DELETE",
      });

      setModelos((prev) => prev.filter((item) => item.id !== id));

      setItensPorModelo((prev) => {
        const novo = { ...prev };
        delete novo[id];
        return novo;
      });

      setSucesso("Modelo excluído com sucesso.");
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Não foi possível excluir o modelo.");
    }
  }

  async function abrirVisualizacao(modelo: ModeloOrcamento) {
    try {
      setErro("");

      const itens = await apiFetch(`/api/modelos-orcamento/${modelo.id}/itens`);
      setSelecionado(modelo);
      setItensSelecionado(itens);
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Não foi possível carregar os itens do modelo.");
    }
  }

  function abrirEdicao(modelo: ModeloOrcamento) {
    setEditando(modelo);
    setFormEdicao({
      tipo_servico_id: modelo.tipos_servico?.id || "",
      nome: modelo.nome || "",
      descricao: modelo.descricao || "",
      valor_base:
        modelo.valor_base !== null && modelo.valor_base !== undefined
          ? String(modelo.valor_base)
          : "",
      ativo: modelo.ativo,
    });
  }

  async function salvarEdicao() {
    if (!editando) return;

    try {
      if (!formEdicao.tipo_servico_id || !formEdicao.nome.trim()) {
        setErro("Tipo de serviço e nome são obrigatórios.");
        return;
      }

      setErro("");
      setSucesso("");

      await apiFetch(`/api/modelos-orcamento/${editando.id}`, {
        method: "PUT",
        body: JSON.stringify({
          tipo_servico_id: formEdicao.tipo_servico_id,
          nome: formEdicao.nome.trim(),
          descricao: formEdicao.descricao.trim() || null,
          valor_base: formEdicao.valor_base ? Number(formEdicao.valor_base) : null,
          ativo: formEdicao.ativo,
        }),
      });

      setEditando(null);
      setSucesso("Modelo atualizado com sucesso.");
      await buscarDados();
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Não foi possível salvar as alterações.");
    }
  }

  function formatarValor(valor: number | null) {
    if (valor === null || valor === undefined) return "Não informado";

    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function calcularValorItens(modeloId: string) {
    const itens = itensPorModelo[modeloId] || [];
    return itens.reduce((total, item) => total + (item.valor || 0), 0);
  }

  function calcularValorTotal(modeloId: string, valorBase: number | null) {
    return (valorBase || 0) + calcularValorItens(modeloId);
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <span className="admin-page-badge">Orçamentos</span>
        <h1 className="admin-page-title">Modelos Pré-prontos</h1>
        <p className="admin-page-subtitle">
          Crie e organize modelos reutilizáveis por tipo de serviço.
        </p>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-top">
          <div className="admin-modal-grid">
            <div className="admin-modal-field">
              <label className="admin-modal-label">Tipo de Serviço</label>
              <select
                className="admin-input"
                value={form.tipo_servico_id}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tipo_servico_id: e.target.value }))
                }
              >
                <option value="">Selecione</option>
                {tiposServico.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-modal-field">
              <label className="admin-modal-label">Nome do Modelo</label>
              <input
                className="admin-input"
                value={form.nome}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nome: e.target.value }))
                }
                placeholder="Ex: Orçamento Casamentos - Opção 1"
              />
            </div>

            <div className="admin-modal-field full">
              <label className="admin-modal-label">Descrição</label>
              <textarea
                className="admin-input"
                value={form.descricao}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, descricao: e.target.value }))
                }
                placeholder="Descreva o modelo"
              />
            </div>

            <div className="admin-modal-field">
              <label className="admin-modal-label">Valor Base</label>
              <input
                className="admin-input"
                type="number"
                value={form.valor_base}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, valor_base: e.target.value }))
                }
                placeholder="0,00"
              />
            </div>
          </div>

          <button
            type="button"
            className="admin-primary-button"
            onClick={criarModelo}
          >
            <Plus size={18} />
            <span>Criar Modelo</span>
          </button>
        </div>

        <div className="admin-filters-row">
          <div className="admin-filter-group">
            <label className="admin-modal-label">Filtrar por tipo de serviço</label>
            <select
              className="admin-input"
              value={filtroTipoServico}
              onChange={(e) => setFiltroTipoServico(e.target.value)}
            >
              <option value="">Todos</option>
              {tiposServico.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter-group">
            <label className="admin-modal-label">Filtrar por status</label>
            <select
              className="admin-input"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>

        {erro && <p className="admin-message-error">{erro}</p>}
        {sucesso && <p className="admin-message-success">{sucesso}</p>}

        {loading ? (
          <p className="admin-message-info">Carregando modelos...</p>
        ) : modelosFiltrados.length === 0 ? (
          <p className="admin-message-info">Nenhum modelo encontrado.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo de Serviço</th>
                  <th>Valor Base</th>
                  <th>Valor Itens</th>
                  <th>Valor Total</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {modelosFiltrados.map((modelo) => (
                  <tr key={modelo.id}>
                    <td>
                      <div className="admin-user-name">{modelo.nome}</div>
                      <div className="admin-secondary-text">
                        {modelo.descricao || "Sem descrição"}
                      </div>
                    </td>

                    <td>{modelo.tipos_servico?.nome || "Não informado"}</td>

                    <td>{formatarValor(modelo.valor_base)}</td>

                    <td>{formatarValor(calcularValorItens(modelo.id))}</td>

                    <td>{formatarValor(calcularValorTotal(modelo.id, modelo.valor_base))}</td>

                    <td>
                      <span
                        className={`admin-role-badge ${
                          modelo.ativo ? "aprovado" : "recusado"
                        }`}
                      >
                        {modelo.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-actions">
                        <button
                          type="button"
                          className="admin-icon-button view"
                          title="Visualizar com itens"
                          onClick={() => abrirVisualizacao(modelo)}
                        >
                          <Eye className="admin-icon-svg" />
                        </button>

                        <button
                          type="button"
                          className="admin-icon-button edit"
                          title="Ativar / Inativar"
                          onClick={() => alternarAtivo(modelo)}
                        >
                          <Power className="admin-icon-svg" />
                        </button>

                        <button
                          type="button"
                          className="admin-icon-button edit"
                          title="Editar modelo"
                          onClick={() => abrirEdicao(modelo)}
                        >
                          <Pencil className="admin-icon-svg" />
                        </button>

                        <button
                          type="button"
                          className="admin-icon-button danger"
                          title="Excluir"
                          onClick={() => excluirModelo(modelo.id)}
                        >
                          <Trash2 className="admin-icon-svg" />
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

      {selecionado && (
        <div className="admin-modal-overlay" onClick={() => setSelecionado(null)}>
          <div className="admin-modal admin-modal-scrollable" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-title">Detalhes do Modelo</h2>
            <p className="admin-modal-subtitle">
              Informações do modelo de orçamento e seus itens.
            </p>

            <div className="admin-modal-grid">
              <div className="admin-modal-field">
                <span className="admin-modal-label">Nome</span>
                <div className="admin-modal-value">{selecionado.nome}</div>
              </div>

              <div className="admin-modal-field">
                <span className="admin-modal-label">Tipo de Serviço</span>
                <div className="admin-modal-value">
                  {selecionado.tipos_servico?.nome || "Não informado"}
                </div>
              </div>

              <div className="admin-modal-field">
                <span className="admin-modal-label">Valor Base</span>
                <div className="admin-modal-value">
                  {formatarValor(selecionado.valor_base)}
                </div>
              </div>

              <div className="admin-modal-field">
                <span className="admin-modal-label">Valor Total</span>
                <div className="admin-modal-value">
                  {formatarValor(
                    calcularValorTotal(selecionado.id, selecionado.valor_base)
                  )}
                </div>
              </div>

              <div className="admin-modal-field">
                <span className="admin-modal-label">Status</span>
                <div className="admin-modal-value">
                  {selecionado.ativo ? "Ativo" : "Inativo"}
                </div>
              </div>

              <div className="admin-modal-field full">
                <span className="admin-modal-label">Descrição</span>
                <div className="admin-modal-value">
                  {selecionado.descricao || "Sem descrição"}
                </div>
              </div>

              <div className="admin-modal-field full">
                <span className="admin-modal-label">Itens do Modelo</span>
                <div className="admin-modal-value">
                  {itensSelecionado.length === 0 ? (
                    "Nenhum item cadastrado."
                  ) : (
                    <div className="admin-items-list">
                      {itensSelecionado
                        .sort((a, b) => a.ordem - b.ordem)
                        .map((item) => (
                          <div key={item.id} className="admin-item-row">
                            <div className="admin-item-row-top">
                              <span className="admin-item-order">#{item.ordem}</span>
                              <strong>{item.nome}</strong>
                              <span className="admin-item-price">
                                {formatarValor(item.valor)}
                              </span>
                            </div>
                            <div className="admin-secondary-text">
                              {item.descricao || "Sem descrição"}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editando && (
        <div className="admin-modal-overlay" onClick={() => setEditando(null)}>
          <div className="admin-modal admin-modal-scrollable" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-title">Editar Modelo</h2>
            <p className="admin-modal-subtitle">
              Atualize os dados do modelo de orçamento.
            </p>

            <div className="admin-modal-grid">
              <div className="admin-modal-field">
                <label className="admin-modal-label">Tipo de Serviço</label>
                <select
                  className="admin-input"
                  value={formEdicao.tipo_servico_id}
                  onChange={(e) =>
                    setFormEdicao((prev) => ({
                      ...prev,
                      tipo_servico_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Selecione</option>
                  {tiposServico.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-modal-field">
                <label className="admin-modal-label">Nome do Modelo</label>
                <input
                  className="admin-input"
                  value={formEdicao.nome}
                  onChange={(e) =>
                    setFormEdicao((prev) => ({ ...prev, nome: e.target.value }))
                  }
                />
              </div>

              <div className="admin-modal-field full">
                <label className="admin-modal-label">Descrição</label>
                <textarea
                  className="admin-input"
                  value={formEdicao.descricao}
                  onChange={(e) =>
                    setFormEdicao((prev) => ({
                      ...prev,
                      descricao: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="admin-modal-field">
                <label className="admin-modal-label">Valor Base</label>
                <input
                  className="admin-input"
                  type="number"
                  value={formEdicao.valor_base}
                  onChange={(e) =>
                    setFormEdicao((prev) => ({
                      ...prev,
                      valor_base: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="admin-modal-field">
                <label className="admin-modal-label">Status</label>
                <select
                  className="admin-input"
                  value={formEdicao.ativo ? "ativo" : "inativo"}
                  onChange={(e) =>
                    setFormEdicao((prev) => ({
                      ...prev,
                      ativo: e.target.value === "ativo",
                    }))
                  }
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div className="admin-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="admin-primary-button"
                onClick={salvarEdicao}
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}