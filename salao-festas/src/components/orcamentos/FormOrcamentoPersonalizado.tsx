import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/api";
import type { ItemPersonalizado, TipoServico } from "../../pages/Orcamentos";

type Props = {
  user: { id: string } | null;
  tiposServico: TipoServico[];
  carregandoTipos: boolean;
  erroTipos: string;
  tipoServicoInicial?: string;
  tituloInicial?: string;
  observacoesIniciais?: string;
  itensIniciais?: ItemPersonalizado[];
  onLimparIniciais?: () => void;
  onSucesso: (mensagem: string) => void;
  onErro: (mensagem: string) => void;
};

export default function FormOrcamentoPersonalizado({
  user,
  tiposServico,
  carregandoTipos,
  erroTipos,
  tipoServicoInicial = "",
  tituloInicial = "",
  observacoesIniciais = "",
  itensIniciais = [
    {
      id: crypto.randomUUID(),
      nome: "",
      descricao: "",
      quantidade: 1,
    },
  ],
  onLimparIniciais,
  onSucesso,
  onErro,
}: Props) {
  const [tipoServicoId, setTipoServicoId] = useState(tipoServicoInicial);
  const [titulo, setTitulo] = useState(tituloInicial);
  const [observacoesGerais, setObservacoesGerais] = useState(observacoesIniciais);
  const [enviando, setEnviando] = useState(false);
  const [itens, setItens] = useState<ItemPersonalizado[]>(itensIniciais);

  useEffect(() => {
    setTipoServicoId(tipoServicoInicial);
  }, [tipoServicoInicial]);

  useEffect(() => {
    setTitulo(tituloInicial);
  }, [tituloInicial]);

  useEffect(() => {
    setObservacoesGerais(observacoesIniciais);
  }, [observacoesIniciais]);

  useEffect(() => {
    setItens(
      itensIniciais.length > 0
        ? itensIniciais
        : [
            {
              id: crypto.randomUUID(),
              nome: "",
              descricao: "",
              quantidade: 1,
            },
          ]
    );
  }, [itensIniciais]);

  function adicionarItem() {
    setItens((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        nome: "",
        descricao: "",
        quantidade: 1,
      },
    ]);
  }

  function removerItem(id: string) {
    setItens((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((item) => item.id !== id);
    });
  }

  function atualizarItem(
    id: string,
    campo: keyof ItemPersonalizado,
    valor: string | number
  ) {
    setItens((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [campo]: valor } : item
      )
    );
  }

  function montarDescricao() {
    const itensValidos = itens.filter((item) => item.nome.trim() !== "");

    const linhas = itensValidos.map((item, index) => {
      const detalhes = item.descricao.trim()
        ? ` | Detalhes: ${item.descricao.trim()}`
        : "";

      return `${index + 1}. Item: ${item.nome.trim()} | Quantidade: ${
        item.quantidade
      }${detalhes}`;
    });

    const tipoNome =
      tiposServico.find((tipo) => tipo.id === tipoServicoId)?.nome ||
      "Não informado";

    const partes = [
      "ORÇAMENTO PERSONALIZADO",
      `Tipo de serviço: ${tipoNome}`,
      "",
      "ITENS SOLICITADOS:",
      ...linhas,
    ];

    if (observacoesGerais.trim()) {
      partes.push("", "OBSERVAÇÕES GERAIS:", observacoesGerais.trim());
    }

    return partes.join("\n");
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user) {
      onErro("Você precisa estar logado para enviar um orçamento.");
      return;
    }

    if (!tipoServicoId) {
      onErro("Selecione o tipo de serviço.");
      return;
    }

    const itensValidos = itens.filter((item) => item.nome.trim() !== "");

    if (itensValidos.length === 0) {
      onErro("Adicione pelo menos 1 item no orçamento.");
      return;
    }

    try {
      setEnviando(true);

      await apiFetch("/api/solicitacoes-orcamento", {
        method: "POST",
        body: JSON.stringify({
          usuario_id: user.id,
          tipo_servico_id: tipoServicoId,
          titulo: titulo.trim() || "Orçamento personalizado",
          descricao: montarDescricao(),
        }),
      });

      setTipoServicoId("");
      setTitulo("");
      setObservacoesGerais("");
      setItens([
        {
          id: crypto.randomUUID(),
          nome: "",
          descricao: "",
          quantidade: 1,
        },
      ]);

      onLimparIniciais?.();
      onSucesso("Orçamento personalizado enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar orçamento personalizado:", error);
      onErro("Erro ao enviar o orçamento personalizado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h2>Monte seu orçamento</h2>

      {carregandoTipos ? (
        <p style={{ marginTop: "16px" }}>Carregando tipos de serviço...</p>
      ) : erroTipos ? (
        <p style={{ marginTop: "16px" }}>{erroTipos}</p>
      ) : (
        <form
          onSubmit={enviar}
          style={{
            marginTop: "16px",
            display: "grid",
            gap: "14px",
          }}
        >
          <div>
            <label htmlFor="tipoServico">Tipo de serviço</label>
            <select
              id="tipoServico"
              value={tipoServicoId}
              onChange={(e) => setTipoServicoId(e.target.value)}
              style={{
                width: "100%",
                marginTop: "6px",
                padding: "10px 12px",
                borderRadius: "10px",
              }}
            >
              <option value="">Selecione</option>
              {tiposServico.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="titulo">Título do orçamento</label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Festa de aniversário 80 pessoas"
              style={{
                width: "100%",
                marginTop: "6px",
                padding: "10px 12px",
                borderRadius: "10px",
              }}
            />
          </div>

          <div>
            <h3 style={{ marginBottom: "10px" }}>Itens desejados</h3>

            <div style={{ display: "grid", gap: "12px" }}>
              {itens.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid var(--cor-borda)",
                    borderRadius: "12px",
                    padding: "14px",
                    background: "var(--cor-fundo-secundario)",
                    display: "grid",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <strong>Item {index + 1}</strong>

                    <button
                      type="button"
                      onClick={() => removerItem(item.id)}
                      className="btn-apresentacao"
                      style={{
                        width: "auto",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 12px",
                      }}
                    >
                      <Trash2 size={16} />
                      Remover
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Nome do item"
                    value={item.nome}
                    onChange={(e) =>
                      atualizarItem(item.id, "nome", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                    }}
                  />

                  <input
                    type="number"
                    min={1}
                    value={item.quantidade}
                    onChange={(e) =>
                      atualizarItem(
                        item.id,
                        "quantidade",
                        Number(e.target.value) || 1
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                    }}
                  />

                  <textarea
                    placeholder="Descrição do item (opcional)"
                    value={item.descricao}
                    onChange={(e) =>
                      atualizarItem(item.id, "descricao", e.target.value)
                    }
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      resize: "vertical",
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={adicionarItem}
              className="btn-apresentacao"
              style={{
                marginTop: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Plus size={18} />
              Adicionar item
            </button>
          </div>

          <div>
            <label htmlFor="observacoesGerais">Observações gerais</label>
            <textarea
              id="observacoesGerais"
              value={observacoesGerais}
              onChange={(e) => setObservacoesGerais(e.target.value)}
              placeholder="Ex.: quantidade de convidados, duração do evento, horário, preferências, etc."
              rows={5}
              style={{
                width: "100%",
                marginTop: "6px",
                padding: "10px 12px",
                borderRadius: "10px",
                resize: "vertical",
              }}
            />
          </div>

          <button
            className="btn-apresentacao"
            type="submit"
            disabled={enviando}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {enviando ? "Enviando..." : "Enviar orçamento personalizado"}
          </button>
        </form>
      )}
    </div>
  );
}
