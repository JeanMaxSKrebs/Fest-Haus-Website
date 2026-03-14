import { WHATSAPP_NUMBER } from "../../config";
import { Link } from "react-router-dom";
import { MessageCircle, FileText, CalendarDays, House } from "lucide-react";

function Apresentacao() {

    const linkWhats =
        `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=Olá, gostaria de saber mais sobre o Fest Haus`

    return (

        <section className="section">

            <img
                src="/logo.jpg"
                alt="Fest Haus Logo"
                className="img-logo"
            />

            <p style={{ color: "var(--cor-texto-secundario)", marginTop: "10px" }}>
                O LUGAR PARA A SUA FESTA !
            </p>

            <div className="grid" style={{ marginTop: "25px" }}>
                {/* WHATSAPP */}
                <a
                    href={linkWhats}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp"
                    aria-label="Abrir conversa no WhatsApp"
                    title="Abrir conversa no WhatsApp"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        textDecoration: "none",
                    }}
                >
                    <MessageCircle size={18} />
                    Falar no WhatsApp
                </a>

                {/* ORÇAMENTOS */}
                <Link to="/orcamentos">
                    <button className="btn-apresentacao" type="button">
                        <FileText size={18} style={{ marginRight: "8px" }} />
                        Ver orçamentos
                    </button>
                </Link>
                {/* DATAS */}
                <Link to="/agendamento">
                    <button className="btn-apresentacao" type="button">
                        <CalendarDays size={18} style={{ marginRight: "8px" }} />
                        Ver datas disponíveis
                    </button>
                </Link>

                {/* VISITA */}
                <Link to="/visitas">
                    <button className="btn-apresentacao" type="button">
                        <House size={18} style={{ marginRight: "8px" }} />
                        Agende sua visita
                    </button>
                </Link>


            </div>

        </section>

    )
}

export default Apresentacao