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
      description: "Gerencie os administradores do sistema",
      icon: Users,
      path: "/admin/adicionar-admins",
    },
    {
      title: "Ajustar Orçamentos",
      description: "Visualize e edite orçamentos enviados",
      icon: FileText,
      path: "/admin/ajustar-orcamentos",
    },
    {
      title: "Ver Agendamentos",
      description: "Gerencie agendamentos solicitados",
      icon: Calendar,
      path: "/admin/ver-agendamentos",
    },
    {
      title: "Ver Visitas",
      description: "Acompanhe visitas técnicas agendadas",
      icon: MapPin,
      path: "/admin/ver-visitas",
    },
    {
      title: "Ajustar Serviços",
      description: "Configure os serviços oferecidos",
      icon: Wrench,
      path: "/admin/ajustar-servicos",
    },
    {
      title: "Ajustar Galeria",
      description: "Gerencie imagens da galeria",
      icon: Image,
      path: "/admin/ajustar-galeria",
    },
  ];

  return (
    <section className="min-h-screen bg-[#0f0f0f] text-white px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block text-sm uppercase tracking-[0.3em] text-[#c8a96b] mb-4">
            Administração
          </span>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Painel Administrativo
          </h1>

          <p className="text-gray-300 max-w-2xl mx-auto text-base md:text-lg">
            Selecione uma área para gerenciar o sistema da Fest Haus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {adminOptions.map((option) => {
            const Icon = option.icon;

            return (
              <Link key={option.path} to={option.path} className="group">
                <div className="h-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#c8a96b]/60 hover:bg-white/[0.08] hover:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#c8a96b]/15 border border-[#c8a96b]/30 text-[#c8a96b] shrink-0 transition-all duration-300 group-hover:bg-[#c8a96b]/20">
                      <Icon size={28} />
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold mb-2 group-hover:text-[#e7c98f] transition-colors">
                        {option.title}
                      </h2>

                      <p className="text-gray-300 text-sm leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-white/10">
                    <span className="text-sm font-medium text-[#c8a96b] group-hover:text-[#e7c98f] transition-colors">
                      Acessar área →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-14">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-white/10 hover:border-[#c8a96b]/50"
          >
            Voltar ao site
          </Link>
        </div>
      </div>
    </section>
  );
}