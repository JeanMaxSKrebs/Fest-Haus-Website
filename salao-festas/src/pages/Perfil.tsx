import { useEffect, useState } from "react";
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
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    useEffect(() => {
        carregarPerfil();
    }, [user]);

    async function carregarPerfil() {
        if (!user) return;

        setCarregando(true);
        setErro("");
        setSucesso("");

        try {
            const response = await apiFetch("/api/perfil");

            if (!response.ok) {
                throw new Error("Não foi possível carregar o perfil.");
            }

            const data = await response.json();

            setPerfil({
                id: data.id || user.id,
                nome: data.nome || user.user_metadata?.full_name || "",
                email: data.email || user.email || "",
                telefone: data.telefone || "",
                created_at: data.created_at || null,
            });
        } catch (error) {
            console.error("Erro carregarPerfil:", error);
            setErro("Não foi possível carregar o perfil.");
        } finally {
            setCarregando(false);
        }
    }

    async function salvarPerfil(e: React.FormEvent) {
        e.preventDefault();

        setSalvando(true);
        setErro("");
        setSucesso("");

        try {
            const response = await apiFetch("/api/perfil", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nome: perfil.nome,
                    telefone: perfil.telefone,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || "Não foi possível salvar o perfil.");
            }

            setPerfil((prev) => ({
                ...prev,
                ...data,
            }));

            setSucesso("Perfil atualizado com sucesso.");
        } catch (error: any) {
            console.error("Erro salvarPerfil:", error);
            setErro(error?.message || "Não foi possível salvar o perfil.");
        } finally {
            setSalvando(false);
        }
    }

    return (
        <section className="section perfil-page">
            <div className="perfil-card">
                <div className="perfil-topo">
                    <h2>Meu perfil</h2>
                    <p>Atualize seus dados da conta.</p>
                </div>

                {erro ? <div className="perfil-msg perfil-msg--erro">{erro}</div> : null}
                {sucesso ? <div className="perfil-msg perfil-msg--sucesso">{sucesso}</div> : null}

                {carregando ? (
                    <p>Carregando perfil...</p>
                ) : (
                    <form className="perfil-form" onSubmit={salvarPerfil}>
                        <div className="perfil-field">
                            <label htmlFor="nome">Nome</label>
                            <input
                                id="nome"
                                type="text"
                                value={perfil.nome}
                                onChange={(e) => setPerfil((prev) => ({ ...prev, nome: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="perfil-field">
                            <label htmlFor="email">E-mail</label>
                            <input id="email" type="email" value={perfil.email} disabled />
                        </div>

                        <div className="perfil-field">
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

                        <button type="submit" className="btn-apresentacao" disabled={salvando}>
                            {salvando ? "Salvando..." : "Salvar perfil"}
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
}