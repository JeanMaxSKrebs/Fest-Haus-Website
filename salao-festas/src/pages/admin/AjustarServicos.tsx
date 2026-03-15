import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Wrench } from "lucide-react";
import { apiFetch } from "../../lib/api";

type TipoServico = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number | null;
  ativo: boolean;
};

const valorInicial = {
  nome: "",
  descricao: "",
  preco: "",
  ativo: true,
};

export default function AjustarServicos() {
  const [servicos, setServicos] = useState<TipoServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(valorInicial);

  useEffect(() => {
    carregarServicos();
  }, []);

  async function carregarServicos() {
    try {
      setLoading(true);
      setErro("");

      const data = await apiFetch("/api/admin/tipos-servico");
      setServicos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Não foi possível carregar os serviços.");
    } finally {
      setLoading(false);
    }
  }

  function abrirNovoServico() {
    setEditandoId(null);
    setForm(valorInicial);
    setModalAberto(true);
  }

  function abrirEditarServico(servico: TipoServico) {
    setEditandoId(servico.id);
    setForm({
      nome: servico.nome ?? "",
      descricao: servico.descricao ?? "",
      preco: servico.preco != null ? String(servico.preco) : "",
      ativo: servico.ativo,
    });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoId(null);
    setForm(valorInicial);
  }

  function atualizarCampo(
    campo: "nome" | "descricao" | "preco" | "ativo",
    valor: string | boolean
  ) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  async function salvarServico(e: React.FormEvent) {
    e.preventDefault();

    if (!form.nome.trim()) {
      setErro("O nome do serviço é obrigatório.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      const body = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        preco: form.preco ? Number(form.preco) : null,
        ativo: form.ativo,
      };

      await apiFetch(
        editandoId
          ? `/api/admin/tipos-servico/${editandoId}`
          : "/api/admin/tipos-servico",
        {
          method: editandoId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      await carregarServicos();
      fecharModal();
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Erro ao salvar serviço.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirServico(id: string) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este serviço?"
    );

    if (!confirmar) return;

    try {
      await apiFetch(`/api/admin/tipos-servico/${id}`, {
        method: "DELETE",
      });

      await carregarServicos();
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Erro ao excluir serviço.");
    }
  }

  function formatarPreco(preco: number | null) {
    if (preco == null) return "Preço sob consulta";

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(preco);
  }

  return (
    <div className="ajustar-servicos">
      <div className="admin-page-header">
        <h1>Ajustar Serviços</h1>
        <p>Gerencie os serviços disponíveis no site.</p>
      </div>

      <div className="ajustar-servicos__topo">
        <button
          type="button"
          className="ajustar-servicos__botao-principal"
          onClick={abrirNovoServico}
        >
          <Plus size={18} />
          Adicionar Novo Serviço
        </button>
      </div>

      {erro && <div className="ajustar-servicos__alerta-erro">{erro}</div>}

      {loading ? (
        <div className="ajustar-servicos__estado">
          Carregando serviços...
        </div>
      ) : servicos.length === 0 ? (
        <div className="ajustar-servicos__estado">
          Nenhum serviço cadastrado.
        </div>
      ) : (
        <div className="ajustar-servicos__grid">
          {servicos.map((servico) => (
            <div key={servico.id} className="ajustar-servicos__card">
              <div className="ajustar-servicos__card-topo">
                <div className="ajustar-servicos__icone">
                  <Wrench size={22} />
                </div>

                <span
                  className={
                    servico.ativo
                      ? "ajustar-servicos__status ajustar-servicos__status--ativo"
                      : "ajustar-servicos__status ajustar-servicos__status--inativo"
                  }
                >
                  {servico.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>

              <h3 className="ajustar-servicos__titulo">{servico.nome}</h3>

              <p className="ajustar-servicos__descricao">
                {servico.descricao || "Sem descrição cadastrada."}
              </p>

              <p className="ajustar-servicos__preco">
                {formatarPreco(servico.preco)}
              </p>

              <div className="ajustar-servicos__acoes">
                <button
                  type="button"
                  className="ajustar-servicos__botao ajustar-servicos__botao--editar"
                  onClick={() => abrirEditarServico(servico)}
                >
                  <Edit size={16} />
                  Editar
                </button>

                <button
                  type="button"
                  className="ajustar-servicos__botao-icon ajustar-servicos__botao-icon--excluir"
                  onClick={() => excluirServico(servico.id)}
                >
                  <Trash2 size={100} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className="ajustar-servicos__modal-overlay" onClick={fecharModal}>
          <div
            className="ajustar-servicos__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ajustar-servicos__modal-header">
              <h2>
                {editandoId ? "Editar Serviço" : "Adicionar Novo Serviço"}
              </h2>

              <button
                type="button"
                className="ajustar-servicos__modal-fechar"
                onClick={fecharModal}
              >
                ×
              </button>
            </div>

            <form className="ajustar-servicos__form" onSubmit={salvarServico}>
              <div className="ajustar-servicos__campo">
                <label>Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => atualizarCampo("nome", e.target.value)}
                  placeholder="Nome do serviço"
                />
              </div>

              <div className="ajustar-servicos__campo">
                <label>Descrição</label>
                <textarea
                  rows={4}
                  value={form.descricao}
                  onChange={(e) => atualizarCampo("descricao", e.target.value)}
                  placeholder="Descrição do serviço"
                />
              </div>

              <div className="ajustar-servicos__campo">
                <label>Preço</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.preco}
                  onChange={(e) => atualizarCampo("preco", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="ajustar-servicos__checkbox">
                <input
                  id="ativo"
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => atualizarCampo("ativo", e.target.checked)}
                />
                <label htmlFor="ativo">Serviço ativo</label>
              </div>

              <div className="ajustar-servicos__form-acoes">
                <button
                  type="button"
                  className="ajustar-servicos__botao-secundario"
                  onClick={fecharModal}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="ajustar-servicos__botao-principal"
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : editandoId
                    ? "Salvar alterações"
                    : "Criar serviço"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}