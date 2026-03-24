import "dotenv/config";
import { enviarEmail } from "./services/email.service.js";

async function testar() {
    try {
        console.log("SMTP_HOST:", process.env.SMTP_HOST);
        console.log("SMTP_USER:", process.env.SMTP_USER);
        console.log("SMTP_PASS existe?", Boolean(process.env.SMTP_PASS));

        const result = await enviarEmail({
            to: "fest.haussl@gmail.com",
            subject: "Teste Fest Haus 🚀",
            text: "Email funcionando!",
            html: "<h1>Email funcionando 🚀</h1>",
        });

        console.log("Email enviado:", result);
    } catch (error) {
        console.error("Erro ao enviar email:", error);
    }
}

testar();