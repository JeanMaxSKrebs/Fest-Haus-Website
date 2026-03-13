import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";

import Header from "./components/Header";
import Home from "./pages/Home";
import Agendamento from "./pages/Agendamento";
import Orcamentos from "./pages/Orcamento";
import Visitas from "./pages/Visitas";
import LoginModal from "./components/LoginModal";
import AdminRoute from "./components/Admin/AdminRoute";
import { AdminHome } from "./pages/admin/AdminHome";

function AppRoutes() {
  const { user } = useAuth();
  const [mostrarLogin, setMostrarLogin] = useState(false);

  const LoginRequired = (
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
  );

  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/agendamento"
          element={user ? <Agendamento /> : LoginRequired}
        />

        <Route
          path="/visitas"
          element={user ? <Visitas /> : LoginRequired}
        />

        <Route path="/orcamentos" element={<Orcamentos />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminHome />
            </AdminRoute>
          }
        />
      </Routes>
    </>
  );
}

export default AppRoutes;