import { WHATSAPP_NUMBER } from "../../config";
import { Link } from "react-router-dom";

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

                {/* ORÇAMENTO */}
                <a
                    href={linkWhats}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp"
                >
                    📋 Solicitar orçamento
                </a>

                {/* DATAS */}
                <Link to="/agendamento">
                    <button className="btn-apresentacao">
                        📅 Ver datas disponíveis
                    </button>
                </Link>

                {/* VISITA */}
                <Link to="/visitas">
                    <button className="btn-apresentacao">
                        🏠 Agende sua visita
                    </button>
                </Link>

            </div>

        </section>

    )
}

export default Apresentacao