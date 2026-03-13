import { useEffect, useState } from "react";
import { Plus, Trash2, Shield } from "lucide-react";
import { apiFetch } from "../../lib/api";

type AdminUsuario = {
  id: string;
  nome?: string | null;
  email: string;
  is_admin: boolean;
};

export default function AdicionarAdmins() {
  const [admins, setAdmins] = useState<AdminUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [emailNovoAdmin, setEmailNovoAdmin] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function buscarAdmins() {
    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const data = await apiFetch("/api/admins");
      setAdmins(data);
    } catch (error: any) {
      console.error("Erro ao buscar admins:", error);
      setErro(error.message || "Não foi possível carregar os administradores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    buscarAdmins();
  }, []);

  async function adicionarAdmin() {
    try {
      if (!emailNovoAdmin.trim()) {
        setErro("Informe o email do usuário.");
        return;
      }

      setSalvando(true);
      setErro("");
      setSucesso("");

      await apiFetch("/api/admins/promover", {
        method: "PUT",
        body: JSON.stringify({
          email: emailNovoAdmin.trim().toLowerCase(),
        }),
      });

      setEmailNovoAdmin("");
      setSucesso("Administrador adicionado com sucesso.");
      await buscarAdmins();
    } catch (error: any) {
      console.error("Erro ao adicionar admin:", error);
      setErro(error.message || "Não foi possível adicionar o admin.");
    } finally {
      setSalvando(false);
    }
  }

  async function removerAdmin(id: string) {
    try {
      setErro("");
      setSucesso("");

      await apiFetch(`/api/admins/${id}/remover`, {
        method: "PUT",
      });

      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
      setSucesso("Administrador removido com sucesso.");
    } catch (error: any) {
      console.error("Erro ao remover admin:", error);
      setErro(error.message || "Não foi possível remover o admin.");
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <span className="admin-page-badge">Administração</span>
        <h1 className="admin-page-title">Adicionar Admins</h1>
        <p className="admin-page-subtitle">
          Gerencie os usuários com acesso administrativo ao sistema.
        </p>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-top">
          <div className="admin-form-group">
            <input
              type="email"
              placeholder="Digite o email do usuário"
              value={emailNovoAdmin}
              onChange={(e) => setEmailNovoAdmin(e.target.value)}
              className="admin-input"
            />

            <button
              type="button"
              onClick={adicionarAdmin}
              className="admin-primary-button"
              disabled={salvando}
            >
              <Plus size={18} />
              <span>{salvando ? "Adicionando..." : "Adicionar Novo Admin"}</span>
            </button>
          </div>
        </div>

        {erro && <p className="admin-message-error">{erro}</p>}
        {sucesso && <p className="admin-message-success">{sucesso}</p>}

        {loading ? (
          <p className="admin-message-info">Carregando administradores...</p>
        ) : admins.length === 0 ? (
          <p className="admin-message-info">Nenhum administrador encontrado.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Função</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-icon">
                          <Shield className="admin-icon-svg" />
                        </div>

                        <div className="admin-user-name">
                          {admin.nome || "Sem nome"}
                        </div>
                      </div>
                    </td>

                    <td>{admin.email}</td>

                    <td>
                      <span className="admin-role-badge aprovado">Admin</span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="admin-icon-button danger"
                        onClick={() => removerAdmin(admin.id)}
                        title="Remover admin"
                      >
                        <Trash2 className="admin-icon-svg" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}