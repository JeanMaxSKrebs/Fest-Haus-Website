import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

type SolicitacaoOrcamento = {
  id: string;
  titulo: string | null;
  descricao: string;
  status: string;
  created_at?: string;
  tipos_servico?: {
    id: string;
    nome: string;
  } | null;
};

type Props = {
  userId: string;
};

function formatarStatus(status: string) {
  switch (status) {
    case "pendente":
      return "Pendente";
    case "convertida_modelo":
      return "Convertida em modelo";
    case "aprovada":
      return "Aprovada";
    case "recusada":
      return "Recusada";
    default:
      return status;
  }
}

function formatarData(data?: string) {
  if (!data) return "Data não informada";
  return new Date(data).toLocaleDateString("pt-BR");
}

export default function MeusOrcamentos({ userId }: Props) {
  const [orcamentos, setOrcamentos] = useState<SolicitacaoOrcamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregar();
  }, [userId]);

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");

      const data = await apiFetch(`/api/solicitacoes-orcamento/usuario/${userId}`);
      setOrcamentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar orçamentos do usuário:", error);
      setErro("Não foi possível carregar seus orçamentos.");
      setOrcamentos([]);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div>
      <h2 className="titulo-secao">Meus orçamentos</h2>

      {carregando && <p>Carregando seus orçamentos...</p>}

      {!carregando && erro && (
        <div className="card">
          <p>{erro}</p>

          <button
            className="btn-apresentacao"
            type="button"
            onClick={carregar}
            style={{ marginTop: "10px" }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!carregando && !erro && orcamentos.length === 0 && (
        <p>Você ainda não enviou nenhum orçamento.</p>
      )}

      {!carregando && !erro && orcamentos.length > 0 && (
        <div className="lista-meus-orcamentos">
          {orcamentos.map((orcamento) => (
            <div key={orcamento.id} className="card-orcamento">
              <h3>{orcamento.titulo || "Orçamento sem título"}</h3>

              <p className="card-orcamento-tipo">
                <strong>Tipo:</strong>{" "}
                {orcamento.tipos_servico?.nome || "Não informado"}
              </p>

              <p className="card-orcamento-tipo">
                <strong>Status:</strong> {formatarStatus(orcamento.status)}
              </p>

              <p className="card-orcamento-tipo">
                <strong>Enviado em:</strong> {formatarData(orcamento.created_at)}
              </p>

              <div className="card-itens-modelo">
                <strong>Descrição enviada</strong>
                <p style={{ marginTop: "10px", whiteSpace: "pre-line" }}>
                  {orcamento.descricao}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
