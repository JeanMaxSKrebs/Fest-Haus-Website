import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../lib/api";
import Casamento from "./servicos/Casamento";
import Aniversario from "./servicos/Aniversario";
import Corporativo from "./servicos/Corporativo";
import Formatura from "./servicos/Formatura";
import Infantil from "./servicos/Infantil";
import BtnOrcamento from "./BtnOrcamento";
import Festa15 from "./servicos/Festa15";
import Personalizado from "./servicos/Personalizado";

type ImagemGaleria = {
  path: string;
  url: string;
  created_at?: string | null;
};

type TipoServicoApi = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number | null;
  ativo: boolean;
  imagem_principal_url?: string | null;
  imagens_galeria?: ImagemGaleria[];
};

type CardServico = {
  nome: string;
  imagem: string;
  componente: React.ReactNode;
};

function Servicos() {
  const [servicoAtivo, setServicoAtivo] = useState<string | null>(null);
  const [servicosApi, setServicosApi] = useState<TipoServicoApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    carregarServicos();
  }, []);

  useEffect(() => {
    function verificarTela() {
      setIsMobile(window.innerWidth <= 768);
    }

    verificarTela();
    window.addEventListener("resize", verificarTela);

    return () => window.removeEventListener("resize", verificarTela);
  }, []);

  async function carregarServicos() {
    try {
      setLoading(true);
      const data = await apiFetch("/api/tipos-servico");
      setServicosApi(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar serviços da home:", error);
      setServicosApi([]);
    } finally {
      setLoading(false);
    }
  }

  function getServicoBanco(nome: string) {
    return servicosApi.find((s) => s.nome === nome);
  }

  function getImagemServico(nome: string, fallback: string) {
    const servicoBanco = getServicoBanco(nome);
    return servicoBanco?.imagem_principal_url || fallback;
  }

  function getImagensGaleriaServico(nome: string) {
    const servicoBanco = getServicoBanco(nome);
    return servicoBanco?.imagens_galeria ?? [];
  }

  const servicos: CardServico[] = useMemo(
    () => [
      {
        nome: "Casamentos",
        imagem: getImagemServico("Casamentos", "/servicos/casamento.png"),
        componente: (
          <Casamento
            imagem={getImagemServico("Casamentos", "/casamento.jpg")}
            imagens={getImagensGaleriaServico("Casamentos")}
          />
        ),
      },
      {
        nome: "Aniversários",
        imagem: getImagemServico("Aniversários", "/servicos/aniversario.jpg"),
        componente: (
          <Aniversario
            imagem={getImagemServico("Aniversários", "/aniversario.jpg")}
            imagens={getImagensGaleriaServico("Aniversários")}
          />
        ),
      },
      {
        nome: "Eventos Corporativos",
        imagem: getImagemServico(
          "Eventos Corporativos",
          "/servicos/corporativo.jpg"
        ),
        componente: (
          <Corporativo
            imagem={getImagemServico(
              "Eventos Corporativos",
              "/corporativo.jpg"
            )}
            imagens={getImagensGaleriaServico("Eventos Corporativos")}
          />
        ),
      },
      {
        nome: "Formaturas",
        imagem: getImagemServico("Formaturas", "/servicos/formatura.jpg"),
        componente: (
          <Formatura
            imagem={getImagemServico("Formaturas", "/formatura.jpg")}
            imagens={getImagensGaleriaServico("Formaturas")}
          />
        ),
      },
      {
        nome: "Festas Infantis",
        imagem: getImagemServico("Festas Infantis", "/servicos/infantil.png"),
        componente: (
          <Infantil
            imagem={getImagemServico("Festas Infantis", "/infantil.jpg")}
            imagens={getImagensGaleriaServico("Festas Infantis")}
          />
        ),
      },
      {
        nome: "Festa de 15 Anos",
        imagem: getImagemServico("Festa de 15 Anos", "/servicos/15anos.jpg"),
        componente: (
          <Festa15
            imagem={getImagemServico(
              "Festa de 15 Anos",
              "/servicos/15anos.jpg"
            )}
            imagens={getImagensGaleriaServico("Festa de 15 Anos")}
          />
        ),
      },
      {
        nome: "Eventos Personalizados",
        imagem: getImagemServico(
          "Eventos Personalizados",
          "/servicos/personalizado.jpg"
        ),
        componente: (
          <Personalizado
            imagem={getImagemServico(
              "Eventos Personalizados",
              "/servicos/personalizado.jpg"
            )}
            imagens={getImagensGaleriaServico("Eventos Personalizados")}
          />
        ),
      },
    ],
    [servicosApi]
  );

  const servicosVisiveis = servicos.filter((servico) =>
    servicosApi.length
      ? servicosApi.some((s) => s.nome === servico.nome && s.ativo)
      : true
  );

  function handleClick(nome: string) {
    const novoAtivo = servicoAtivo === nome ? null : nome;
    setServicoAtivo(novoAtivo);

    if (!isMobile) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    }
  }

  return (
    <section id="servicos" className="section" ref={sectionRef}>
      <h2>Serviços</h2>

      {loading && <p>Carregando serviços...</p>}

      <div className="servicos-home__grid">
        {servicosVisiveis.map((servico) => {
          const isAtivo = servicoAtivo === servico.nome;
          const algumAtivo = servicoAtivo !== null;

          return (
            <div
              key={servico.nome}
              style={{
                width: "100%",
              }}
            >
              <div
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  textDecoration: "none",
                  color: "inherit",
                  cursor: "pointer",
                  border: isAtivo ? "3px solid var(--cor-primaria)" : "none",
                  padding: isAtivo ? "30px" : "20px",
                  minHeight: "220px",
                }}
                onClick={() => handleClick(servico.nome)}
              >
                {isAtivo || !algumAtivo ? (
                  !isAtivo ? (
                    <>
                      <div
                        style={{
                          width: "200px",
                          height: "200px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          borderRadius: "16px",
                          background: "var(--cor-fundo-secundario)",
                          marginBottom: "12px",
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={servico.imagem}
                          alt={servico.nome}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                          loading="lazy"
                        />
                      </div>

                      <h3>{servico.nome}</h3>
                    </>
                  ) : (
                    <h3
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "200px",
                      }}
                    >
                      {servico.nome}
                    </h3>
                  )
                ) : (
                  <h3
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "200px",
                      opacity: 0.6,
                    }}
                  >
                    {servico.nome}
                  </h3>
                )}
              </div>

              {isMobile && isAtivo && (
                <div
                  style={{
                    marginTop: "20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "20px",
                  }}
                >
                  {servico.componente}
                  <BtnOrcamento servico={servicoAtivo} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isMobile && servicoAtivo && (
        <div
          style={{
            marginTop: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {servicosVisiveis.find((s) => s.nome === servicoAtivo)?.componente}
          <BtnOrcamento servico={servicoAtivo} />
        </div>
      )}
    </section>
  );
}

export default Servicos;