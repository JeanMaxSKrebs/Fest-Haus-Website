import { Eye, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import type {
  ItemModelo,
  ModeloOrcamento,
  TipoServico,
} from "../../pages/Orcamentos";

type Props = {
  modelos: ModeloOrcamento[];
  carregando: boolean;
  erro: string;
  modelosAbertos: string[];
  itensPorModelo: Record<string, ItemModelo[]>;
  carregandoItensPorModelo: Record<string, boolean>;
  onVerItens: (modelo: ModeloOrcamento) => void;
  onPersonalizarModelo: (modelo: ModeloOrcamento) => void;
  onTentarNovamente: () => void;
};

function getTipoServicoNome(
  tiposServico?: TipoServico | TipoServico[] | null
): string {
  if (!tiposServico) return "Não informado";
  if (Array.isArray(tiposServico)) {
    return tiposServico[0]?.nome || "Não informado";
  }
  return tiposServico.nome || "Não informado";
}

function ListaModelosOrcamento({
  modelos,
  carregando,
  erro,
  modelosAbertos,
  itensPorModelo,
  carregandoItensPorModelo,
  onVerItens,
  onPersonalizarModelo,
  onTentarNovamente,
}: Props) {
  return (
    <div>
      <h2 className="titulo-secao">Modelos prontos</h2>

      {carregando && <p>Carregando modelos...</p>}

      {!carregando && erro && (
        <div className="card">
          <p>{erro}</p>

          <button
            className="btn-apresentacao"
            onClick={onTentarNovamente}
            style={{ marginTop: "10px" }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!carregando && !erro && modelos.length === 0 && (
        <p>Nenhum modelo disponível.</p>
      )}

      {!carregando && !erro && modelos.length > 0 && (
        <div className="grid-modelos">
          {modelos.map((modelo) => {
            const aberto = modelosAbertos.includes(modelo.id);
            const itens = itensPorModelo[modelo.id] || [];
            const carregandoItens = !!carregandoItensPorModelo[modelo.id];

            return (
              <div
                key={modelo.id}
                className={`card-orcamento ${aberto ? "aberto" : ""}`}
              >
                <h3>{modelo.nome}</h3>

                <p className="card-orcamento-tipo">
                  <strong>Tipo:</strong>{" "}
                  {getTipoServicoNome(modelo.tipos_servico)}
                </p>

                {modelo.descricao && (
                  <p className="card-orcamento-descricao">
                    {modelo.descricao}
                  </p>
                )}

                {modelo.valor_base !== null && (
                  <p className="card-orcamento-preco">
                    A partir de{" "}
                    {Number(modelo.valor_base).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                )}

                <div className="acoes-modelo-orcamento">
                  <button
                    className="btn-apresentacao btn-acao-modelo"
                    type="button"
                    onClick={() => onVerItens(modelo)}
                  >
                    <Eye size={18} />
                    {aberto ? "Ocultar itens" : "Ver itens"}
                    {aberto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  <button
                    className="btn-apresentacao btn-acao-modelo"
                    type="button"
                    onClick={() => onPersonalizarModelo(modelo)}
                  >
                    <Pencil size={18} />
                    Personalizar este modelo
                  </button>
                </div>


                {aberto && (
                  <div className="card-itens-modelo">
                    <h4>Itens inclusos</h4>

                    {carregandoItens && <p>Carregando itens...</p>}

                    {!carregandoItens && itens.length === 0 && (
                      <p>Esse modelo não possui itens cadastrados.</p>
                    )}

                    {!carregandoItens && itens.length > 0 && (
                      <ul className="lista-itens-modelo">
                        {itens.map((item) => (
                          <li key={item.id}>
                            <strong>{item.nome}</strong>
                            {item.descricao && ` — ${item.descricao}`}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ListaModelosOrcamento;
