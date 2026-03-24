import { Routes, Route } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./context/AuthContext";

import Header from "./components/Header";
import Home from "./pages/Home";
import Agendamento from "./pages/Agendamento";
import Orcamentos from "./pages/Orcamentos";
import Visitas from "./pages/Visitas";
import Perfil from "./pages/Perfil";
import MinhasFestas from "./pages/MinhasFestas";
import MinhasFestasDetalhe from "./pages/MinhasFestasDetalhe";
import Moedas from "./pages/Moedas";
import Suporte from "./pages/Suporte";
import LoginModal from "./components/LoginModal";

import AdminRoute from "./components/Admin/AdminRoute";
import AdminLayout from "./components/Admin/AdminLayout";
import { AdminHome } from "./pages/admin/AdminHome";
import AdicionarAdmins from "./pages/admin/AdicionarAdmins";
import VerAgendamentos from "./pages/admin/VerAgendamentos";
import VerFestas from "./pages/admin/VerFestas";
import AjustarOrcamentos from "./pages/admin/orcamento/AjustarOrcamentos";
import SolicitacoesOrcamento from "./pages/admin/orcamento/SolicitacoesOrcamento";
import ModelosOrcamento from "./pages/admin/orcamento/ModelosOrcamento";
import ItensModeloOrcamento from "./pages/admin/orcamento/ItensModeloOrcamento";
import VerVisitas from "./pages/admin/VerVisitas";
import AjustarServicos from "./pages/admin/AjustarServicos";
import AjustarGaleria from "./pages/admin/AjustarGaleria";

type PageTitleProps = {
  title: string;
  children: ReactNode;
};

function PageTitle({ title, children }: PageTitleProps) {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [minhasFestasDetalheTitle, setMinhasFestasDetalheTitle] = useState(
    "Detalhe da Festa | Fest Haus"
  );

  const LoginRequired = (
    <PageTitle title="Login necessário | Fest Haus">
      <div className="section">
        <h2>Login necessário</h2>
        <br />
        <p>Você precisa estar logado para acessar.</p>
        <br />

        <button
          onClick={() => setMostrarLogin(true)}
          className="btn-apresentacao"
        >
          Fazer Login
        </button>

        {mostrarLogin && (
          <LoginModal onClose={() => setMostrarLogin(false)} />
        )}
      </div>
    </PageTitle>
  );

  return (
    <>
      <Header />

      <Routes>
        <Route
          path="/"
          element={
            <PageTitle title="Fest Haus - Salão de Festas">
              <Home />
            </PageTitle>
          }
        />


        <Route
          path="/agendamento"
          element={
            user ? (
              <PageTitle title="Agendamento | Fest Haus">
                <Agendamento />
              </PageTitle>
            ) : (
              LoginRequired
            )
          }
        />

        <Route
          path="/visitas"
          element={
            user ? (
              <PageTitle title="Visitas | Fest Haus">
                <Visitas />
              </PageTitle>
            ) : (
              LoginRequired
            )
          }
        />

        <Route
          path="/orcamentos"
          element={
            user ? (
              <PageTitle title="Orçamentos | Fest Haus">
                <Orcamentos />
              </PageTitle>
            ) : (
              LoginRequired
            )
          }
        />

        <Route
          path="/perfil"
          element={
            user ? (
              <PageTitle title="Meu Perfil | Fest Haus">
                <Perfil />
              </PageTitle>
            ) : (
              LoginRequired
            )
          }
        />

        <Route
          path="/minhas-festas"
          element={
            user ? (
              <PageTitle title="Minhas Festas | Fest Haus">
                <MinhasFestas />
              </PageTitle>
            ) : (
              LoginRequired
            )
          }
        />

        <Route
          path="/minhas-festas/:id"
          element={
            user ? (
              <PageTitle title={minhasFestasDetalheTitle}>
                <MinhasFestasDetalhe
                  setPageTitle={setMinhasFestasDetalheTitle}
                />
              </PageTitle>
            ) : (
              LoginRequired
            )
          }
        />

        <Route
          path="/moedas"
          element={
            user ? (
              <PageTitle title="Moedas | Fest Haus">
                <Moedas />
              </PageTitle>
            ) : (
              LoginRequired
            )
          }
        />


        <Route
          path="/suporte"
          element={
            <PageTitle title="Suporte | Fest Haus">
              <Suporte />
            </PageTitle>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <PageTitle title="Painel Admin | Fest Haus">
                <AdminLayout />
              </PageTitle>
            </AdminRoute>
          }
        >
          <Route
            index
            element={
              <PageTitle title="Admin Home | Fest Haus">
                <AdminHome />
              </PageTitle>
            }
          />

          <Route
            path="adicionar-admins"
            element={
              <PageTitle title="Adicionar Admins | Fest Haus">
                <AdicionarAdmins />
              </PageTitle>
            }
          />

          <Route
            path="ajustar-orcamentos"
            element={
              <PageTitle title="Ajustar Orçamentos | Fest Haus">
                <AjustarOrcamentos />
              </PageTitle>
            }
          />

          <Route
            path="orcamentos"
            element={
              <PageTitle title="Orçamentos | Fest Haus">
                <AjustarOrcamentos />
              </PageTitle>
            }
          />

          <Route
            path="orcamentos/solicitacoes"
            element={
              <PageTitle title="Solicitações de Orçamento | Fest Haus">
                <SolicitacoesOrcamento />
              </PageTitle>
            }
          />

          <Route
            path="orcamentos/modelos"
            element={
              <PageTitle title="Modelos de Orçamento | Fest Haus">
                <ModelosOrcamento />
              </PageTitle>
            }
          />

          <Route
            path="orcamentos/itens"
            element={
              <PageTitle title="Itens do Modelo | Fest Haus">
                <ItensModeloOrcamento />
              </PageTitle>
            }
          />

          <Route
            path="ver-agendamentos"
            element={
              <PageTitle title="Ver Agendamentos | Fest Haus">
                <VerAgendamentos />
              </PageTitle>
            }
          />

          <Route
            path="ver-festas"
            element={
              <PageTitle title="Ver Festas | Fest Haus">
                <VerFestas />
              </PageTitle>
            }
          />

          <Route
            path="ver-visitas"
            element={
              <PageTitle title="Ver Visitas | Fest Haus">
                <VerVisitas />
              </PageTitle>
            }
          />

          <Route
            path="ajustar-servicos"
            element={
              <PageTitle title="Ajustar Serviços | Fest Haus">
                <AjustarServicos />
              </PageTitle>
            }
          />




          <Route
            path="ajustar-galeria"
            element={
              <PageTitle title="Ajustar Galeria | Fest Haus">
                <AjustarGaleria />
              </PageTitle>
            }
          />
        </Route>
      </Routes>
    </>
  );
}

export default AppRoutes;