import { useEffect, useMemo, useState } from "react";
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

function slugify(texto = "") {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function Galeria() {
  const [imagens, setImagens] = useState<ImagemGaleria[]>([]);
  const [servicos, setServicos] = useState<TipoServico[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todas");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const [imagensData, servicosData] = await Promise.all([
        apiFetch("/api/galeria"),
        apiFetch("/api/tipos-servico"),
      ]);

      setImagens(Array.isArray(imagensData) ? imagensData : []);
      setServicos(Array.isArray(servicosData) ? servicosData : []);
    } catch (error: any) {
      console.error("Erro ao carregar galeria pública:", error);
      setErro(error.message || "Não foi possível carregar a galeria.");
    } finally {
      setLoading(false);
    }
  }

  const categorias = useMemo(() => {
    const nomesServicos = servicos.map((servico) => servico.nome);
    return ["Todas", ...nomesServicos];
  }, [servicos]);

  const imagensFiltradas = useMemo(() => {
    if (categoriaSelecionada === "todas") {
      return imagens;
    }

    return imagens.filter(
      (imagem) => slugify(imagem.categoria) === categoriaSelecionada
    );
  }, [imagens, categoriaSelecionada]);

  return (
    <section className="section">
      <h2>Galeria</h2>

      <div className="galeria-home__filtros-wrapper">
        <div className="galeria-home__filtros">
          {categorias.map((categoria) => {
            const valor = categoria === "Todas" ? "todas" : slugify(categoria);
            const ativo = categoriaSelecionada === valor;

            return (
              <button
                key={valor}
                type="button"
                className={`galeria-home__filtro ${ativo ? "ativo" : ""}`}
                onClick={() => setCategoriaSelecionada(valor)}
              >
                {categoria}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="galeria-home__estado">Carregando galeria...</div>
      ) : erro ? (
        <div className="galeria-home__estado">{erro}</div>
      ) : imagensFiltradas.length === 0 ? (
        <div className="galeria-home__estado">
          Nenhuma imagem encontrada para esta categoria.
        </div>
      ) : (
        <div className="grid">
          {imagensFiltradas.map((imagem) => (
            <img
              key={imagem.id}
              src={imagem.url}
              className="img-200"
              alt={imagem.titulo || "Foto do salão"}
              loading="lazy"
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Galeria;