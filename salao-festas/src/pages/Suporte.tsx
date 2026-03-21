import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { WHATSAPP_NUMBER } from "../config";

export default function Suporte() {
    const { user } = useAuth();

    const mensagemBase = useMemo(() => {
        const email = user?.email || "não informado";
        const nome =
            user?.user_metadata?.full_name ||
            user?.user_metadata?.name ||
            "Usuário";

        return `Olá! Preciso de suporte com minha conta da Fest Haus.

Nome: ${nome}
E-mail: ${email}

Motivo do contato:
[descreva aqui]

Se for recuperação de conta excluída, informe:
- data aproximada da exclusão
- e-mail usado na conta
- nome cadastrado`;
    }, [user]);

    const linkWhatsapp = useMemo(() => {
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagemBase)}`;
    }, [mensagemBase]);

    const linkEmail = useMemo(() => {
        const assunto = "Suporte Fest Haus";
        return `mailto:fest.haussl@gmail.com?subject=${encodeURIComponent(
            assunto
        )}&body=${encodeURIComponent(mensagemBase)}`;
    }, [mensagemBase]);

    return (
        <section className="section suporte-page">
            <div className="suporte-card">
                <div className="suporte-topo">
                    <h2>Suporte</h2>
                    <p>
                        Precisa de ajuda com sua conta, recuperação ou exclusão? Fale com a
                        equipe da Fest Haus.
                    </p>
                </div>

                <div className="suporte-box">
                    <h3>Recuperação de conta excluída</h3>
                    <p>
                        Contas marcadas para exclusão podem ser recuperadas somente pelo
                        suporte em até 30 dias.
                    </p>
                </div>

                <div className="suporte-box">
                    <h3>Fale conosco</h3>
                    <div className="suporte-acoes">
                        <a
                            className="btn-whatsapp"
                            href={linkWhatsapp}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Chamar no WhatsApp
                        </a>

                        <a className="btn-apresentacao" href={linkEmail}>
                            Enviar e-mail
                        </a>
                    </div>
                </div>

                <div className="suporte-box">
                    <h3>Mensagem sugerida</h3>
                    <textarea
                        className="suporte-textarea"
                        value={mensagemBase}
                        readOnly
                    />
                </div>
            </div>
        </section>
    );
}