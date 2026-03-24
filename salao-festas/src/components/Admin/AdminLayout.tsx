import { Link, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  MapPin,
  Wrench,
  Image,
  ArrowLeft,
  PartyPopper,
  Menu,
  X,
} from "lucide-react";

export default function AdminLayout() {
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  const menuItems = [
    { label: "Painel", path: "/admin", icon: LayoutDashboard },
    { label: "Adicionar Admins", path: "/admin/adicionar-admins", icon: Users },
    { label: "Ajustar Orçamentos", path: "/admin/ajustar-orcamentos", icon: FileText },
    { label: "Ver Agendamentos", path: "/admin/ver-agendamentos", icon: Calendar },
    { label: "Ver Festas", path: "/admin/ver-festas", icon: PartyPopper },
    { label: "Ver Visitas", path: "/admin/ver-visitas", icon: MapPin },
    { label: "Ajustar Serviços", path: "/admin/ajustar-servicos", icon: Wrench },
    { label: "Ajustar Galeria", path: "/admin/ajustar-galeria", icon: Image },
  ];

  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 900) {
        setMenuAberto(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="admin-layout">
      <button
        type="button"
        className="admin-mobile-toggle"
        onClick={() => setMenuAberto(true)}
        aria-label="Abrir menu administrativo"
      >
        <Menu size={22} />
        <span>Menu admin</span>
      </button>

      {menuAberto && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          onClick={() => setMenuAberto(false)}
          aria-label="Fechar menu"
        />
      )}

      <aside className={`admin-sidebar ${menuAberto ? "open" : ""}`}>
        <div className="admin-sidebar-header-wrap">
          <div className="admin-sidebar-header">
            <h2 className="admin-sidebar-title">Fest Haus</h2>
            <p className="admin-sidebar-subtitle">Painel administrativo</p>
          </div>

          <button
            type="button"
            className="admin-sidebar-close"
            onClick={() => setMenuAberto(false)}
            aria-label="Fechar menu administrativo"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const ativo =
              location.pathname === item.path ||
              (item.path !== "/admin" && location.pathname.startsWith(item.path));

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