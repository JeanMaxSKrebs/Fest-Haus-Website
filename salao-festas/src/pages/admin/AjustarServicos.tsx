import { useEffect, useRef, useState } from "react";
import { Plus, Edit, Trash2, Wrench, Image as ImageIcon, Upload } from "lucide-react";
import { apiFetch } from "../../lib/api";

type ServicoImagem = {
  path: string;
  url: string;
};

type TipoServico = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number | null;
  ativo: boolean;
  imagem_principal_url?: string | null;
  imagens_galeria?: ServicoImagem[];
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

  const [imagemPrincipal, setImagemPrincipal] = useState<File | null>(null);
  const [imagensGaleria, setImagensGaleria] = useState<File[]>([]);

  const inputPrincipalRef = useRef<HTMLInputElement | null>(null);
  const inputGaleriaRef = useRef<HTMLInputElement | null>(null);

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
    setImagemPrincipal(null);
    setImagensGaleria([]);

    if (inputPrincipalRef.current) inputPrincipalRef.current.value = "";
    if (inputGaleriaRef.current) inputGaleriaRef.current.value = "";

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

    setImagemPrincipal(null);
    setImagensGaleria([]);

    if (inputPrincipalRef.current) inputPrincipalRef.current.value = "";
    if (inputGaleriaRef.current) inputGaleriaRef.current.value = "";

    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoId(null);
    setForm(valorInicial);
    setImagemPrincipal(null);
    setImagensGaleria([]);

    if (inputPrincipalRef.current) inputPrincipalRef.current.value = "";
    if (inputGaleriaRef.current) inputGaleriaRef.current.value = "";
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

  function selecionarImagemPrincipal(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImagemPrincipal(file);
  }

  function selecionarImagensGaleria(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);

    if (files.length > 5) {
      setErro("Selecione no máximo 5 imagens para a galeria.");
      return;
    }

    setImagensGaleria(files);
  }

  async function uploadImagemPrincipalServico(id: string, arquivo: File) {
    const formData = new FormData();
    formData.append("imagem", arquivo);

    await apiFetch(`/api/admin/tipos-servico/${id}/imagem-principal`, {
      method: "POST",
      body: formData,
    });
  }

  async function uploadImagensGaleriaServico(id: string, arquivos: File[]) {
    if (!arquivos.length) return;

    const formData = new FormData();

    arquivos.forEach((arquivo) => {
      formData.append("imagens", arquivo);
    });

    await apiFetch(`/api/admin/tipos-servico/${id}/imagens`, {
      method: "POST",
      body: formData,
    });
  }

  async function salvarServico(e: React.FormEvent) {
    e.preventDefault();

    if (!form.nome.trim()) {
      setErro("O nome do serviço é obrigatório.");
      return;
    }

    if (imagensGaleria.length > 5) {
      setErro("A galeria do serviço pode ter no máximo 5 imagens.");
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

      let servicoSalvo: TipoServico;

      if (editandoId) {
        servicoSalvo = await apiFetch(`/api/admin/tipos-servico/${editandoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        servicoSalvo = await apiFetch("/api/admin/tipos-servico", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      const servicoId = editandoId || servicoSalvo.id;

      if (imagemPrincipal) {
        await uploadImagemPrincipalServico(servicoId, imagemPrincipal);
      }

      if (imagensGaleria.length) {
        await uploadImagensGaleriaServico(servicoId, imagensGaleria);
      }

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

  async function excluirImagemServico(servicoId: string, path: string) {
    const confirmar = window.confirm(
      "Tem certeza que deseja remover esta imagem do serviço?"
    );

    if (!confirmar) return;

    try {
      await apiFetch(
        `/api/admin/tipos-servico/${servicoId}/imagens/${encodeURIComponent(path)}`,
        {
          method: "DELETE",
        }
      );

      await carregarServicos();
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Erro ao remover imagem.");
    }
  }

  function formatarPreco(preco: number | null) {
    if (preco == null) return "Preço sob consulta";

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(preco);
  }

  function getServicoEditando() {
    return servicos.find((servico) => servico.id === editandoId) || null;
  }

  const servicoEditando = getServicoEditando();

  return (
    <div className="ajustar-servicos">
      <div className="admin-page-header">
        <h1>Ajustar Serviços</h1>
        <p>Gerencie os serviços disponíveis no site e as imagens do bucket.</p>
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

              <div className="ajustar-servicos__thumb-principal">
                {servico.imagem_principal_url ? (
                  <img
                    src={servico.imagem_principal_url}
                    alt={servico.nome}
                    className="ajustar-servicos__thumb-principal-img"
                  />
                ) : (
                  <div className="ajustar-servicos__thumb-placeholder">
                    <ImageIcon size={34} />
                  </div>
                )}
              </div>

              <h3 className="ajustar-servicos__titulo">{servico.nome}</h3>

              <p className="ajustar-servicos__descricao">
                {servico.descricao || "Sem descrição cadastrada."}
              </p>

              <p className="ajustar-servicos__preco">
                {formatarPreco(servico.preco)}
              </p>

              <div className="ajustar-servicos__meta-imagens">
                <span>
                  Principal: {servico.imagem_principal_url ? "Sim" : "Não"}
                </span>
                <span>
                  Galeria: {servico.imagens_galeria?.length || 0}/5
                </span>
              </div>

              {!!servico.imagens_galeria?.length && (
                <div className="ajustar-servicos__miniaturas">
                  {servico.imagens_galeria.slice(0, 5).map((imagem) => (
                    <img
                      key={imagem.path}
                      src={imagem.url}
                      alt={servico.nome}
                      className="ajustar-servicos__miniatura"
                    />
                  ))}
                </div>
              )}

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
                  title="Excluir serviço"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className="ajustar-servicos__modal-overlay" onClick={fecharModal}>
          <div
            className="ajustar-servicos__modal ajustar-servicos__modal--grande"
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

              <div className="ajustar-servicos__bloco-upload">
                <h3>Imagem principal</h3>

                {servicoEditando?.imagem_principal_url && (
                  <div className="ajustar-servicos__preview-principal">
                    <img
                      src={servicoEditando.imagem_principal_url}
                      alt={servicoEditando.nome}
                      className="ajustar-servicos__preview-principal-img"
                    />
                  </div>
                )}

                <div className="ajustar-servicos__campo">
                  <label>Selecionar imagem principal</label>
                  <input
                    ref={inputPrincipalRef}
                    type="file"
                    accept="image/*"
                    onChange={selecionarImagemPrincipal}
                  />
                </div>

                <div className="ajustar-servicos__upload-info">
                  <Upload size={16} />
                  <span>
                    {imagemPrincipal
                      ? `Arquivo selecionado: ${imagemPrincipal.name}`
                      : "Selecione uma nova imagem principal, se desejar"}
                  </span>
                </div>
              </div>

              <div className="ajustar-servicos__bloco-upload">
                <h3>Galeria do serviço</h3>

                {!!servicoEditando?.imagens_galeria?.length && (
                  <div className="ajustar-servicos__galeria-existente">
                    {servicoEditando.imagens_galeria.map((imagem) => (
                      <div
                        key={imagem.path}
                        className="ajustar-servicos__galeria-item"
                      >
                        <img
                          src={imagem.url}
                          alt={servicoEditando.nome}
                          className="ajustar-servicos__galeria-item-img"
                        />

                        <button
                          type="button"
                          className="ajustar-servicos__remover-imagem"
                          onClick={() =>
                            excluirImagemServico(servicoEditando.id, imagem.path)
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="ajustar-servicos__campo">
                  <label>Adicionar até 5 imagens da galeria</label>
                  <input
                    ref={inputGaleriaRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={selecionarImagensGaleria}
                  />
                </div>

                <div className="ajustar-servicos__upload-info">
                  <Upload size={16} />
                  <span>
                    {imagensGaleria.length
                      ? `${imagensGaleria.length} imagem(ns) selecionada(s)`
                      : "Selecione até 5 imagens para a galeria do serviço"}
                  </span>
                </div>
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