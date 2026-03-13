import { WHATSAPP_NUMBER } from "../../config"; // ajuste o caminho se necessário

function Contato() {

    const linkWhats =
        `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=Olá, gostaria de mais informações sobre o Fest Haus`

    const linkInstagram =
        "https://www.instagram.com/fest.haus/"

    const linkFacebook =
        "https://www.facebook.com/p/Fest-Haus-S%C3%A3o-Leo-100054621963052/?locale=pt_BR"

    return (

        <section id="contato" className="section">

            <h2>Contato</h2>

            <p>
                Entre em contato e solicite um orçamento para seu evento
            </p>

            <div style={{
                display: "flex",
                gap: "15px",
                marginTop: "20px",
                flexWrap: "wrap",
                justifyContent: "center"
            }}>
                {/* WhatsApp */}
                <a
                    href={linkWhats}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp"
                >
                    💬 Falar no WhatsApp
                </a>


                {/* Instagram */}
                <a
                    href={linkInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-instagram"
                >
                    📷 Instagram
                </a>

                {/* Facebook */}
                <a
                    href={linkFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-facebook"
                >
                    👍 Facebook
                </a>



            </div>

        </section>

    )
}

export default Contato
