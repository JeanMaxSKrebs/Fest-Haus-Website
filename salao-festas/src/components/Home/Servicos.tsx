import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../lib/api";
import Casamento from "./servicos/Casamento";
import Aniversario from "./servicos/Aniversario";
import Corporativo from "./servicos/Corporativo";
import Formatura from "./servicos/Formatura";
import Infantil from "./servicos/Infantil";
import BtnOrcamento from "./BtnOrcamento";
import Festa15 from "./servicos/Festa15";
import Personalizado from "./servicos/Personalizado";

type TipoServicoApi = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number | null;
  ativo: boolean;
  imagem_principal_url?: string | null;
  imagens_galeria?: Array<{
    path: string;
    url: string;
  }>;
};

function Servicos() {
  const [servicoAtivo, setServicoAtivo] = useState<string | null>(null);
  const [servicosApi, setServicosApi] = useState<TipoServicoApi[]>([]);
  const [loading, setLoading] = useState(true);

  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    carregarServicos();
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

  function getImagemServico(nome: string, fallback: string) {
    const servicoBanco = servicosApi.find((s) => s.nome === nome);
    return servicoBanco?.imagem_principal_url || fallback;
  }

  const servicos = [
    {
      nome: "Casamentos",
      imagem: getImagemServico("Casamentos", "/servicos/casamento.png"),
      componente: (
        <Casamento imagem={getImagemServico("Casamentos", "/casamento.jpg")} />
      ),
    },
    {
      nome: "Aniversários",
      imagem: getImagemServico("Aniversários", "/servicos/aniversario.jpg"),
      componente: (
        <Aniversario
          imagem={getImagemServico("Aniversários", "/aniversario.jpg")}
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
        />
      ),
    },
    {
      nome: "Formaturas",
      imagem: getImagemServico("Formaturas", "/servicos/formatura.jpg"),
      componente: (
        <Formatura imagem={getImagemServico("Formaturas", "/formatura.jpg")} />
      ),
    },
    {
      nome: "Festas Infantis",
      imagem: getImagemServico("Festas Infantis", "/servicos/infantil.png"),
      componente: (
        <Infantil
          imagem={getImagemServico("Festas Infantis", "/infantil.jpg")}
        />
      ),
    },
    {
      nome: "Festa de 15 Anos",
      imagem: getImagemServico("Festa de 15 Anos", "/servicos/15anos.jpg"),
      componente: (
        <Festa15
          imagem={getImagemServico("Festa de 15 Anos", "/servicos/15anos.jpg")}
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
        />
      ),
    },
  ];

  const servicosVisiveis = servicos.filter((servico) =>
    servicosApi.length
      ? servicosApi.some((s) => s.nome === servico.nome && s.ativo)
      : true
  );

  const handleClick = (nome: string) => {
    setServicoAtivo(servicoAtivo === nome ? null : nome);
    sectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="servicos" className="section" ref={sectionRef}>
      <h2>Serviços</h2>

      {loading && <p>Carregando serviços...</p>}

      <div className="servicos-home__grid">
        {servicosVisiveis.map((servico, index) => {
          const isAtivo = servicoAtivo === servico.nome;
          const algumAtivo = servicoAtivo !== null;
          const temImagem = servico.imagem !== "";

          return (
            <div
              key={index}
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
                    {temImagem && (
                      <img
                        src={servico.imagem}
                        className="img-200"
                        alt={servico.nome}
                      />
                    )}
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
          );
        })}
      </div>

      {servicoAtivo && (
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