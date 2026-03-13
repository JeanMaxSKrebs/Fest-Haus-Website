import { useEffect, useState } from "react";
import { Plus, Trash2, Shield } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

type AdminUsuario = {
  id: string;
  nome: string | null;
  email: string;
  is_admin: boolean;
};

export default function AdicionarAdmins() {
  const [admins, setAdmins] = useState<AdminUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [emailNovoAdmin, setEmailNovoAdmin] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function buscarAdmins() {
    try {
      setLoading(true);
      setErro("");

      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome, email, is_admin")
        .eq("is_admin", true)
        .order("nome", { ascending: true });

      if (error) throw error;

      setAdmins(data || []);
    } catch (error) {
      console.error("Erro ao buscar admins:", error);
      setErro("Não foi possível carregar os administradores.");
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
        setErro("Informe o email do usuário que será admin.");
        return;
      }

      setSalvando(true);
      setErro("");

      const emailTratado = emailNovoAdmin.trim().toLowerCase();

      const { data, error } = await supabase
        .from("usuarios")
        .update({ is_admin: true })
        .eq("email", emailTratado)
        .select("id");

      if (error) throw error;

      if (!data || data.length === 0) {
        setErro("Nenhum usuário com esse email foi encontrado.");
        return;
      }

      setEmailNovoAdmin("");
      await buscarAdmins();
    } catch (error) {
      console.error("Erro ao adicionar admin:", error);
      setErro("Não foi possível adicionar o administrador.");
    } finally {
      setSalvando(false);
    }
  }

  async function removerAdmin(id: string) {
    try {
      setErro("");

      const { error } = await supabase
        .from("usuarios")
        .update({ is_admin: false })
        .eq("id", id);

      if (error) throw error;

      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
    } catch (error) {
      console.error("Erro ao remover admin:", error);
      setErro("Não foi possível remover o administrador.");
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
                          <Shield size={18} />
                        </div>

                        <div className="admin-user-name">
                          {admin.nome || "Sem nome"}
                        </div>
                      </div>
                    </td>

                    <td>{admin.email}</td>

                    <td>
                      <span className="admin-role-badge">Admin</span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="admin-icon-button danger"
                        onClick={() => removerAdmin(admin.id)}
                        title="Remover admin"
                      >
                        <Trash2 size={18} />
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