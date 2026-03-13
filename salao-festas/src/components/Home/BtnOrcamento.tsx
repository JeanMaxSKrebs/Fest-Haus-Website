import { WHATSAPP_NUMBER } from "../../config"; // ajuste o caminho se necessário

function BtnOrcamento({ servico }: { servico: string }) {
  const mensagens: Record<string, string> = {
    "Casamentos": `Olá, gostaria de solicitar um orçamento para casamentos`,
    "Aniversários": `Olá, gostaria de solicitar um orçamento para aniversários`,
    "Eventos Corporativos": `Olá, gostaria de solicitar um orçamento para eventos corporativos`,
    "Formaturas": `Olá, gostaria de solicitar um orçamento para formaturas`,
    "Festas Infantis": `Olá, gostaria de solicitar um orçamento para festas infantis`,
    "Eventos Personalizados": `Olá, gostaria de solicitar um orçamento para um evento personalizado`,
  }

  const mensagem = mensagens[servico] || `Olá, gostaria de solicitar um orçamento para ${servico}`
  const linkWhats = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(mensagem)}`

  return (
    <a
      href={linkWhats}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-whatsapp"
      style={{ marginTop: "20px" }}
    >
      📋 Solicitar orçamento para {servico}
    </a>
  )
}

export default BtnOrcamento