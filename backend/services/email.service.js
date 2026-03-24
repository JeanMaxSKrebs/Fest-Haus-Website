import "dotenv/config";
import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || "false") === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    return transporter;
}

export async function enviarEmail({ to, subject, text, html }) {
    if (!to) return null;

    const from =
        process.env.SMTP_FROM || `"Fest Haus" <${process.env.SMTP_USER}>`;

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("Email não enviado: variáveis SMTP não configuradas corretamente.");
        console.log("DEBUG SMTP_HOST:", process.env.SMTP_HOST);
        console.log("DEBUG SMTP_USER:", process.env.SMTP_USER);
        console.log("DEBUG SMTP_PASS existe?", Boolean(process.env.SMTP_PASS));
        return null;
    }

    const client = getTransporter();

    const info = await client.sendMail({
        from,
        to,
        subject,
        text,
        html,
    });

    return info;
}