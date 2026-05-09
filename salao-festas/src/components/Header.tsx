import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import LoginModal from "./LoginModal";
import FestCoin from "./coin/FestCoin";
import { Bell, X } from "lucide-react";

type ResumoMoedasApi = {
  saldo: number;
  checkin_hoje: boolean;
};

type ResumoMoedas = {
  saldo: number;
  checkinHoje: boolean;
};

type PerfilApi = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  created_at: string | null;
};

type Notificacao = {
  id: string;
  usuario_id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  lida: boolean;
  referencia_id: string | null;
  created_at: string;
};

function formatarDataNotificacao(data: string) {
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Header() {
  const { user, signOut, isAdmin, loading } = useAuth();
  const [tema, setTema] = useState("");
  const [abrirLogin, setAbrirLogin] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");
  const [moedas, setMoedas] = useState<ResumoMoedas>({
    saldo: 0,
    checkinHoje: false,
  });
  const [carregandoMoedas, setCarregandoMoedas] = useState(false);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [abrirNotificacoes, setAbrirNotificacoes] = useState(false);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(false);  const navigate = useNavigate();
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

  useEffect(() => {
    carregarResumoMoedas();
    carregarNomeUsuario();
    carregarNotificacoesNaoLidas();
  }, [user, location.pathname]);

  useEffect(() => {
    function handleMoedasAtualizadas() {
      carregarResumoMoedas();
    }

    function handlePerfilAtualizado() {
      carregarNomeUsuario();
    }

    window.addEventListener("moedas-atualizadas", handleMoedasAtualizadas);
    window.addEventListener("perfil-atualizado", handlePerfilAtualizado);

    return () => {
      window.removeEventListener("moedas-atualizadas", handleMoedasAtualizadas);
      window.removeEventListener("perfil-atualizado", handlePerfilAtualizado);
    };
  }, [user]);



  async function carregarNomeUsuario() {
    if (!user) {
      setNomeUsuario("Usuário");
      return;
    }

    try {
      const data: PerfilApi = await apiFetch("/api/perfil");

      setNomeUsuario(
        data?.nome ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email ||
        "Usuário"
      );
    } catch (error) {
      console.error("Erro ao carregar perfil no header:", error);

      setNomeUsuario(
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email ||
        "Usuário"
      );
    }
  }

  async function carregarResumoMoedas() {
    if (!user) {
      setMoedas({
        saldo: 0,
        checkinHoje: false,
      });
      return;
    }

    try {
      setCarregandoMoedas(true);

      const data: ResumoMoedasApi = await apiFetch("/api/moedas/resumo");

      setMoedas({
        saldo: Number(data?.saldo || 0),
        checkinHoje: Boolean(data?.checkin_hoje),
      });
    } catch (error) {
      console.error("Erro ao carregar resumo de moedas:", error);

      setMoedas({
        saldo: 0,
        checkinHoje: false,
      });
    } finally {
      setCarregandoMoedas(false);
    }
  }

  async function carregarNotificacoesNaoLidas() {
    if (!user) {
      setNotificacoesNaoLidas(0);
      return;
    }

    try {
      const data = await apiFetch("/api/notificacoes/minhas/nao-lidas");
      setNotificacoesNaoLidas(Number(data?.nao_lidas || 0));
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
      setNotificacoesNaoLidas(0);
    }
  }

  async function carregarNotificacoes() {
    if (!user) {
      setNotificacoes([]);
      return;
    }

    try {
      setCarregandoNotificacoes(true);

      const data = await apiFetch("/api/notificacoes/minhas");
      setNotificacoes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar lista de notificações:", error);
      setNotificacoes([]);
    } finally {
      setCarregandoNotificacoes(false);
    }
  }

  async function toggleNotificacoes() {
    const novoEstado = !abrirNotificacoes;
    setAbrirNotificacoes(novoEstado);

    if (novoEstado) {
      await carregarNotificacoes();
      await carregarNotificacoesNaoLidas();
    }
  }

  async function abrirNotificacao(notificacao: Notificacao) {
    try {
      if (!notificacao.lida) {
        await apiFetch(`/api/notificacoes/${notificacao.id}/lida`, {
          method: "PUT",
        });

        setNotificacoes((prev) =>
          prev.map((item) =>
            item.id === notificacao.id ? { ...item, lida: true } : item
          )
        );

        setNotificacoesNaoLidas((prev) => Math.max(prev - 1, 0));
      }

      setAbrirNotificacoes(false);

      if (notificacao.link) {
        navigate(notificacao.link);
      }
    } catch (error) {
      console.error("Erro ao abrir notificação:", error);

      if (notificacao.link) {
        setAbrirNotificacoes(false);
        navigate(notificacao.link);
      }
    }
  }

  async function marcarTodasComoLidas() {
    try {
      await apiFetch("/api/notificacoes/lidas/todas", {
        method: "PUT",
      });

      setNotificacoes((prev) =>
        prev.map((item) => ({
          ...item,
          lida: true,
        }))
      );

      setNotificacoesNaoLidas(0);
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  }

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
      <div
        className="header-left"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <Link
          to="/"
          className="header-brand"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <img
            src="/logo_noname.jpeg"
            className="header-logo"
            alt="Logo Fest Haus"
          />
          <h2 className="header-title">FEST HAUS</h2>
        </Link>

        {user && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/moedas")}
                className="btn-admin-header"
                style={{
                  marginLeft: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
                title="Ir para Moedas"
              >
                <strong
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    lineHeight: 1,
                    position: "relative",
                    top: "2px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {carregandoMoedas ? "..." : moedas.saldo}
                </strong>
                <FestCoin size={24} />
              </button>

              <div
                onClick={() => navigate("/moedas")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate("/moedas");
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  border: "1px solid var(--cor-borda)",
                  background: "var(--cor-fundo-secundario)",
                  color: "inherit",
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
                title={
                  moedas.checkinHoje
                    ? "Check-in diário já realizado hoje"
                    : "Check-in diário ainda não realizado hoje"
                }
              >
                <span style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                  {moedas.checkinHoje ? "✅" : "⏳"}
                </span>
                <span>
                  {moedas.checkinHoje ? "Check-in hoje" : "Check-in pendente"}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                marginLeft: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/missoes")}
                className="btn-admin-header"
                title="Ir para Missões"
              >
                Missões
              </button>

              <button
                type="button"
                onClick={() => navigate("/tiers")}
                className="btn-admin-header"
                title="Ir para Tiers"
              >
                Tiers
              </button>
            </div>
          </div>
        )}
      </div>

      <nav className="header-nav">
        <button
          type="button"
          className="btn-header"
          onClick={() => voltarParaHome("servicos")}
        >
          Serviços
        </button>

        <button
          type="button"
          className="btn-header"
          onClick={() => voltarParaHome("galeria")}
        >
          Galeria
        </button>

        <button
          type="button"
          className="btn-header"
          onClick={() => voltarParaHome("contato")}
        >
          Contato
        </button>
      </nav>

      <div
        className="header-right"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        {loading ? (
          <span>...</span>
        ) : user ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <span>
                Olá, <strong>{nomeUsuario}</strong>
              </span>

                <div className="header-notificacoes-wrapper">
                  <button
                    type="button"
                    onClick={toggleNotificacoes}
                    className="btn-admin-header header-notificacao"
                    title="Notificações"
                  >
                    <Bell size={18} />
                    <span>Notificações</span>

                    {notificacoesNaoLidas > 0 && (
                      <span className="header-notificacao__badge">
                        {notificacoesNaoLidas > 9 ? "9+" : notificacoesNaoLidas}
                      </span>
                    )}
                  </button>

                  {abrirNotificacoes && (
                    <div className="notificacoes-popover">
                      <div className="notificacoes-popover__header">
                        <div>
                          <strong>Notificações</strong>
                          <span>
                            {notificacoesNaoLidas > 0
                              ? `${notificacoesNaoLidas} não lida(s)`
                              : "Tudo em dia"}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="notificacoes-popover__fechar"
                          onClick={() => setAbrirNotificacoes(false)}
                          title="Fechar"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {notificacoesNaoLidas > 0 && (
                        <button
                          type="button"
                          className="notificacoes-popover__marcar"
                          onClick={marcarTodasComoLidas}
                        >
                          Marcar todas como lidas
                        </button>
                      )}

                      <div className="notificacoes-popover__lista">
                        {carregandoNotificacoes ? (
                          <div className="notificacoes-popover__vazio">
                            Carregando notificações...
                          </div>
                        ) : notificacoes.length === 0 ? (
                          <div className="notificacoes-popover__vazio">
                            Nenhuma notificação ainda.
                          </div>
                        ) : (
                          notificacoes.map((notificacao) => (
                            <button
                              key={notificacao.id}
                              type="button"
                              className={`notificacoes-popover__item ${notificacao.lida ? "lida" : "nao-lida"
                                }`}
                              onClick={() => abrirNotificacao(notificacao)}
                            >
                              <div className="notificacoes-popover__item-topo">
                                <strong>{notificacao.titulo}</strong>

                                {!notificacao.lida && (
                                  <span className="notificacoes-popover__novo">Nova</span>
                                )}
                              </div>

                              <p>{notificacao.mensagem}</p>

                              <small>{formatarDataNotificacao(notificacao.created_at)}</small>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              <button
                type="button"
                onClick={() => navigate("/perfil")}
                className="btn-admin-header"
              >
                Perfil
              </button>

              <button
                type="button"
                onClick={() => navigate("/minhas-festas")}
                className="btn-admin-header"
              >
                Minhas Festas
              </button>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() =>
                  location.pathname === "/admin"
                    ? navigate("/")
                    : navigate("/admin")
                }
                className="btn-admin-header"
              >
                {location.pathname.startsWith("/admin")
                  ? "Visão do Usuário"
                  : "Admin"}
              </button>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              disabled={saindo}
              style={{
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