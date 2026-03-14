import type { ItemModelo, ModeloOrcamento } from "../../pages/Orcamentos";

type Props = {
  modelo: ModeloOrcamento;
  itens: ItemModelo[];
  carregando: boolean;
};

export default function DetalhesModeloOrcamento({
  modelo,
  itens,
  carregando,
}: Props) {
  return (
    <div
      style={{
        marginTop: "24px",
        border: "1px solid var(--cor-borda)",
        borderRadius: "14px",
        padding: "16px",
        background: "var(--cor-fundo-secundario)",
      }}
    >
      <h3 style={{ marginBottom: "10px" }}>Itens do modelo: {modelo.nome}</h3>

      {carregando ? (
        <p>Carregando itens...</p>
      ) : itens.length === 0 ? (
        <p>Esse modelo não possui itens cadastrados.</p>
      ) : (
        <ul style={{ paddingLeft: "20px", margin: 0 }}>
          {itens.map((item) => (
            <li key={item.id} style={{ marginBottom: "10px" }}>
              <strong>{item.nome}</strong>
              {item.descricao ? ` — ${item.descricao}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
