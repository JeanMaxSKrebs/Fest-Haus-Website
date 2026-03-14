import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

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
  tipos_servico?: TipoServico | null;
};

type ItemModelo = {
  id: string;
  nome: string;
  descricao: string | null;
  valor: number | null;
  ordem: number;
};

export default function Orcamentos() {
  const { user } = useAuth();

  const [modelos, setModelos] = useState<ModeloOrcamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modeloSelecionado, setModeloSelecionado] = useState<ModeloOrcamento | null>(null);
  const [itensModelo, setItensModelo] = useState<ItemModelo[]>([]);
  const [carregandoItens, setCarregandoItens] = useState(false);

  const [tiposServico, setTiposServico] = useState<TipoServico[]>([]);
  const [tipoServicoId, setTipoServicoId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    carregarModelos();
    carregarTiposServico();
  }, []);

  async function carregarModelos() {
    try {
      setCarregando(true);
      const data = await apiFetch("/orcamentos/modelos");
      setModelos((data || []).filter((item: ModeloOrcamento) => item.ativo));
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao carregar os modelos de orçamento.");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarTiposServico() {
    try {
      const data = await apiFetch("/tipos-servico");
      setTiposServico(data || []);
    } catch (error) {
      console.error(error);
    }
  }

  async function verItens(modelo: ModeloOrcamento) {
    try {
      setModeloSelecionado(modelo);
      setCarregandoItens(true);
      const data = await apiFetch(`/orcamentos/modelos/${modelo.id}/itens`);
      setItensModelo(data || []);
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao carregar os itens do orçamento.");
    } finally {
      setCarregandoItens(false);
    }
  }

  async function enviarSolicitacao(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      setMensagem("Você precisa estar logado para solicitar um orçamento personalizado.");
      return;
    }

    if (!tipoServicoId || !descricao.trim()) {
      setMensagem("Selecione o tipo de serviço e descreva o orçamento desejado.");
      return;
    }

    try {
      setEnviando(true);
      setMensagem("");

      await apiFetch("/orcamentos/solicitacoes", {
        method: "POST",
        body: JSON.stringify({
          usuario_id: user.id,
          tipo_servico_id: tipoServicoId,
          titulo: titulo.trim() || null,
          descricao: descricao.trim(),
        }),
      });

      setTitulo("");
      setDescricao("");
      setTipoServicoId("");
      setMensagem("Solicitação enviada com sucesso! Ela ficará pendente para análise do administrador.");
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao enviar solicitação de orçamento.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="section">
      <h1>Orçamentos</h1>
      <p style={{ color: "var(--cor-texto-secundario)", marginTop: 8 }}>
        Escolha um modelo pronto ou monte um orçamento personalizado.
      </p>

      {mensagem && (
        <div style={{ marginTop: 16 }}>
          <p>{mensagem}</p>
        </div>
      )}

      <div style={{ marginTop: 30 }}>
        <h2>Modelos prontos</h2>

        {carregando ? (
          <p>Carregando orçamentos...</p>
        ) : modelos.length === 0 ? (
          <p>Nenhum modelo disponível no momento.</p>
        ) : (
          <div
            className="grid"
            style={{
              marginTop: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "16px",
            }}
          >
            {modelos.map((modelo) => (
              <div
                key={modelo.id}
                style={{
                  border: "1px solid var(--cor-borda)",
                  borderRadius: 12,
                  padding: 16,
                  background: "var(--cor-fundo-secundario)",
                }}
              >
                <h3 style={{ marginBottom: 8 }}>{modelo.nome}</h3>

                <p style={{ marginBottom: 8, color: "var(--cor-texto-secundario)" }}>
                  <strong>Tipo:</strong> {modelo.tipos_servico?.nome || "Não informado"}
                </p>

                {modelo.descricao && (
                  <p style={{ marginBottom: 12 }}>{modelo.descricao}</p>
                )}

                {modelo.valor_base !== null && (
                  <p style={{ marginBottom: 16 }}>
                    <strong>A partir de:</strong>{" "}
                    {Number(modelo.valor_base).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                )}

                <button
                  className="btn-apresentacao"
                  type="button"
                  onClick={() => verItens(modelo)}
                >
                  Ver itens
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modeloSelecionado && (
        <div style={{ marginTop: 32 }}>
          <h2>Itens do orçamento: {modeloSelecionado.nome}</h2>

          {carregandoItens ? (
            <p>Carregando itens...</p>
          ) : itensModelo.length === 0 ? (
            <p>Esse modelo ainda não possui itens cadastrados.</p>
          ) : (
            <div
              style={{
                marginTop: 16,
                border: "1px solid var(--cor-borda)",
                borderRadius: 12,
                padding: 16,
                background: "var(--cor-fundo-secundario)",
              }}
            >
              <ul style={{ paddingLeft: 20 }}>
                {itensModelo.map((item) => (
                  <li key={item.id} style={{ marginBottom: 10 }}>
                    <strong>{item.nome}</strong>
                    {item.descricao ? ` — ${item.descricao}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 40 }}>
        <h2>Solicitar orçamento personalizado</h2>
        <p style={{ color: "var(--cor-texto-secundario)", marginTop: 8 }}>
          Monte seu pedido com os itens desejados. Os valores serão analisados pelo administrador.
        </p>

        <form
          onSubmit={enviarSolicitacao}
          style={{
            marginTop: 16,
            display: "grid",
            gap: 12,
            maxWidth: 700,
          }}
        >
          <select
            value={tipoServicoId}
            onChange={(e) => setTipoServicoId(e.target.value)}
            required
          >
            <option value="">Selecione o tipo de serviço</option>
            {tiposServico.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Título do orçamento (opcional)"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <textarea
            placeholder="Descreva os itens desejados, quantidade de pessoas, duração do evento e outras observações"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={6}
            required
          />

          <button
            className="btn-apresentacao"
            type="submit"
            disabled={enviando}
          >
            {enviando ? "Enviando..." : "Enviar orçamento personalizado"}
          </button>
        </form>
      </div>
    </section>
  );
}
