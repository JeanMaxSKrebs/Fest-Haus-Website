import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { apiFetch } from "../../../lib/api";

type TipoServico = {
  id: string;
  nome: string;
};

type ModeloOrcamento = {
  id: string;
  nome: string;
  tipos_servico: TipoServico | null;
};

type ItemModelo = {
  id: string;
  nome: string;
  descricao: string | null;
  valor: number | null;
  ordem: number;
};

export default function ItensModeloOrcamento() {
  const [modelos, setModelos] = useState<ModeloOrcamento[]>([]);
  const [modeloSelecionado, setModeloSelecionado] = useState("");
  const [itens, setItens] = useState<ItemModelo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    valor: "",
    ordem: "0",
  });

  async function buscarModelos() {
    try {
      const data = await apiFetch("/api/modelos-orcamento");
      setModelos(data);
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Não foi possível carregar os modelos.");
    }
  }

  async function buscarItens(modeloId: string) {
    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const data = await apiFetch(`/api/modelos-orcamento/${modeloId}/itens`);
      setItens(data);
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Não foi possível carregar os itens.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    buscarModelos();
  }, []);

  useEffect(() => {
    if (modeloSelecionado) {
      buscarItens(modeloSelecionado);
    } else {
      setItens([]);
      setLoading(false);
    }
  }, [modeloSelecionado]);

  async function criarItem() {
    try {
      if (!modeloSelecionado) {
        setErro("Selecione um modelo.");
        return;
      }

      if (!form.nome.trim()) {
        setErro("Nome do item é obrigatório.");
        return;
      }

      setErro("");
      setSucesso("");

      await apiFetch(`/api/modelos-orcamento/${modeloSelecionado}/itens`, {
        method: "POST",
        body: JSON.stringify({
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || null,
          valor: form.valor ? Number(form.valor) : null,
          ordem: Number(form.ordem || 0),
        }),
      });

      setForm({
        nome: "",
        descricao: "",
        valor: "",
        ordem: "0",
      });

      setSucesso("Item criado com sucesso.");
      await buscarItens(modeloSelecionado);
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Não foi possível criar o item.");
    }
  }

  async function excluirItem(id: string) {
    const confirmar = window.confirm("Deseja excluir este item?");
    if (!confirmar) return;

    try {
      setErro("");
      setSucesso("");

      await apiFetch(`/api/itens-modelo-orcamento/${id}`, {
        method: "DELETE",
      });

      setItens((prev) => prev.filter((item) => item.id !== id));
      setSucesso("Item excluído com sucesso.");
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Não foi possível excluir o item.");
    }
  }

  async function moverItem(item: ItemModelo, novaOrdem: number) {
    try {
      setErro("");
      setSucesso("");

      await apiFetch(`/api/itens-modelo-orcamento/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({
          nome: item.nome,
          descricao: item.descricao,
          valor: item.valor,
          ordem: novaOrdem,
        }),
      });

      if (modeloSelecionado) {
        await buscarItens(modeloSelecionado);
      }

      setSucesso("Ordem do item atualizada.");
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Não foi possível atualizar a ordem.");
    }
  }

  function formatarValor(valor: number | null) {
    if (valor === null || valor === undefined) return "Não informado";

    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <span className="admin-page-badge">Orçamentos</span>
        <h1 className="admin-page-title">Itens do Modelo</h1>
        <p className="admin-page-subtitle">
          Escolha um modelo e gerencie seus itens internos.
        </p>
      </div>

      <div className="admin-panel">
        <div className="admin-modal-grid">
          <div className="admin-modal-field full">
            <label className="admin-modal-label">Modelo de Orçamento</label>
            <select
              className="admin-input"
              value={modeloSelecionado}
              onChange={(e) => setModeloSelecionado(e.target.value)}
            >
              <option value="">Selecione um modelo</option>
              {modelos.map((modelo) => (
                <option key={modelo.id} value={modelo.id}>
                  {modelo.nome} - {modelo.tipos_servico?.nome || "Sem tipo"}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-modal-field">
            <label className="admin-modal-label">Nome do Item</label>
            <input
              className="admin-input"
              value={form.nome}
              onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
            />
          </div>

          <div className="admin-modal-field">
            <label className="admin-modal-label">Valor</label>
            <input
              className="admin-input"
              type="number"
              value={form.valor}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, valor: e.target.value }))
              }
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
            />
          </div>

          <div className="admin-modal-field">
            <label className="admin-modal-label">Ordem</label>
            <input
              className="admin-input"
              type="number"
              value={form.ordem}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, ordem: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="admin-panel-top">
          <button
            type="button"
            className="admin-primary-button"
            onClick={criarItem}
          >
            <Plus size={18} />
            <span>Adicionar Item</span>
          </button>
        </div>

        {erro && <p className="admin-message-error">{erro}</p>}
        {sucesso && <p className="admin-message-success">{sucesso}</p>}

        {!modeloSelecionado ? (
          <p className="admin-message-info">Selecione um modelo para ver os itens.</p>
        ) : loading ? (
          <p className="admin-message-info">Carregando itens...</p>
        ) : itens.length === 0 ? (
          <p className="admin-message-info">Nenhum item encontrado.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ordem</th>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {itens.map((item) => (
                  <tr key={item.id}>
                    <td>{item.ordem}</td>
                    <td>{item.nome}</td>
                    <td>{item.descricao || "Sem descrição"}</td>
                    <td>{formatarValor(item.valor)}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          type="button"
                          className="admin-icon-button edit"
                          title="Subir"
                          onClick={() => moverItem(item, Math.max(0, item.ordem - 1))}
                        >
                          <Pencil className="admin-icon-svg" />
                        </button>

                        <button
                          type="button"
                          className="admin-icon-button danger"
                          title="Excluir"
                          onClick={() => excluirItem(item.id)}
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
    </section>
  );
}