import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";

type ImagemGaleria = {
  id: string;
  path: string;
  titulo: string;
  categoria: string;
  periodo?: string | null;
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

function formatarPeriodo(periodo?: string | null) {
  if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) return "Sem data";

  const [ano, mes] = periodo.split("-");
  const data = new Date(Number(ano), Number(mes) - 1, 1);

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(data);
}

function Galeria() {
  const [imagens, setImagens] = useState<ImagemGaleria[]>([]);
  const [servicos, setServicos] = useState<TipoServico[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todas");
  const [periodoSelecionado, setPeriodoSelecionado] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    function verificarTela() {
      setIsMobile(window.innerWidth <= 768);
    }

    verificarTela();
    window.addEventListener("resize", verificarTela);

    return () => window.removeEventListener("resize", verificarTela);
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

  const periodos = useMemo(() => {
    const periodosUnicos = Array.from(
      new Set(
        imagens
          .map((imagem) => imagem.periodo)
          .filter((periodo): periodo is string => Boolean(periodo))
      )
    ).sort((a, b) => b.localeCompare(a));

    return ["todos", ...periodosUnicos];
  }, [imagens]);

  const imagensFiltradas = useMemo(() => {
    return imagens.filter((imagem) => {
      const bateCategoria =
        categoriaSelecionada === "todas" ||
        slugify(imagem.categoria) === categoriaSelecionada;

      const batePeriodo =
        periodoSelecionado === "todos" || imagem.periodo === periodoSelecionado;

      return bateCategoria && batePeriodo;
    });
  }, [imagens, categoriaSelecionada, periodoSelecionado]);

  return (
    <section className="section galeria-home">
      <h2 className="galeria-home__titulo">Galeria</h2>

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: "12px",
            alignItems: isMobile ? "stretch" : "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              minWidth: isMobile ? "100%" : "220px",
            }}
          >
            <label htmlFor="filtro-periodo">Filtrar por data</label>
            <select
              id="filtro-periodo"
              value={periodoSelecionado}
              onChange={(e) => setPeriodoSelecionado(e.target.value)}
              className="galeria-home__select"
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid var(--cor-borda)",
                background: "var(--cor-fundo-secundario)",
                color: "inherit",
              }}
            >
              {periodos.map((periodo) => (
                <option key={periodo} value={periodo}>
                  {periodo === "todos" ? "Todas as datas" : formatarPeriodo(periodo)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className="galeria-home__filtros-wrapper"
          style={
            isMobile
              ? {
                  width: "100%",
                  overflowX: "auto",
                  overflowY: "hidden",
                  WebkitOverflowScrolling: "touch",
                  paddingBottom: "6px",
                }
              : {
                  width: "100%",
                }
          }
        >
          <div
            className="galeria-home__filtros"
            style={
              isMobile
                ? {
                    display: "flex",
                    gap: "10px",
                    flexWrap: "nowrap",
                    width: "max-content",
                    minWidth: "100%",
                  }
                : {
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    width: "100%",
                  }
            }
          >
            {categorias.map((categoria) => {
              const valor = categoria === "Todas" ? "todas" : slugify(categoria);
              const ativo = categoriaSelecionada === valor;

              return (
                <button
                  key={valor}
                  type="button"
                  className={`galeria-home__filtro ${ativo ? "ativo" : ""}`}
                  onClick={() => setCategoriaSelecionada(valor)}
                  style={{
                    ...(isMobile
                      ? {
                          flex: "0 0 auto",
                          whiteSpace: "nowrap",
                        }
                      : {}),
                  }}
                >
                  {categoria}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="galeria-home__estado">Carregando galeria...</div>
      ) : erro ? (
        <div className="galeria-home__estado">{erro}</div>
      ) : imagensFiltradas.length === 0 ? (
        <div className="galeria-home__estado">
          Nenhuma imagem encontrada para os filtros selecionados.
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