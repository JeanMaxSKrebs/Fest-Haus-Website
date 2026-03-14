import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import ListaModelosOrcamento from "../components/orcamentos/ListaModelosOrcamento";
import FormOrcamentoPersonalizado from "../components/orcamentos/FormOrcamentoPersonalizado";
import MeusOrcamentos from "../components/orcamentos/MeusOrcamentos";

export type TipoServico = {
  id: string;
  nome: string;
};

export type ModeloOrcamento = {
  id: string;
  nome: string;
  descricao: string | null;
  valor_base: number | null;
  ativo: boolean;
  tipos_servico?: TipoServico | TipoServico[] | null;
  tipo_servico_id?: string | null;
};

export type ItemModelo = {
  id: string;
  nome: string;
  descricao: string | null;
  valor: number | null;
  ordem: number;
};

export type ItemPersonalizado = {
  id: string;
  nome: string;
  descricao: string;
  quantidade: number;
};

type AbaAtiva = "modelos" | "personalizado" | "meus";

function getTipoServicoId(modelo: ModeloOrcamento): string {
  if (modelo.tipo_servico_id) return modelo.tipo_servico_id;
  if (Array.isArray(modelo.tipos_servico)) return modelo.tipos_servico[0]?.id || "";
  return modelo.tipos_servico?.id || "";
}

function Orcamentos() {
  const { user } = useAuth();

  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("modelos");

  const [modelos, setModelos] = useState<ModeloOrcamento[]>([]);
  const [tiposServico, setTiposServico] = useState<TipoServico[]>([]);

  const [carregandoModelos, setCarregandoModelos] = useState(true);
  const [carregandoTipos, setCarregandoTipos] = useState(true);

  const [erroModelos, setErroModelos] = useState("");
  const [erroTipos, setErroTipos] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [modelosAbertos, setModelosAbertos] = useState<string[]>([]);
  const [itensPorModelo, setItensPorModelo] = useState<Record<string, ItemModelo[]>>({});
  const [carregandoItensPorModelo, setCarregandoItensPorModelo] = useState<Record<string, boolean>>({});

  const [tipoServicoInicial, setTipoServicoInicial] = useState("");
  const [tituloInicial, setTituloInicial] = useState("");
  const [observacoesIniciais, setObservacoesIniciais] = useState("");
  const [itensIniciais, setItensIniciais] = useState<ItemPersonalizado[]>([
    {
      id: crypto.randomUUID(),
      nome: "",
      descricao: "",
      quantidade: 1,
    },
  ]);

  useEffect(() => {
    carregarModelos();
    carregarTiposServico();
  }, []);

  async function carregarModelos() {
    try {
      setCarregandoModelos(true);
      setErroModelos("");

      const data = await apiFetch("/api/modelos-orcamento");
      const lista = Array.isArray(data) ? data : [];

      setModelos(lista.filter((item) => item.ativo !== false));
    } catch (error) {
      console.error("Erro ao carregar modelos de orçamento:", error);
      setErroModelos("Não foi possível carregar os modelos de orçamento.");
      setModelos([]);
    } finally {
      setCarregandoModelos(false);
    }
  }

  async function carregarTiposServico() {
    try {
      setCarregandoTipos(true);
      setErroTipos("");

      const data = await apiFetch("/api/tipos-servico");
      setTiposServico(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar tipos de serviço:", error);
      setErroTipos("Não foi possível carregar os tipos de serviço.");
      setTiposServico([]);
    } finally {
      setCarregandoTipos(false);
    }
  }

  async function alternarModelo(modelo: ModeloOrcamento) {
    const jaAberto = modelosAbertos.includes(modelo.id);

    if (jaAberto) {
      setModelosAbertos((prev) => prev.filter((id) => id !== modelo.id));
      return;
    }

    setModelosAbertos((prev) => [...prev, modelo.id]);
    setMensagem("");

    if (itensPorModelo[modelo.id]) {
      return;
    }

    try {
      setCarregandoItensPorModelo((prev) => ({
        ...prev,
        [modelo.id]: true,
      }));

      const data = await apiFetch(`/api/modelos-orcamento/${modelo.id}/itens`);

      setItensPorModelo((prev) => ({
        ...prev,
        [modelo.id]: Array.isArray(data) ? data : [],
      }));
    } catch (error) {
      console.error("Erro ao carregar itens do modelo:", error);
      setMensagem("Não foi possível carregar os itens deste modelo.");
      setItensPorModelo((prev) => ({
        ...prev,
        [modelo.id]: [],
      }));
    } finally {
      setCarregandoItensPorModelo((prev) => ({
        ...prev,
        [modelo.id]: false,
      }));
    }
  }

  async function personalizarModelo(modelo: ModeloOrcamento) {
    try {
      setMensagem("");
      setAbaAtiva("personalizado");

      let itensModelo = itensPorModelo[modelo.id];

      if (!itensModelo) {
        setCarregandoItensPorModelo((prev) => ({
          ...prev,
          [modelo.id]: true,
        }));

        const data = await apiFetch(`/api/modelos-orcamento/${modelo.id}/itens`);
        itensModelo = Array.isArray(data) ? data : [];

        setItensPorModelo((prev) => ({
          ...prev,
          [modelo.id]: itensModelo || [],
        }));
      }

      setTipoServicoInicial(getTipoServicoId(modelo));
      setTituloInicial(`${modelo.nome} - personalizado`);
      setObservacoesIniciais(
        modelo.descricao || "Baseado em um modelo pronto, com personalizações do cliente."
      );

      const itensConvertidos: ItemPersonalizado[] =
        itensModelo && itensModelo.length > 0
          ? itensModelo.map((item) => ({
              id: crypto.randomUUID(),
              nome: item.nome || "",
              descricao: item.descricao || "",
              quantidade: 1,
            }))
          : [
              {
                id: crypto.randomUUID(),
                nome: "",
                descricao: "",
                quantidade: 1,
              },
            ];

      setItensIniciais(itensConvertidos);
    } catch (error) {
      console.error("Erro ao preparar personalização do modelo:", error);
      setMensagem("Não foi possível carregar este modelo para personalização.");
    } finally {
      setCarregandoItensPorModelo((prev) => ({
        ...prev,
        [modelo.id]: false,
      }));
    }
  }

  function limparFormularioPersonalizado() {
    setTipoServicoInicial("");
    setTituloInicial("");
    setObservacoesIniciais("");
    setItensIniciais([
      {
        id: crypto.randomUUID(),
        nome: "",
        descricao: "",
        quantidade: 1,
      },
    ]);
  }

  return (
    <section className="section">
      <h1>Orçamentos</h1>

      <p
        style={{
          color: "var(--cor-texto-secundario)",
          marginTop: "10px",
          marginBottom: "25px",
        }}
      >
        Escolha um modelo pronto, personalize um modelo existente ou monte seu próprio orçamento.
      </p>

      {mensagem && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 14px",
            borderRadius: "10px",
            background: "var(--cor-fundo-secundario)",
            border: "1px solid var(--cor-borda)",
          }}
        >
          {mensagem}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <button
          type="button"
          className="btn-apresentacao"
          onClick={() => setAbaAtiva("modelos")}
          style={{
            width: "auto",
            opacity: abaAtiva === "modelos" ? 1 : 0.75,
            border:
              abaAtiva === "modelos"
                ? "2px solid var(--cor-primaria)"
                : "1px solid var(--cor-borda)",
          }}
        >
          Modelos prontos
        </button>

        <button
          type="button"
          className="btn-apresentacao"
          onClick={() => setAbaAtiva("personalizado")}
          style={{
            width: "auto",
            opacity: abaAtiva === "personalizado" ? 1 : 0.75,
            border:
              abaAtiva === "personalizado"
                ? "2px solid var(--cor-primaria)"
                : "1px solid var(--cor-borda)",
          }}
        >
          Monte seu orçamento
        </button>

        <button
          type="button"
          className="btn-apresentacao"
          onClick={() => setAbaAtiva("meus")}
          style={{
            width: "auto",
            opacity: abaAtiva === "meus" ? 1 : 0.75,
            border:
              abaAtiva === "meus"
                ? "2px solid var(--cor-primaria)"
                : "1px solid var(--cor-borda)",
          }}
        >
          Meus orçamentos
        </button>
      </div>

      {abaAtiva === "modelos" && (
        <ListaModelosOrcamento
          modelos={modelos}
          carregando={carregandoModelos}
          erro={erroModelos}
          modelosAbertos={modelosAbertos}
          itensPorModelo={itensPorModelo}
          carregandoItensPorModelo={carregandoItensPorModelo}
          onVerItens={alternarModelo}
          onPersonalizarModelo={personalizarModelo}
          onTentarNovamente={carregarModelos}
        />
      )}

      {abaAtiva === "personalizado" && (
        <FormOrcamentoPersonalizado
          user={user}
          tiposServico={tiposServico}
          carregandoTipos={carregandoTipos}
          erroTipos={erroTipos}
          tipoServicoInicial={tipoServicoInicial}
          tituloInicial={tituloInicial}
          observacoesIniciais={observacoesIniciais}
          itensIniciais={itensIniciais}
          onLimparIniciais={limparFormularioPersonalizado}
          onSucesso={(texto) => {
            setMensagem(texto);
            setAbaAtiva("meus");
            limparFormularioPersonalizado();
          }}
          onErro={(texto) => setMensagem(texto)}
        />
      )}

      {abaAtiva === "meus" && user && (
        <MeusOrcamentos userId={user.id} />
      )}
    </section>
  );
}

export default Orcamentos;
