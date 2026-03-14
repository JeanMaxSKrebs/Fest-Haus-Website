import { Link } from "react-router-dom";
import { ClipboardList, FileStack, ListChecks } from "lucide-react";

export default function AjustarOrcamentos() {
  const opcoes = [
    {
      titulo: "Solicitações dos Clientes",
      descricao:
        "Visualize pedidos enviados pelos clientes, atualize status e converta boas solicitações em modelos.",
      icone: ClipboardList,
      rota: "/admin/orcamentos/solicitacoes",
    },
    {
      titulo: "Modelos Pré-prontos",
      descricao:
        "Gerencie os orçamentos prontos por tipo de serviço, como Casamentos, Aniversários e Formaturas.",
      icone: FileStack,
      rota: "/admin/orcamentos/modelos",
    },
    {
      titulo: "Itens do Modelo",
      descricao:
        "Visualize e ajuste os itens incluídos em cada modelo de orçamento.",
      icone: ListChecks,
      rota: "/admin/orcamentos/itens",
    },
  ];

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <span className="admin-page-badge">Administração</span>
        <h1 className="admin-page-title">Ajustar Orçamentos</h1>
        <p className="admin-page-subtitle">
          Escolha a área que deseja gerenciar dentro do módulo de orçamentos.
        </p>
      </div>

      <div className="admin-home-grid">
        {opcoes.map((opcao) => {
          const Icone = opcao.icone;

          return (
            <Link
              key={opcao.rota}
              to={opcao.rota}
              className="admin-card-link"
            >
              <article className="admin-card">
                <div className="admin-card-top">
                  <div className="admin-card-icon">
                    <Icone size={28} />
                  </div>

                  <div className="admin-card-content">
                    <h2 className="admin-card-title">{opcao.titulo}</h2>
                    <p className="admin-card-description">{opcao.descricao}</p>
                  </div>
                </div>

                <div className="admin-card-footer">
                  <span className="admin-card-action">Acessar área →</span>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}