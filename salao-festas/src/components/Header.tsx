import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginModal from "./LoginModal";

function Header() {
  const { user, signOut, isAdmin, loading } = useAuth();
  const [tema, setTema] = useState("");
  const [abrirLogin, setAbrirLogin] = useState(false);
  const [saindo, setSaindo] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const temaSalvo = localStorage.getItem("tema");
    if (temaSalvo) {
      document.documentElement.className = temaSalvo;
      setTema(temaSalvo);
    } else {
      const temaAtual = document.documentElement.className || "light";
      document.documentElement.className = temaAtual;
      setTema(temaAtual);
    }
  }, []);

  function alternarTema() {
    const novoTema = tema === "dark" ? "light" : "dark";
    document.documentElement.className = novoTema;
    localStorage.setItem("tema", novoTema);
    setTema(novoTema);
  }

  function voltarParaHome(secao?: string) {
    if (location.pathname !== "/") {
      navigate("/");

      if (secao) {
        setTimeout(() => {
          document
            .getElementById(secao)
            ?.scrollIntoView({ behavior: "smooth" });
        }, 200);
      }
    } else if (secao) {
      document.getElementById(secao)?.scrollIntoView({ behavior: "smooth" });
    }
  }

  async function handleSignOut() {
    try {
      setSaindo(true);
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      setSaindo(false);
    }
  }

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="header-brand">
          <img
            src="/logo_noname.jpeg"
            className="header-logo"
            alt="Logo Fest Haus"
          />
          <h2 className="header-title">Fest Haus</h2>
        </Link>
      </div>

      <nav className="header-nav">
        <button type="button" onClick={() => voltarParaHome("servicos")}>
          Serviços
        </button>
        <button type="button" onClick={() => voltarParaHome("galeria")}>
          Galeria
        </button>
        <button type="button" onClick={() => voltarParaHome("contato")}>
          Contato
        </button>
      </nav>

      <div className="header-right">
        {loading ? (
          <span style={{ marginRight: "15px" }}>...</span>
        ) : user ? (
          <>
            <span style={{ marginRight: "15px" }}>
              Olá, {user.user_metadata?.full_name || user.email}
            </span>

            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="btn-admin-header"
                style={{ marginRight: "15px" }}
              >
                Admin
              </button>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              disabled={saindo}
              style={{
                marginRight: "15px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                font: "inherit",
              }}
            >
              {saindo ? "Saindo..." : "Sair"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setAbrirLogin(true)}
            style={{
              marginRight: "15px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              font: "inherit",
            }}
          >
            Login / Cadastro
          </button>
        )}

        <button type="button" className="btn-tema" onClick={alternarTema}>
          {tema === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      {abrirLogin && <LoginModal onClose={() => setAbrirLogin(false)} />}
    </header>
  );
}

export default Header;