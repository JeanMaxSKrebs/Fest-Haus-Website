import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  MapPin,
  Wrench,
  Image,
  ArrowLeft,
} from "lucide-react";

export default function AdminLayout() {
  const location = useLocation();

  const menuItems = [
    { label: "Painel", path: "/admin", icon: LayoutDashboard },
    { label: "Adicionar Admins", path: "/admin/adicionar-admins", icon: Users },
    { label: "Ajustar Orçamentos", path: "/admin/ajustar-orcamentos", icon: FileText },
    { label: "Ver Agendamentos", path: "/admin/ver-agendamentos", icon: Calendar },
    { label: "Ver Visitas", path: "/admin/ver-visitas", icon: MapPin },
    { label: "Ajustar Serviços", path: "/admin/ajustar-servicos", icon: Wrench },
    { label: "Ajustar Galeria", path: "/admin/ajustar-galeria", icon: Image },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2 className="admin-sidebar-title">Fest Haus</h2>
          <p className="admin-sidebar-subtitle">Painel administrativo</p>
        </div>

        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const ativo =
              location.pathname === item.path ||
              (item.path !== "/admin" &&
                location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-sidebar-link ${ativo ? "active" : ""}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-sidebar-back">
            <ArrowLeft size={16} />
            Voltar ao site
          </Link>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}