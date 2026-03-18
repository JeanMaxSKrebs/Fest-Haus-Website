import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Image as ImageIcon, Upload } from "lucide-react";
import { apiFetch } from "../../lib/api";

type ImagemGaleria = {
  id: string;
  path: string;
  titulo: string;
  categoria: string;
  url: string;
  created_at?: string | null;
};

type TipoServico = {
  id: string;
  nome: string;
};

const valorInicial = {
  titulo: "",
  categoria: "",
};

function ehArquivoHeic(file: File) {
  const nome = file.name.toLowerCase();

  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    nome.endsWith(".heic") ||
    nome.endsWith(".heif")
  );
}

export default function AjustarGaleria() {
  const [imagens, setImagens] = useState<ImagemGaleria[]>([]);
  const [servicos, setServicos] = useState<TipoServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(valorInicial);
  const [arquivo, setArquivo] = useState<File | null>(null);

  const inputArquivoRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const [galeriaData, servicosData] = await Promise.all([
        apiFetch("/api/admin/galeria"),
        apiFetch("/api/tipos-servico"),
      ]);

      setImagens(Array.isArray(galeriaData) ? galeriaData : []);
      setServicos(Array.isArray(servicosData) ? servicosData : []);
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Não foi possível carregar a galeria.");
    } finally {
      setLoading(false);
    }
  }

  async function carregarImagens() {
    try {
      setLoading(true);
      setErro("");

      const data = await apiFetch("/api/admin/galeria");
      setImagens(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Não foi possível carregar a galeria.");
    } finally {
      setLoading(false);
    }
  }

  function abrirNovaImagem() {
    setForm(valorInicial);
    setArquivo(null);
    setErro("");

    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = "";
    }

    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setForm(valorInicial);
    setArquivo(null);
    setErro("");

    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = "";
    }
  }

  function atualizarCampo(campo: "titulo" | "categoria", valor: string) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function selecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setErro("");
    setArquivo(file);
  }

  async function salvarImagem(e: React.FormEvent) {
    e.preventDefault();

    if (!arquivo) {
      setErro("Selecione uma imagem para enviar.");
      return;
    }

    if (!form.categoria.trim()) {
      setErro("Selecione uma categoria.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      const formData = new FormData();
      formData.append("imagem", arquivo, arquivo.name);
      formData.append("titulo", form.titulo.trim());
      formData.append("categoria", form.categoria.trim());

      await apiFetch("/api/admin/galeria", {
        method: "POST",
        body: formData,
      });

      await carregarImagens();
      fecharModal();
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Erro ao enviar imagem.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirImagem(path: string) {
    const confirmar = window.confirm(
      "Tem certeza que deseja remover esta imagem?"
    );

    if (!confirmar) return;

    try {
      await apiFetch(`/api/admin/galeria/${encodeURIComponent(path)}`, {
        method: "DELETE",
      });

      await carregarImagens();
    } catch (error: any) {
      console.error(error);
      setErro(error.message || "Erro ao remover imagem.");
    }
  }

  return (
    <div className="ajustar-galeria">
      <div className="admin-page-header">
        <h1>Ajustar Galeria</h1>
        <p>Gerencie as imagens salvas no bucket da galeria.</p>
      </div>

      <div className="ajustar-galeria__topo">
        <button
          type="button"
          className="ajustar-galeria__botao-principal"
          onClick={abrirNovaImagem}
        >
          <Plus size={18} />
          Adicionar Nova Imagem
        </button>
      </div>

      {erro && <div className="ajustar-galeria__alerta-erro">{erro}</div>}

      {loading ? (
        <div className="ajustar-galeria__estado">Carregando galeria...</div>
      ) : imagens.length === 0 ? (
        <div className="ajustar-galeria__estado">
          Nenhuma imagem cadastrada.
        </div>
      ) : (
        <div className="ajustar-galeria__grid">
          {imagens.map((imagem) => (
            <div key={imagem.id} className="ajustar-galeria__card">
              <div className="ajustar-galeria__imagem-box">
                <img
                  src={imagem.url}
                  alt={imagem.titulo}
                  className="ajustar-galeria__imagem"
                />
              </div>

              <div className="ajustar-galeria__conteudo">
                <div className="ajustar-galeria__card-topo">
                  <h3 className="ajustar-galeria__titulo">{imagem.titulo}</h3>

                  <span className="ajustar-galeria__categoria">
                    {imagem.categoria || "geral"}
                  </span>
                </div>

                <button
                  type="button"
                  className="ajustar-galeria__botao-remover"
                  onClick={() => excluirImagem(imagem.path)}
                >
                  <Trash2 size={18} />
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ajustar-galeria__placeholder">
        <div
          className="ajustar-galeria__placeholder-box"
          onClick={abrirNovaImagem}
        >
          <ImageIcon size={42} />
          <p>Clique para adicionar imagens</p>
          <span>As imagens serão enviadas para o bucket do Supabase</span>
        </div>
      </div>

      {modalAberto && (
        <div className="ajustar-galeria__modal-overlay" onClick={fecharModal}>
          <div
            className="ajustar-galeria__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ajustar-galeria__modal-header">
              <h2>Adicionar Nova Imagem</h2>

              <button
                type="button"
                className="ajustar-galeria__modal-fechar"
                onClick={fecharModal}
              >
                ×
              </button>
            </div>

            <form className="ajustar-galeria__form" onSubmit={salvarImagem}>
              <div className="ajustar-galeria__campo">
                <label>Título</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => atualizarCampo("titulo", e.target.value)}
                  placeholder="Ex: Casamento Ana e João"
                />
              </div>

              <div className="ajustar-galeria__campo">
                <label>Categoria</label>
                <select
                  value={form.categoria}
                  onChange={(e) => atualizarCampo("categoria", e.target.value)}
                  className="ajustar-galeria__select"
                >
                  <option value="">Selecione uma categoria</option>
                  {servicos.map((servico) => (
                    <option key={servico.id} value={servico.nome}>
                      {servico.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ajustar-galeria__campo">
                <label>Arquivo</label>
                <input
                  ref={inputArquivoRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/*"
                  onChange={selecionarArquivo}
                />
              </div>

              <div className="ajustar-galeria__upload-info">
                <Upload size={16} />
                <span>
                  {arquivo
                    ? ehArquivoHeic(arquivo)
                      ? `Arquivo selecionado: ${arquivo.name} (será convertido para JPG no servidor)`
                      : `Arquivo selecionado: ${arquivo.name}`
                    : "Selecione uma imagem para enviar"}
                </span>
              </div>

              <div className="ajustar-galeria__form-acoes">
                <button
                  type="button"
                  className="ajustar-galeria__botao-secundario"
                  onClick={fecharModal}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="ajustar-galeria__botao-principal"
                  disabled={salvando}
                >
                  {salvando ? "Enviando..." : "Enviar imagem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}