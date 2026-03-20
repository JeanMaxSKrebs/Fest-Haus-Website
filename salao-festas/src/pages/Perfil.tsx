import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

type PerfilData = {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    created_at: string | null;
};

export default function Perfil() {
    const { user } = useAuth();

    const [perfil, setPerfil] = useState<PerfilData>({
        id: "",
        nome: "",
        email: user?.email || "",
        telefone: "",
        created_at: null,
    });

    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    const provedores = useMemo(() => {
        return user?.app_metadata?.providers || [];
    }, [user]);

    const contaSomenteGoogle = useMemo(() => {
        return provedores.includes("google") && !provedores.includes("email");
    }, [provedores]);

    useEffect(() => {
        carregarPerfil();
    }, [user]);

    async function carregarPerfil() {
        if (!user) return;

        setCarregando(true);
        setErro("");
        setSucesso("");

        try {
            const data = await apiFetch("/api/perfil");

            setPerfil({
                id: data.id || user.id,
                nome:
                    data.nome ||
                    user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    "",
                email: data.email || user.email || "",
                telefone: data.telefone || "",
                created_at: data.created_at || null,
            });
        } catch (error: any) {
            console.error("Erro carregarPerfil:", error);
            setErro(error?.message || "Não foi possível carregar o perfil.");
        } finally {
            setCarregando(false);
        }
    }

    async function atualizarPerfil(e: React.FormEvent) {
        e.preventDefault();

        setAtualizando(true);
        setErro("");
        setSucesso("");

        try {
            const data = await apiFetch("/api/perfil", {
                method: "PUT",
                body: JSON.stringify({
                    nome: perfil.nome,
                    telefone: perfil.telefone,
                }),
            });

            setPerfil((prev) => ({
                ...prev,
                ...data,
            }));

            setSucesso("Perfil atualizado com sucesso.");
            window.dispatchEvent(new Event("perfil-atualizado"));
        } catch (error: any) {
            console.error("Erro atualizarPerfil:", error);
            setErro(error?.message || "Não foi possível atualizar o perfil.");
        } finally {
            setAtualizando(false);
        }
    }

    return (
        <section className="section perfil-page">
            <div className="perfil-card">
                <div className="perfil-topo">
                    <h2>Meu perfil</h2>
                    <p>Atualize seus dados da conta.</p>
                </div>

                {contaSomenteGoogle ? (
                    <div className="perfil-msg perfil-msg--info">
                        Sua conta está vinculada ao Google. Para entrar no sistema, use o
                        login com Google. Alteração de e-mail e senha não está disponível
                        por aqui.
                    </div>
                ) : null}

                {erro ? <div className="perfil-msg perfil-msg--erro">{erro}</div> : null}
                {sucesso ? (
                    <div className="perfil-msg perfil-msg--sucesso">{sucesso}</div>
                ) : null}

                {carregando ? (
                    <p>Carregando perfil...</p>
                ) : (
                    <form className="perfil-form" onSubmit={atualizarPerfil}>
                        <div className="perfil-field">
                            <label htmlFor="nome">Nome</label>
                            <input
                                id="nome"
                                type="text"
                                value={perfil.nome}
                                onChange={(e) =>
                                    setPerfil((prev) => ({ ...prev, nome: e.target.value }))
                                }
                                required
                            />
                        </div>

                        <div className="perfil-field">
                            <label htmlFor="email">E-mail</label>
                            <input
                                id="email"
                                type="email"
                                value={perfil.email}
                                disabled
                                title={
                                    contaSomenteGoogle
                                        ? "Conta vinculada ao Google"
                                        : "E-mail não pode ser alterado por aqui"
                                }
                            />
                        </div>

                        <div className="perfil-field perfil-field--full">
                            <label htmlFor="telefone">Telefone</label>
                            <input
                                id="telefone"
                                type="text"
                                value={perfil.telefone}
                                onChange={(e) =>
                                    setPerfil((prev) => ({
                                        ...prev,
                                        telefone: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="perfil-acoes">
                            <button
                                type="submit"
                                className="btn-apresentacao"
                                disabled={atualizando}
                            >
                                {atualizando ? "Atualizando..." : "Atualizar perfil"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </section>
    );
}