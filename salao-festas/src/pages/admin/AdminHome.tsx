import { Link } from "react-router-dom";
import {
  Users,
  FileText,
  Calendar,
  MapPin,
  Wrench,
  Image,
} from "lucide-react";

export function AdminHome() {
  const adminOptions = [
    {
      title: "Adicionar Admins",
      description: "Gerencie os administradores do sistema.",
      icon: Users,
      path: "/admin/adicionar-admins",
    },
    {
      title: "Ajustar Orçamentos",
      description: "Visualize e edite orçamentos enviados.",
      icon: FileText,
      path: "/admin/ajustar-orcamentos",
    },
    {
      title: "Ver Agendamentos",
      description: "Gerencie agendamentos solicitados.",
      icon: Calendar,
      path: "/admin/ver-agendamentos",
    },
    {
      title: "Ver Visitas",
      description: "Acompanhe visitas técnicas agendadas.",
      icon: MapPin,
      path: "/admin/ver-visitas",
    },
    {
      title: "Ajustar Serviços",
      description: "Configure os serviços oferecidos.",
      icon: Wrench,
      path: "/admin/ajustar-servicos",
    },
    {
      title: "Ajustar Galeria",
      description: "Gerencie imagens da galeria.",
      icon: Image,
      path: "/admin/ajustar-galeria",
    },
  ];

  return (
    <section className="admin-home-page">
      <div className="admin-home-container">
        <div className="admin-home-header">
          <span className="admin-home-badge">Administração</span>

          <h1 className="admin-home-title">Painel Administrativo</h1>

          <p className="admin-home-subtitle">
            Selecione uma área para gerenciar o sistema da Fest Haus.
          </p>
        </div>

        <div className="admin-home-grid">
          {adminOptions.map((option) => {
            const Icon = option.icon;

            return (
              <Link key={option.path} to={option.path} className="admin-card-link">
                <article className="admin-card">
                  <div className="admin-card-top">
                    <div className="admin-card-icon">
                      <Icon size={28} />
                    </div>

                    <div className="admin-card-content">
                      <h2 className="admin-card-title">{option.title}</h2>
                      <p className="admin-card-description">{option.description}</p>
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

        <div className="admin-home-footer">
          <Link to="/" className="admin-home-back-button">
            Voltar ao site
          </Link>
        </div>
      </div>
    </section>
  );
}